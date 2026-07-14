const pool = require('../database/db');

// POST /api/enquiry — save contact form submission
exports.submitEnquiry = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    if (!name || !message) return res.status(400).json({ error: 'Name and message are required.' });
    const { rows } = await pool.query(
      'INSERT INTO enquiries (name, email, phone, message) VALUES ($1,$2,$3,$4) RETURNING *',
      [name, email || null, phone || null, message]
    );
    res.status(201).json({ message: 'Enquiry submitted successfully.', enquiry: rows[0] });
  } catch (err) {
    console.error('Enquiry error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// GET /api/admin/enquiries — admin only
exports.getEnquiries = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM enquiries ORDER BY created_at DESC'
    );
    res.json({ enquiries: rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};
