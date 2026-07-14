/**
 * setup.js — Creates all tables automatically using .env credentials
 * Run: node k:\ccc\backend\database\setup.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Client } = require('pg');
const bcrypt = require('bcrypt');

const client = new Client({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME     || 'cashew',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || ''
});

async function setup() {
  try {
    await client.connect();
    console.log('✅ Connected to cashew database\n');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id         SERIAL PRIMARY KEY,
        name       VARCHAR(100) NOT NULL,
        email      VARCHAR(100) UNIQUE NOT NULL,
        password   VARCHAR(255) NOT NULL,
        role       VARCHAR(20) NOT NULL CHECK (role IN ('farmer','customer','admin')),
        phone      VARCHAR(15),
        created_at TIMESTAMP DEFAULT NOW()
      );`);
    console.log('✅ Table: users');

    await client.query(`
      CREATE TABLE IF NOT EXISTS farmers (
        id        SERIAL PRIMARY KEY,
        user_id   INTEGER REFERENCES users(id) ON DELETE CASCADE,
        village   VARCHAR(100),
        district  VARCHAR(100),
        farm_size DECIMAL
      );`);
    console.log('✅ Table: farmers');

    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id      SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        city    VARCHAR(100),
        address TEXT
      );`);
    console.log('✅ Table: customers');

    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id               SERIAL PRIMARY KEY,
        farmer_id        INTEGER REFERENCES users(id) ON DELETE CASCADE,
        product_name     VARCHAR(150),
        grade            VARCHAR(20),
        quantity         INTEGER,
        price            DECIMAL,
        description      TEXT,
        image_url        TEXT,
        latitude         DECIMAL(10,7),
        longitude        DECIMAL(10,7),
        upload_time      TIMESTAMP DEFAULT NOW(),
        prediction_grade VARCHAR(20),
        prediction_score DECIMAL,
        confidence       DECIMAL,
        status           VARCHAR(20) DEFAULT 'pending',
        reviewed_at      TIMESTAMP
      );`);
    console.log('✅ Table: products');

    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id             SERIAL PRIMARY KEY,
        customer_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
        total          DECIMAL,
        payment_method VARCHAR(30),
        address        TEXT,
        city           VARCHAR(100),
        state          VARCHAR(100),
        pin            VARCHAR(10),
        mobile         VARCHAR(15),
        status         VARCHAR(20) DEFAULT 'placed',
        created_at     TIMESTAMP DEFAULT NOW()
      );`);
    console.log('✅ Table: orders');

    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id         SERIAL PRIMARY KEY,
        order_id   INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
        qty        INTEGER,
        price      DECIMAL
      );`);
    console.log('✅ Table: order_items');

    // Insert default admin account
    const hash = await bcrypt.hash('admin123', 10);
    await client.query(`
      INSERT INTO users (name, email, password, role)
      VALUES ($1,$2,$3,$4)
      ON CONFLICT (email) DO NOTHING;`,
      ['Administrator', 'admin@panruti.com', hash, 'admin']
    );
    console.log('✅ Admin account ready — admin@panruti.com / admin123');

    // Verify
    const result = await client.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema='public' ORDER BY table_name;`
    );
    console.log('\n📋 Tables in cashew database:');
    result.rows.forEach(r => console.log('   -', r.table_name));

    console.log('\n🎉 Database setup complete!');
    console.log('👉 Next: node k:\\ccc\\backend\\server.js\n');

  } catch (err) {
    console.error('❌ Setup failed:', err.message);
  } finally {
    await client.end();
  }
}

setup();
