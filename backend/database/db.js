// const { Pool } = require('pg');
// require('dotenv').config();

// const pool = new Pool({
//   host:     process.env.DB_HOST     || 'localhost',
//   port:     process.env.DB_PORT     || 5432,
//   database: process.env.DB_NAME     || 'cashew',
//   user:     process.env.DB_USER     || 'postgres',
//   password: process.env.DB_PASSWORD || '1234',
// });

// pool.on('connect', () => {
//   console.log('✅ PostgreSQL connected');
// });

// pool.on('error', (err) => {
//   console.error('❌ PostgreSQL error:', err.message);
// });

// module.exports = pool;





const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "cashew",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "1234",

  // Required for Render PostgreSQL
  ssl:
    process.env.NODE_ENV === "production"
      ? {
          rejectUnauthorized: false,
        }
      : false,
});

pool.on("connect", () => {
  console.log("✅ PostgreSQL connected");
});

pool.on("error", (err) => {
  console.error("❌ PostgreSQL error:", err.message);
});

module.exports = pool;