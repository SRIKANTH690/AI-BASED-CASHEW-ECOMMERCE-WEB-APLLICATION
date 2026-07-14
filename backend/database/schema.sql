-- Run this file once to create all tables
-- psql -U postgres -d cashew -f schema.sql

CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(100) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,
  role        VARCHAR(20)  NOT NULL CHECK (role IN ('farmer','customer','admin')),
  phone       VARCHAR(15),
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS farmers (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  village     VARCHAR(100),
  district    VARCHAR(100),
  farm_size   DECIMAL
);

CREATE TABLE IF NOT EXISTS customers (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  city        VARCHAR(100),
  address     TEXT
);

CREATE TABLE IF NOT EXISTS products (
  id                SERIAL PRIMARY KEY,
  farmer_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
  product_name      VARCHAR(150),
  grade             VARCHAR(20),
  quantity          INTEGER,
  price             DECIMAL,
  description       TEXT,
  image_url         TEXT,
  latitude          DECIMAL(10,7),
  longitude         DECIMAL(10,7),
  upload_time       TIMESTAMP DEFAULT NOW(),
  prediction_grade  VARCHAR(20),
  prediction_score  DECIMAL,
  confidence        DECIMAL,
  status            VARCHAR(20) DEFAULT 'pending',
  reviewed_at       TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id              SERIAL PRIMARY KEY,
  customer_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  total           DECIMAL,
  payment_method  VARCHAR(30),
  address         TEXT,
  city            VARCHAR(100),
  state           VARCHAR(100),
  pin             VARCHAR(10),
  mobile          VARCHAR(15),
  status          VARCHAR(20) DEFAULT 'placed',
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id          SERIAL PRIMARY KEY,
  order_id    INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_id  INTEGER REFERENCES products(id) ON DELETE SET NULL,
  qty         INTEGER,
  price       DECIMAL
);

-- Default admin account (password: admin123)
INSERT INTO users (name, email, password, role)
VALUES (
  'Administrator',
  'admin@panruti.com',
  '$2b$10$lBQggCgvpWd6RnxCBWyJBuXth5acOJos.hM.QjRxmcw91ZdkaANrS',
  'admin'
) ON CONFLICT (email) DO NOTHING;
