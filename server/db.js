'use strict';
/**
 * AURORA SKINCARE — SQLite persistence layer.
 *
 * Local infrastructure only: the database file lives on a Docker volume, is
 * created on first boot and seeded with the demo catalog. Admin edits are kept
 * because seeding uses INSERT OR IGNORE (existing rows are never overwritten).
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Database = require('better-sqlite3');

const { categories, brands, products, coupons } = require('./seed/catalog');
const { posts } = require('./seed/blog');
const { content } = require('./seed/content');

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '..', 'data', 'aurora.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'customer',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS addresses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label TEXT,
  full_name TEXT NOT NULL,
  phone TEXT,
  line1 TEXT NOT NULL,
  line2 TEXT,
  city TEXT NOT NULL,
  state TEXT,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  image TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS brands (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT
);
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  brand TEXT NOT NULL,
  sku TEXT NOT NULL,
  short_description TEXT,
  description TEXT,
  price REAL NOT NULL,
  sale_price REAL,
  stock INTEGER NOT NULL DEFAULT 0,
  rating REAL NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  badge TEXT,
  featured INTEGER NOT NULL DEFAULT 0,
  bestseller INTEGER NOT NULL DEFAULT 0,
  is_new INTEGER NOT NULL DEFAULT 0,
  ingredients TEXT,
  benefits TEXT,
  how_to_use TEXT,
  details TEXT,
  variants TEXT,
  images TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number TEXT NOT NULL UNIQUE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  line1 TEXT NOT NULL,
  line2 TEXT,
  city TEXT NOT NULL,
  state TEXT,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL,
  delivery_method TEXT NOT NULL,
  delivery_label TEXT,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'demo_unpaid',
  subtotal REAL NOT NULL,
  discount REAL NOT NULL DEFAULT 0,
  shipping REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL,
  coupon_code TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  image TEXT,
  variant TEXT,
  unit_price REAL NOT NULL,
  quantity INTEGER NOT NULL,
  line_total REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS coupons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  value REAL NOT NULL DEFAULT 0,
  min_subtotal REAL NOT NULL DEFAULT 0,
  description TEXT,
  active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  consent INTEGER NOT NULL DEFAULT 0,
  source TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  category TEXT,
  author TEXT,
  reading_time INTEGER,
  published_at TEXT,
  image TEXT,
  excerpt TEXT,
  body TEXT,
  related_products TEXT,
  featured INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

db.exec(SCHEMA);

/* ------------------------------------------------------------------ seeding */

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

function verifyPassword(password, stored) {
  try {
    const [scheme, salt, hash] = String(stored).split('$');
    if (scheme !== 'scrypt' || !salt || !hash) return false;
    const derived = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, 'hex');
    return derived.length === expected.length && crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

function seed() {
  const insertCategory = db.prepare(
    `INSERT OR IGNORE INTO categories (slug, name, tagline, description, image, sort_order)
     VALUES (@slug, @name, @tagline, @description, @image, @sort_order)`
  );
  categories.forEach((c, i) =>
    insertCategory.run({ ...c, tagline: c.tagline || null, sort_order: i })
  );

  const insertBrand = db.prepare(
    `INSERT OR IGNORE INTO brands (slug, name, tagline, description) VALUES (@slug, @name, @tagline, @description)`
  );
  brands.forEach((b) => insertBrand.run({ tagline: null, ...b }));

  const insertProduct = db.prepare(
    `INSERT OR IGNORE INTO products
      (slug, name, category, brand, sku, short_description, description, price, sale_price, stock, rating,
       review_count, badge, featured, bestseller, is_new, ingredients, benefits, how_to_use, details, variants, images)
     VALUES
      (@slug, @name, @category, @brand, @sku, @short_description, @description, @price, @sale_price, @stock, @rating,
       @review_count, @badge, @featured, @bestseller, @is_new, @ingredients, @benefits, @how_to_use, @details, @variants, @images)`
  );
  products.forEach((p) =>
    insertProduct.run({
      slug: p.slug,
      name: p.name,
      category: p.category,
      brand: p.brand,
      sku: p.sku,
      short_description: p.shortDescription || null,
      description: p.description || null,
      price: p.price,
      sale_price: p.salePrice ?? null,
      stock: p.stock ?? 0,
      rating: p.rating ?? 0,
      review_count: p.reviewCount ?? 0,
      badge: p.badge || null,
      featured: p.featured ? 1 : 0,
      bestseller: p.bestseller ? 1 : 0,
      is_new: p.isNew ? 1 : 0,
      ingredients: p.ingredients || null,
      benefits: JSON.stringify(p.benefits || []),
      how_to_use: p.howToUse || null,
      details: JSON.stringify(p.details || []),
      variants: JSON.stringify(p.variants || []),
      images: JSON.stringify(p.images || []),
    })
  );

  const insertCoupon = db.prepare(
    `INSERT OR IGNORE INTO coupons (code, type, value, min_subtotal, description) VALUES (@code, @type, @value, @min_subtotal, @description)`
  );
  coupons.forEach((c) =>
    insertCoupon.run({ ...c, min_subtotal: c.minSubtotal ?? 0, description: c.description || null })
  );

  const insertPost = db.prepare(
    `INSERT OR IGNORE INTO posts (slug, title, category, author, reading_time, published_at, image, excerpt, body, related_products, featured)
     VALUES (@slug, @title, @category, @author, @reading_time, @published_at, @image, @excerpt, @body, @related_products, @featured)`
  );
  posts.forEach((p) =>
    insertPost.run({
      slug: p.slug,
      title: p.title,
      category: p.category || null,
      author: p.author || null,
      reading_time: p.readingTime || 5,
      published_at: p.publishedAt || null,
      image: p.image || null,
      excerpt: p.excerpt || null,
      body: p.body || null,
      related_products: JSON.stringify(p.relatedProducts || []),
      featured: p.featured ? 1 : 0,
    })
  );

  const insertSetting = db.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`);
  Object.entries(content).forEach(([key, value]) => insertSetting.run(key, JSON.stringify(value)));

  // Bootstrap the admin account from the environment. Created only when absent,
  // so a password changed in the dashboard is never overwritten on restart.
  const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || '';
  if (adminEmail && adminPassword) {
    const existing = db.prepare(`SELECT id FROM users WHERE email = ?`).get(adminEmail);
    if (!existing) {
      db.prepare(
        `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'admin')`
      ).run('Aurora Store Admin', adminEmail, hashPassword(adminPassword));
      console.log(`[db] created admin account ${adminEmail}`);
    }
  } else if (!db.prepare(`SELECT id FROM users WHERE role = 'admin'`).get()) {
    console.warn('[db] no ADMIN_EMAIL / ADMIN_PASSWORD set — no admin account was created.');
  }
}

seed();

module.exports = { db, hashPassword, verifyPassword, DB_PATH };
