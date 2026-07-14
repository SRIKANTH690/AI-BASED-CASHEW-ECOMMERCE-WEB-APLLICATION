const OrderModel = require('../models/orderModel');

exports.placeOrder = async (req, res) => {
  try {
    const { items, total, payment_method, address, city, state, pin, mobile } = req.body;
    if (!items || !items.length) return res.status(400).json({ error: 'Cart is empty.' });
    if (!address || !city || !state || !pin || !mobile)
      return res.status(400).json({ error: 'Complete delivery details required.' });

    const order = await OrderModel.create({
      customer_id: req.user.id,
      total, payment_method, address, city, state, pin, mobile, items
    });

    res.status(201).json({ message: 'Order placed successfully.', order });
  } catch (err) {
    console.error('Order error:', err);
    res.status(500).json({ error: 'Server error placing order.' });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await OrderModel.getByCustomer(req.user.id);
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await OrderModel.getAll();
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};
