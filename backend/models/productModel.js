const pool = require('../database/db');

const ProductModel = {
  async create(data) {
    const {
      farmer_id, product_name, grade, quantity, price, description,
      image_url, latitude, longitude, harvest_date,
      prediction_grade, prediction_score, confidence
    } = data;
    const { rows } = await pool.query(
      `INSERT INTO products
        (farmer_id,product_name,grade,quantity,price,description,image_url,
         latitude,longitude,harvest_date,prediction_grade,prediction_score,confidence,status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'pending') RETURNING *`,
      [farmer_id, product_name, grade, quantity, price, description,
       image_url, latitude, longitude, harvest_date||null, prediction_grade, prediction_score, confidence]
    );
    return rows[0];
  },

  async getPending() {
    const { rows } = await pool.query(
      `SELECT p.*, u.name AS farmer_name, u.phone AS farmer_phone, u.email AS farmer_email,
              f.village, f.district
       FROM products p
       JOIN users u ON p.farmer_id = u.id
       LEFT JOIN farmers f ON u.id = f.user_id
       WHERE p.status='pending' ORDER BY p.upload_time DESC`
    );
    return rows;
  },

  async getApproved() {
    const { rows } = await pool.query(
      `SELECT p.*, u.name AS farmer_name, u.email AS farmer_email, f.village
       FROM products p
       JOIN users u ON p.farmer_id = u.id
       LEFT JOIN farmers f ON u.id = f.user_id
       WHERE p.status='approved' ORDER BY p.upload_time DESC`
    );
    return rows;
  },

  async getByFarmer(farmer_id) {
    const { rows } = await pool.query(
      'SELECT * FROM products WHERE farmer_id=$1 ORDER BY upload_time DESC',
      [farmer_id]
    );
    return rows;
  },

  async updateStatus(id, status) {
    const { rows } = await pool.query(
      `UPDATE products SET status=$1, reviewed_at=NOW() WHERE id=$2 RETURNING *`,
      [status, id]
    );
    return rows[0];
  },

  async getById(id) {
    const { rows } = await pool.query(
      `SELECT p.*, u.name AS farmer_name, u.phone AS farmer_phone, f.village
       FROM products p JOIN users u ON p.farmer_id=u.id
       LEFT JOIN farmers f ON u.id=f.user_id WHERE p.id=$1`,
      [id]
    );
    return rows[0];
  },

  async getStats() {
    const { rows } = await pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE status='pending')  AS pending,
        COUNT(*) FILTER (WHERE status='approved') AS approved,
        COUNT(*) FILTER (WHERE status='rejected') AS rejected,
        COUNT(*) AS total
       FROM products`
    );
    return rows[0];
  },

  async savePrediction(id, { prediction_grade, prediction_score, confidence }) {
    await pool.query(
      `UPDATE products SET prediction_grade=$1, prediction_score=$2, confidence=$3 WHERE id=$4`,
      [prediction_grade, prediction_score, confidence, id]
    );
  }
};

module.exports = ProductModel;
