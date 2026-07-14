const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST, port: process.env.DB_PORT,
  database: process.env.DB_NAME, user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function migrate() {
  console.log('Running migrations...\n');

  // ── CUSTOMERS ────────────────────────────────────────────
  const customerCols = [
    "ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone       VARCHAR(15)",
    "ALTER TABLE customers ADD COLUMN IF NOT EXISTS state       VARCHAR(100)",
    "ALTER TABLE customers ADD COLUMN IF NOT EXISTS district    VARCHAR(100)",
    "ALTER TABLE customers ADD COLUMN IF NOT EXISTS pincode     VARCHAR(10)",
    "ALTER TABLE customers ADD COLUMN IF NOT EXISTS full_address TEXT"
  ];
  for (const q of customerCols) {
    await pool.query(q);
    console.log('✅', q.split('ADD COLUMN IF NOT EXISTS')[1]?.trim().split(' ')[0], '→ customers');
  }

  // ── FARMERS ──────────────────────────────────────────────
  const farmerCols = [
    "ALTER TABLE farmers ADD COLUMN IF NOT EXISTS phone            VARCHAR(15)",
    "ALTER TABLE farmers ADD COLUMN IF NOT EXISTS state            VARCHAR(100)",
    "ALTER TABLE farmers ADD COLUMN IF NOT EXISTS pincode          VARCHAR(10)",
    "ALTER TABLE farmers ADD COLUMN IF NOT EXISTS experience_years INTEGER",
    "ALTER TABLE farmers ADD COLUMN IF NOT EXISTS crop_type        VARCHAR(100)",
    "ALTER TABLE farmers ADD COLUMN IF NOT EXISTS full_address     TEXT"
  ];
  for (const q of farmerCols) {
    await pool.query(q);
    console.log('✅', q.split('ADD COLUMN IF NOT EXISTS')[1]?.trim().split(' ')[0], '→ farmers');
  }

  // ── PRODUCTS ─────────────────────────────────────────────
  const productCols = [
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS weight_kg       DECIMAL",
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS processing_type VARCHAR(50)",
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS moisture        VARCHAR(20)",
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS storage_info    TEXT",
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS min_order_qty   INTEGER"
  ];
  for (const q of productCols) {
    await pool.query(q);
    console.log('✅', q.split('ADD COLUMN IF NOT EXISTS')[1]?.trim().split(' ')[0], '→ products');
  }

  // ── USERS ────────────────────────────────────────────────
  const userCols = [
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo TEXT",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at    TIMESTAMP DEFAULT NOW()"
  ];
  for (const q of userCols) {
    await pool.query(q);
    console.log('✅', q.split('ADD COLUMN IF NOT EXISTS')[1]?.trim().split(' ')[0], '→ users');
  }

  console.log('\n🎉 All migrations complete!');
  await pool.end();
}

migrate().catch(e => { console.error('❌ Error:', e.message); pool.end(); });
