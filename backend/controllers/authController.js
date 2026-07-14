const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const Joi     = require('joi');
const UserModel = require('../models/userModel');

const registerSchema = Joi.object({
  name:       Joi.string().min(2).max(100).required(),
  email:      Joi.string().email().required(),
  password:   Joi.string().min(6).required(),
  role:       Joi.string().valid('farmer','customer').required(),
  phone:      Joi.string().min(10).max(15).required(),
  village:    Joi.string().optional().allow(''),
  district:   Joi.string().optional().allow(''),
  farm_size:  Joi.number().optional(),
  city:       Joi.string().optional().allow(''),
});

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

exports.register = async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const existing = await UserModel.findByEmail(value.email.toLowerCase());
    if (existing) return res.status(409).json({ error: 'Email already registered.' });

    const hashedPassword = await bcrypt.hash(value.password, 10);
    const user = await UserModel.create({
      name: value.name,
      email: value.email.toLowerCase(),
      hashedPassword,
      role: value.role,
      phone: value.phone
    });

    if (value.role === 'farmer') {
      await UserModel.createFarmerProfile(user.id, {
        village: value.village || '',
        district: value.district || '',
        farm_size: value.farm_size || null
      });
    } else if (value.role === 'customer') {
      await UserModel.createCustomerProfile(user.id, {
        city: value.city || '',
        address: ''
      });
    }

    const token = signToken(user);
    res.status(201).json({ message: 'Registration successful.', token, user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });

    const user = await UserModel.findByEmail(email.toLowerCase());
    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid email or password.' });

    const token = signToken(user);
    res.json({
      message: 'Login successful.',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};
