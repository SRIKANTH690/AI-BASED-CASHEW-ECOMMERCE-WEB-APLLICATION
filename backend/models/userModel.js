const pool = require('../database/db');

const UserModel = {
  async findByEmail(email) {
    const { rows } = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    return rows[0];
  },

  async findById(id) {
    const { rows } = await pool.query('SELECT id,name,email,role,phone FROM users WHERE id=$1', [id]);
    return rows[0];
  },

  async create({ name, email, hashedPassword, role, phone }) {
    const { rows } = await pool.query(
      'INSERT INTO users (name,email,password,role,phone) VALUES ($1,$2,$3,$4,$5) RETURNING id,name,email,role',
      [name, email, hashedPassword, role, phone]
    );
    return rows[0];
  },

  async createFarmerProfile(userId, { village, district, farm_size, phone, state, pincode, experience_years, crop_type, full_address }) {
    await pool.query(
      `INSERT INTO farmers (user_id, village, district, farm_size, phone, state, pincode, experience_years, crop_type, full_address)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [userId, village, district, farm_size, phone||null, state||null, pincode||null, experience_years||null, crop_type||null, full_address||null]
    );
  },

  async createCustomerProfile(userId, { city, address, phone, state, district, pincode }) {
    await pool.query(
      `INSERT INTO customers (user_id, city, address, phone, state, district, pincode, full_address)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [userId, city, address||null, phone||null, state||null, district||null, pincode||null, address||null]
    );
  },

  async getAllFarmers() {
    const { rows } = await pool.query(
      `SELECT u.id,u.name,u.email,u.phone,u.created_at,
              f.village,f.district,f.farm_size,f.state,f.pincode,f.experience_years,f.crop_type,f.full_address
       FROM users u LEFT JOIN farmers f ON u.id=f.user_id WHERE u.role='farmer' ORDER BY u.created_at DESC`
    );
    return rows;
  },

  async getAllCustomers() {
    const { rows } = await pool.query(
      `SELECT u.id,u.name,u.email,u.phone,u.created_at,
              c.city,c.state,c.district,c.pincode,c.full_address
       FROM users u LEFT JOIN customers c ON u.id=c.user_id WHERE u.role='customer' ORDER BY u.created_at DESC`
    );
    return rows;
  }
};

module.exports = UserModel;
