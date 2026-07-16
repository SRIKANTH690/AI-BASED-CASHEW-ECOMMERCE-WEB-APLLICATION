require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const http       = require('http');
const { Server } = require('socket.io');
const bcrypt     = require('bcrypt');
const pool       = require('./database/db');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: '*', methods: ['GET','POST'] } });

// ── Middleware ────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Static files ──────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ── Socket.io ─────────────────────────────────────────────
io.on('connection', (socket) => {
  socket.on('join_admin', () => socket.join('admin_room'));
});
app.set('io', io);

// ── Routes ────────────────────────────────────────────────
const authRoutes     = require('./routes/auth');
const farmerRoutes   = require('./routes/farmer');
const adminRoutes    = require('./routes/admin');
const customerRoutes = require('./routes/customer');
const { submitEnquiry } = require('./controllers/enquiryController');

app.use('/api',          authRoutes);
app.use('/api/farmer',   farmerRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/customer', customerRoutes);
app.post('/api/enquiry', submitEnquiry);

// ── Health check ──────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// ── Fallback: serve frontend ──────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// ── Auto-create tables on first boot (handles Render fresh DB) ────────────
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('farmer','customer','admin')),
        phone VARCHAR(15),
        profile_photo TEXT,
        updated_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS farmers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        village VARCHAR(100), district VARCHAR(100), farm_size DECIMAL,
        phone VARCHAR(15), state VARCHAR(100), pincode VARCHAR(10),
        experience_years INTEGER, crop_type VARCHAR(100), full_address TEXT
      );
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        customer_name VARCHAR(100), city VARCHAR(100), address TEXT,
        phone VARCHAR(15), state VARCHAR(100), district VARCHAR(100),
        pincode VARCHAR(10), full_address TEXT
      );
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        farmer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        product_name VARCHAR(150), grade VARCHAR(20),
        quantity INTEGER, price DECIMAL, description TEXT,
        image_url TEXT, latitude DECIMAL(10,7), longitude DECIMAL(10,7),
        upload_time TIMESTAMP DEFAULT NOW(), harvest_date DATE,
        prediction_grade VARCHAR(20), prediction_score DECIMAL, confidence DECIMAL,
        status VARCHAR(20) DEFAULT 'pending', reviewed_at TIMESTAMP,
        weight_kg DECIMAL, processing_type VARCHAR(50), moisture VARCHAR(20),
        storage_info TEXT, min_order_qty INTEGER
      );
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        customer_name VARCHAR(100), customer_email VARCHAR(100),
        total DECIMAL, payment_method VARCHAR(30), address TEXT,
        city VARCHAR(100), state VARCHAR(100), pin VARCHAR(10), mobile VARCHAR(15),
        status VARCHAR(20) DEFAULT 'placed',
        created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
        qty INTEGER, price DECIMAL, product_name VARCHAR(150), grade VARCHAR(20)
      );
      CREATE TABLE IF NOT EXISTS enquiries (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100), email VARCHAR(100), phone VARCHAR(20),
        message TEXT, created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Database tables ready');

    // Create default admin if not exists
    const existing = await pool.query("SELECT id FROM users WHERE email='admin@panruti.com'");
    if (!existing.rows.length) {
      const hash = await bcrypt.hash('admin123', 10);
      await pool.query(
        "INSERT INTO users (name,email,password,role) VALUES ($1,$2,$3,$4)",
        ['Administrator', 'admin@panruti.com', hash, 'admin']
      );
      console.log('✅ Default admin created');
    }
  } catch (err) {
    console.error('DB init error:', err.message);
  }
}

// ── Start ─────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`AI service: ${process.env.AI_SERVICE_URL}`);
  await initDB();
});
