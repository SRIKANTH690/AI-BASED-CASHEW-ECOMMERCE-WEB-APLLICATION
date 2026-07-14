const pool = require('../database/db');

const OrderModel = {
  async create({ customer_id, total, payment_method, address, city, state, pin, mobile, items }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Get customer name & email
      const userRes = await client.query('SELECT name, email FROM users WHERE id=$1', [customer_id]);
      const customer_name  = userRes.rows[0]?.name  || null;
      const customer_email = userRes.rows[0]?.email || null;

      const { rows } = await client.query(
        `INSERT INTO orders (customer_id,customer_name,customer_email,total,payment_method,address,city,state,pin,mobile)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
        [customer_id, customer_name, customer_email, total, payment_method, address, city, state, pin, mobile]
      );
      const order = rows[0];
      for (const item of items) {
        // Get product name & grade
        const prodRes = await client.query('SELECT product_name, grade FROM products WHERE id=$1', [item.product_id]);
        const product_name = prodRes.rows[0]?.product_name || null;
        const grade        = prodRes.rows[0]?.grade        || null;
        await client.query(
          'INSERT INTO order_items (order_id,product_id,qty,price,product_name,grade) VALUES ($1,$2,$3,$4,$5,$6)',
          [order.id, item.product_id, item.qty, item.price, product_name, grade]
        );
      }
      await client.query('COMMIT');
      return order;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },

  async getByCustomer(customer_id) {
    const { rows } = await pool.query(
      `SELECT o.*, json_agg(json_build_object(
         'product_id', oi.product_id,
         'product_name', p.product_name,
         'grade', p.grade,
         'qty', oi.qty,
         'price', oi.price,
         'image_url', p.image_url
       ) ORDER BY oi.id) AS items
       FROM orders o
       JOIN order_items oi ON o.id=oi.order_id
       LEFT JOIN products p ON oi.product_id=p.id
       WHERE o.customer_id=$1
       GROUP BY o.id ORDER BY o.created_at DESC`,
      [customer_id]
    );
    return rows;
  },

  async getAll() {
    const { rows } = await pool.query(
      `SELECT o.*,
        json_agg(json_build_object(
          'id', oi.id,
          'product_id', oi.product_id,
          'product_name', COALESCE(oi.product_name, p.product_name, 'Unknown Product'),
          'grade', COALESCE(oi.grade, p.grade, '—'),
          'qty', oi.qty,
          'price', oi.price,
          'image_url', p.image_url
        ) ORDER BY oi.id) AS items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN products p ON oi.product_id = p.id
       GROUP BY o.id
       ORDER BY o.created_at DESC`
    );
    return rows;
  }
};

module.exports = OrderModel;
