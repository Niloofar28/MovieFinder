'use strict';
/**
 * AURORA SKINCARE — JSON API.
 *
 * Everything sensitive is validated here rather than in the browser: prices,
 * stock, coupon rules, shipping costs and order totals are all recalculated on
 * the server before an order is stored.
 */

const express = require('express');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const { db, hashPassword, verifyPassword } = require('./db');
const { shippingMethods } = require('./seed/catalog');

const router = express.Router();
const SESSION_COOKIE = 'aurora_session';
const SESSION_DAYS = 30;

/* ------------------------------------------------------------------ helpers */

const money = (n) => Math.round((Number(n) || 0) * 100) / 100;
const parseJSON = (value, fallback) => {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};
const emailLooksValid = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
const str = (value, max = 500) => String(value ?? '').trim().slice(0, max);

function sessionSecret() {
  return process.env.SESSION_SECRET || 'aurora-local-development-secret-change-me';
}

function signToken(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', sessionSecret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function readToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', sessionSecret()).update(body).digest('base64url');
  const a = Buffer.from(sig || '');
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload || !payload.uid || (payload.exp && Date.now() > payload.exp)) return null;
    return payload;
  } catch {
    return null;
  }
}

function parseCookies(header = '') {
  return header.split(';').reduce((acc, part) => {
    const idx = part.indexOf('=');
    if (idx > -1) acc[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
    return acc;
  }, {});
}

/** Attaches req.user (or null) from the signed session cookie. */
function attachUser(req, _res, next) {
  const token = parseCookies(req.headers.cookie || '')[SESSION_COOKIE];
  const payload = readToken(token);
  req.user = null;
  if (payload) {
    const user = db
      .prepare(`SELECT id, name, email, phone, role, created_at AS createdAt FROM users WHERE id = ?`)
      .get(payload.uid);
    if (user) req.user = user;
  }
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Please sign in to continue.' });
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Please sign in to continue.' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Administrator access required.' });
  next();
}

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone || '',
  role: user.role,
  createdAt: user.createdAt,
});

function serializeProduct(row) {
  if (!row) return null;
  const variants = parseJSON(row.variants, []);
  const images = parseJSON(row.images, []);
  const price = row.sale_price != null ? row.sale_price : row.price;
  const stock = variants.length
    ? variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
    : row.stock;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    brand: row.brand,
    sku: row.sku,
    shortDescription: row.short_description || '',
    description: row.description || '',
    basePrice: money(row.price),
    salePrice: row.sale_price != null ? money(row.sale_price) : null,
    price: money(price),
    discountPercent:
      row.sale_price != null && row.price > 0
        ? Math.round(((row.price - row.sale_price) / row.price) * 100)
        : 0,
    stock,
    inStock: stock > 0,
    rating: Number(row.rating) || 0,
    reviewCount: Number(row.review_count) || 0,
    badge: row.badge || null,
    featured: !!row.featured,
    bestseller: !!row.bestseller,
    isNew: !!row.is_new,
    ingredients: row.ingredients || '',
    benefits: parseJSON(row.benefits, []),
    howToUse: row.how_to_use || '',
    details: parseJSON(row.details, []),
    variants,
    images: images.length ? images : ['/assets/img/products/placeholder.svg'],
    image: (images.length ? images : ['/assets/img/products/placeholder.svg'])[0],
    createdAt: row.created_at,
  };
}

function serializeOrder(row, items = []) {
  return {
    id: row.id,
    number: row.number,
    status: row.status,
    paymentStatus: row.payment_status,
    paymentMethod: row.payment_method,
    email: row.email,
    fullName: row.full_name,
    phone: row.phone || '',
    address: {
      line1: row.line1,
      line2: row.line2 || '',
      city: row.city,
      state: row.state || '',
      postalCode: row.postal_code,
      country: row.country,
    },
    deliveryMethod: row.delivery_method,
    deliveryLabel: row.delivery_label || '',
    subtotal: money(row.subtotal),
    discount: money(row.discount),
    shipping: money(row.shipping),
    total: money(row.total),
    couponCode: row.coupon_code || '',
    notes: row.notes || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items: items.map((i) => ({
      id: i.id,
      slug: i.slug,
      name: i.name,
      image: i.image,
      variant: i.variant || '',
      unitPrice: money(i.unit_price),
      quantity: i.quantity,
      lineTotal: money(i.line_total),
    })),
  };
}

const orderItems = (orderId) =>
  db.prepare(`SELECT * FROM order_items WHERE order_id = ? ORDER BY id`).all(orderId);

/* ------------------------------------------------------------------ catalog */

router.get('/health', (_req, res) => {
  res.json({ ok: true, products: db.prepare(`SELECT COUNT(*) AS c FROM products`).get().c });
});

router.get('/content', (_req, res) => {
  const rows = db.prepare(`SELECT key, value FROM settings`).all();
  const out = {};
  rows.forEach((r) => {
    out[r.key] = parseJSON(r.value, null);
  });
  out.coupons = db.prepare(`SELECT code, type, value, min_subtotal, description FROM coupons WHERE active = 1`).all()
    .map((c) => ({ ...c, minSubtotal: c.min_subtotal }));
  out.shippingMethods = shippingMethods;
  res.json(out);
});

router.get('/categories', (_req, res) => {
  const counts = db
    .prepare(`SELECT category AS slug, COUNT(*) AS count FROM products GROUP BY category`)
    .all()
    .reduce((acc, r) => ({ ...acc, [r.slug]: r.count }), {});
  const rows = db.prepare(`SELECT * FROM categories ORDER BY sort_order, name`).all();
  res.json(rows.map((c) => ({ ...c, productCount: counts[c.slug] || 0 })));
});

router.get('/brands', (_req, res) => {
  const counts = db
    .prepare(`SELECT brand AS slug, COUNT(*) AS count FROM products GROUP BY brand`)
    .all()
    .reduce((acc, r) => ({ ...acc, [r.slug]: r.count }), {});
  const rows = db.prepare(`SELECT * FROM brands ORDER BY name`).all();
  res.json(rows.map((b) => ({ ...b, productCount: counts[b.slug] || 0 })));
});

/** Builds a WHERE clause. `skip` lets facets ignore their own dimension. */
function buildWhere(query, skip = null) {
  const clauses = [];
  const params = {};
  const list = (value) => (Array.isArray(value) ? value : String(value || '').split(',')).filter(Boolean);

  const q = str(query.q, 80).toLowerCase();
  if (q) {
    clauses.push(
      `(LOWER(p.name) LIKE @q OR LOWER(p.short_description) LIKE @q OR LOWER(p.description) LIKE @q
        OR LOWER(p.category) LIKE @q OR LOWER(p.brand) LIKE @q OR LOWER(p.sku) LIKE @q)`
    );
    params.q = `%${q}%`;
  }
  const cats = list(query.category);
  if (cats.length && skip !== 'category') {
    clauses.push(`p.category IN (${cats.map((_, i) => `@cat${i}`).join(',')})`);
    cats.forEach((c, i) => (params[`cat${i}`] = c));
  }
  const brands = list(query.brand);
  if (brands.length && skip !== 'brand') {
    clauses.push(`p.brand IN (${brands.map((_, i) => `@brand${i}`).join(',')})`);
    brands.forEach((b, i) => (params[`brand${i}`] = b));
  }
  const min = Number(query.minPrice);
  if (query.minPrice !== undefined && query.minPrice !== '' && !Number.isNaN(min) && skip !== 'price') {
    clauses.push(`COALESCE(p.sale_price, p.price) >= @min`);
    params.min = min;
  }
  const max = Number(query.maxPrice);
  if (query.maxPrice !== undefined && query.maxPrice !== '' && !Number.isNaN(max) && skip !== 'price') {
    clauses.push(`COALESCE(p.sale_price, p.price) <= @max`);
    params.max = max;
  }
  const rating = Number(query.rating);
  if (rating > 0 && skip !== 'rating') {
    clauses.push(`p.rating >= @rating`);
    params.rating = rating;
  }
  if (query.availability === 'in-stock') clauses.push(`p.stock > 0`);
  if (query.availability === 'out-of-stock') clauses.push(`p.stock <= 0`);
  if (String(query.sale) === '1' || query.sale === 'true') clauses.push(`p.sale_price IS NOT NULL`);
  if (String(query.new) === '1' || query.new === 'true') clauses.push(`p.is_new = 1`);
  if (String(query.featured) === '1') clauses.push(`p.featured = 1`);
  if (String(query.bestsellers) === '1') clauses.push(`p.bestseller = 1`);

  return { where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', params, clauses };
}

const SORTS = {
  featured: `p.featured DESC, p.bestseller DESC, p.rating DESC, p.name ASC`,
  'price-asc': `COALESCE(p.sale_price, p.price) ASC, p.name ASC`,
  'price-desc': `COALESCE(p.sale_price, p.price) DESC, p.name ASC`,
  newest: `p.id DESC`,
  rating: `p.rating DESC, p.review_count DESC`,
  name: `p.name ASC`,
};

router.get('/products', (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const perPage = Math.min(48, Math.max(4, parseInt(req.query.perPage, 10) || 12));
  const sort = SORTS[req.query.sort] ? req.query.sort : 'featured';

  const { where, params } = buildWhere(req.query);
  const total = db.prepare(`SELECT COUNT(*) AS c FROM products p ${where}`).get(params).c;
  const rows = db
    .prepare(
      `SELECT p.* FROM products p ${where} ORDER BY ${SORTS[sort]} LIMIT @limit OFFSET @offset`
    )
    .all({ ...params, limit: perPage, offset: (page - 1) * perPage });

  // Facet counts: each dimension ignores its own filter so users can widen again.
  const facetQuery = (dimension, expression, limit = 40) => {
    const built = buildWhere(req.query, dimension);
    return db
      .prepare(
        `SELECT ${expression} AS value, COUNT(*) AS count FROM products p ${built.where}
         GROUP BY value ORDER BY count DESC LIMIT ${limit}`
      )
      .all(built.params)
      .filter((r) => r.value);
  };
  const bounds = db
    .prepare(`SELECT MIN(COALESCE(sale_price, price)) AS min, MAX(COALESCE(sale_price, price)) AS max FROM products`)
    .get();

  res.json({
    items: rows.map(serializeProduct),
    total,
    page,
    perPage,
    pages: Math.max(1, Math.ceil(total / perPage)),
    sort,
    facets: {
      categories: facetQuery('category', 'p.category'),
      brands: facetQuery('brand', 'p.brand'),
      ratings: facetQuery('rating', 'CAST(p.rating AS INTEGER)'),
      price: { min: money(bounds.min || 0), max: money(bounds.max || 0) },
    },
  });
});

router.get('/products/:slug', (req, res) => {
  const row = db.prepare(`SELECT * FROM products WHERE slug = ?`).get(req.params.slug);
  if (!row) return res.status(404).json({ error: 'Product not found.' });
  const product = serializeProduct(row);
  const related = db
    .prepare(
      `SELECT * FROM products WHERE category = ? AND id != ? ORDER BY bestseller DESC, rating DESC LIMIT 4`
    )
    .all(row.category, row.id)
    .map(serializeProduct);
  res.json({ product, related });
});

router.get('/blog', (req, res) => {
  const clauses = [];
  const params = {};
  if (req.query.category) {
    clauses.push(`category = @category`);
    params.category = str(req.query.category, 40);
  }
  if (req.query.q) {
    clauses.push(`(LOWER(title) LIKE @q OR LOWER(excerpt) LIKE @q OR LOWER(body) LIKE @q)`);
    params.q = `%${str(req.query.q, 80).toLowerCase()}%`;
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const rows = db
    .prepare(`SELECT id, slug, title, category, author, reading_time, published_at, image, excerpt, featured FROM posts ${where} ORDER BY published_at DESC`)
    .all(params);
  const categories = db
    .prepare(`SELECT DISTINCT category AS name FROM posts WHERE category IS NOT NULL ORDER BY category`)
    .all()
    .map((r) => r.name);
  res.json({
    posts: rows.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      category: p.category,
      author: p.author,
      readingTime: p.reading_time,
      publishedAt: p.published_at,
      image: p.image,
      excerpt: p.excerpt,
      featured: !!p.featured,
    })),
    categories,
  });
});

router.get('/blog/:slug', (req, res) => {
  const post = db.prepare(`SELECT * FROM posts WHERE slug = ?`).get(req.params.slug);
  if (!post) return res.status(404).json({ error: 'Article not found.' });
  const relatedSlugs = parseJSON(post.related_products, []);
  const relatedProducts = relatedSlugs.length
    ? relatedSlugs
        .map((slug) => db.prepare(`SELECT * FROM products WHERE slug = ?`).get(slug))
        .filter(Boolean)
        .map(serializeProduct)
    : [];
  const more = db
    .prepare(`SELECT slug, title, category, image, reading_time, published_at, excerpt FROM posts WHERE slug != ? ORDER BY published_at DESC LIMIT 3`)
    .all(post.slug);
  res.json({
    post: {
      slug: post.slug,
      title: post.title,
      category: post.category,
      author: post.author,
      readingTime: post.reading_time,
      publishedAt: post.published_at,
      image: post.image,
      excerpt: post.excerpt,
      body: post.body,
    },
    relatedProducts,
    relatedPosts: more.map((p) => ({
      slug: p.slug,
      title: p.title,
      category: p.category,
      image: p.image,
      readingTime: p.reading_time,
      publishedAt: p.published_at,
      excerpt: p.excerpt,
    })),
  });
});

/* ------------------------------------------------------- newsletter & contact */

router.post('/newsletter', (req, res) => {
  const email = str(req.body?.email, 160).toLowerCase();
  const consent = !!req.body?.consent;
  if (!emailLooksValid(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  const existing = db.prepare(`SELECT id FROM subscribers WHERE email = ?`).get(email);
  if (existing) {
    db.prepare(`UPDATE subscribers SET consent = ? WHERE id = ?`).run(consent ? 1 : 0, existing.id);
    return res.json({ ok: true, duplicate: true, message: 'You are already subscribed with this address.' });
  }
  db.prepare(`INSERT INTO subscribers (email, consent, source) VALUES (?, ?, ?)`).run(
    email,
    consent ? 1 : 0,
    str(req.body?.source, 40) || 'website'
  );
  res.status(201).json({ ok: true, duplicate: false, message: 'Subscribed.' });
});

router.post('/contact', (req, res) => {
  const name = str(req.body?.name, 120);
  const email = str(req.body?.email, 160).toLowerCase();
  const subject = str(req.body?.subject, 160);
  const message = str(req.body?.message, 4000);
  if (!name) return res.status(400).json({ error: 'Please tell us your name.' });
  if (!emailLooksValid(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  if (message.length < 10) return res.status(400).json({ error: 'Please write a slightly longer message.' });
  const info = db
    .prepare(`INSERT INTO messages (name, email, subject, message) VALUES (?, ?, ?, ?)`)
    .run(name, email, subject || 'General enquiry', message);
  res.status(201).json({ ok: true, id: info.lastInsertRowid, message: 'Thank you — your message has been received.' });
});

/* ------------------------------------------------------------------ coupons */

function resolveCoupon(codeRaw, subtotal) {
  const code = str(codeRaw, 40).toUpperCase();
  if (!code) return { coupon: null, error: null };
  const coupon = db.prepare(`SELECT * FROM coupons WHERE UPPER(code) = ? AND active = 1`).get(code);
  if (!coupon) return { coupon: null, error: 'That promo code is not valid.' };
  if (subtotal < coupon.min_subtotal)
    return {
      coupon: null,
      error: `Code ${coupon.code} applies to orders over $${money(coupon.min_subtotal).toFixed(2)}.`,
    };
  return { coupon, error: null };
}

function couponTotals(coupon, subtotal, shippingCost, freeShippingThreshold) {
  let discount = 0;
  let shipping = shippingCost;
  let freeShipping = false;
  if (coupon) {
    if (coupon.type === 'percent') discount = money((subtotal * coupon.value) / 100);
    else if (coupon.type === 'fixed') discount = money(Math.min(coupon.value, subtotal));
    else if (coupon.type === 'shipping') freeShipping = true;
  }
  if (freeShippingThreshold != null && subtotal - discount >= freeShippingThreshold) shipping = 0;
  if (freeShipping) shipping = 0;
  return { discount, shipping: money(shipping), freeShipping };
}

router.post('/coupons/validate', (req, res) => {
  const subtotal = money(req.body?.subtotal);
  const shippingCode = str(req.body?.shipping, 20) || 'standard';
  const method = shippingMethods.find((m) => m.code === shippingCode) || shippingMethods[0];
  const { coupon, error } = resolveCoupon(req.body?.code, subtotal);
  if (error) return res.status(400).json({ error });
  const totals = couponTotals(coupon, subtotal, method.price, method.freeOver);
  res.json({
    ok: true,
    code: coupon.code,
    type: coupon.type,
    description: coupon.description,
    discount: totals.discount,
    shipping: totals.shipping,
    freeShipping: totals.freeShipping,
    total: money(subtotal - totals.discount + totals.shipping),
  });
});

/* ------------------------------------------------------------------- orders */

function createOrderNumber() {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
    const number = `AUR-${stamp}-${rand}`;
    if (!db.prepare(`SELECT id FROM orders WHERE number = ?`).get(number)) return number;
  }
  throw new Error('Could not allocate an order number.');
}

router.post('/orders', attachUser, (req, res) => {
  const body = req.body || {};
  const items = Array.isArray(body.items) ? body.items : [];
  if (!items.length) return res.status(400).json({ error: 'Your bag is empty.' });

  const errors = [];
  const customer = {
    fullName: str(body.customer?.fullName, 120),
    email: str(body.customer?.email, 160).toLowerCase(),
    phone: str(body.customer?.phone, 40),
    line1: str(body.customer?.line1, 200),
    line2: str(body.customer?.line2, 200),
    city: str(body.customer?.city, 100),
    state: str(body.customer?.state, 100),
    postalCode: str(body.customer?.postalCode, 40),
    country: str(body.customer?.country, 80),
  };
  if (!customer.fullName) errors.push({ field: 'fullName', message: 'Full name is required.' });
  if (!emailLooksValid(customer.email)) errors.push({ field: 'email', message: 'A valid email is required.' });
  if (!customer.line1) errors.push({ field: 'line1', message: 'Address is required.' });
  if (!customer.city) errors.push({ field: 'city', message: 'City is required.' });
  if (!customer.postalCode) errors.push({ field: 'postalCode', message: 'Postal code is required.' });
  if (!customer.country) errors.push({ field: 'country', message: 'Country is required.' });

  const method = shippingMethods.find((m) => m.code === str(body.deliveryMethod, 20)) || shippingMethods[0];
  const paymentMethod = str(body.paymentMethod, 30) || 'demo';

  // Server-side price + stock validation. Client totals are never trusted.
  const resolved = [];
  for (const raw of items) {
    const slug = str(raw.slug, 120);
    const quantity = Math.max(1, parseInt(raw.quantity, 10) || 1);
    const row = db.prepare(`SELECT * FROM products WHERE slug = ?`).get(slug);
    if (!row) {
      errors.push({ field: 'items', message: `A product in your bag is no longer available (${slug}).` });
      continue;
    }
    const variants = parseJSON(row.variants, []);
    let unitPrice = row.sale_price != null ? row.sale_price : row.price;
    let available = row.stock;
    let variantLabel = null;
    if (variants.length) {
      const chosen = variants.find((v) => v.label === str(raw.variant, 80)) || variants[0];
      variantLabel = chosen.label;
      unitPrice = Number(chosen.price) || unitPrice;
      available = Number(chosen.stock) || 0;
    }
    if (quantity > available) {
      errors.push({
        field: 'items',
        message: `${row.name}${variantLabel ? ` (${variantLabel})` : ''} — only ${available} left in stock.`,
      });
      continue;
    }
    resolved.push({
      product: row,
      quantity,
      unitPrice: money(unitPrice),
      variantLabel,
      lineTotal: money(unitPrice * quantity),
    });
  }
  if (errors.length) return res.status(400).json({ error: 'We could not place this order.', details: errors });

  const subtotal = money(resolved.reduce((sum, r) => sum + r.lineTotal, 0));
  const { coupon, error: couponError } = resolveCoupon(body.couponCode, subtotal);
  if (couponError) return res.status(400).json({ error: couponError, details: [{ field: 'couponCode', message: couponError }] });
  const totals = couponTotals(coupon, subtotal, method.price, method.freeOver);
  const total = money(subtotal - totals.discount + totals.shipping);

  const insertOrder = db.prepare(
    `INSERT INTO orders (number, user_id, email, full_name, phone, line1, line2, city, state, postal_code, country,
      delivery_method, delivery_label, payment_method, payment_status, subtotal, discount, shipping, total, coupon_code, notes)
     VALUES (@number, @user_id, @email, @full_name, @phone, @line1, @line2, @city, @state, @postal_code, @country,
      @delivery_method, @delivery_label, @payment_method, @payment_status, @subtotal, @discount, @shipping, @total, @coupon_code, @notes)`
  );
  const insertItem = db.prepare(
    `INSERT INTO order_items (order_id, product_id, slug, name, image, variant, unit_price, quantity, line_total)
     VALUES (@order_id, @product_id, @slug, @name, @image, @variant, @unit_price, @quantity, @line_total)`
  );
  const decrementProduct = db.prepare(`UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?`);

  const place = db.transaction(() => {
    const number = createOrderNumber();
    const info = insertOrder.run({
      number,
      user_id: req.user ? req.user.id : null,
      email: customer.email,
      full_name: customer.fullName,
      phone: customer.phone || null,
      line1: customer.line1,
      line2: customer.line2 || null,
      city: customer.city,
      state: customer.state || null,
      postal_code: customer.postalCode,
      country: customer.country,
      delivery_method: method.code,
      delivery_label: method.name,
      payment_method: paymentMethod,
      payment_status: 'demo_unpaid',
      subtotal,
      discount: totals.discount,
      shipping: totals.shipping,
      total,
      coupon_code: coupon ? coupon.code : null,
      notes: str(body.notes, 1000) || null,
    });
    const orderId = info.lastInsertRowid;
    for (const line of resolved) {
      const images = parseJSON(line.product.images, []);
      insertItem.run({
        order_id: orderId,
        product_id: line.product.id,
        slug: line.product.slug,
        name: line.product.name,
        image: images[0] || null,
        variant: line.variantLabel,
        unit_price: line.unitPrice,
        quantity: line.quantity,
        line_total: line.lineTotal,
      });
      // Keep variant stock in sync inside the stored JSON as well.
      const variants = parseJSON(line.product.variants, []);
      if (variants.length && line.variantLabel) {
        const next = variants.map((v) =>
          v.label === line.variantLabel ? { ...v, stock: Math.max(0, (Number(v.stock) || 0) - line.quantity) } : v
        );
        db.prepare(`UPDATE products SET variants = ? WHERE id = ?`).run(JSON.stringify(next), line.product.id);
      } else {
        decrementProduct.run(line.quantity, line.product.id);
      }
    }
    return number;
  });

  let number;
  try {
    number = place();
  } catch (err) {
    console.error('[orders] failed', err);
    return res.status(500).json({ error: 'Something went wrong while placing your order. Please try again.' });
  }
  const row = db.prepare(`SELECT * FROM orders WHERE number = ?`).get(number);
  res.status(201).json({
    ok: true,
    order: serializeOrder(row, orderItems(row.id)),
    paymentNotice: 'Demo checkout — no payment provider is connected, so no payment was taken.',
  });
});

router.get('/orders', requireAuth, (req, res) => {
  const rows = db.prepare(`SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC`).all(req.user.id);
  res.json(rows.map((r) => serializeOrder(r, orderItems(r.id))));
});

router.get('/orders/track/:number', attachUser, (req, res) => {
  const row = db.prepare(`SELECT * FROM orders WHERE number = ?`).get(str(req.params.number, 60).toUpperCase());
  if (!row) return res.status(404).json({ error: 'No order found with that number.' });
  const ownsIt = req.user && (req.user.id === row.user_id || req.user.role === 'admin');
  const email = str(req.query.email, 160).toLowerCase();
  if (!ownsIt && (!email || email !== String(row.email).toLowerCase()))
    return res.status(403).json({ error: 'Please provide the email address used for this order.' });

  // Orders are keyed by a random order number + email match, so they are never
  // listed to other customers.
  res.json({
    order: {
      ...serializeOrder(row, orderItems(row.id)),
      email: ownsIt ? row.email : maskEmail(row.email),
    },
  });
});

function maskEmail(email) {
  const [name, domain] = String(email).split('@');
  if (!domain) return '***';
  return `${name.slice(0, 2)}${'*'.repeat(Math.max(2, name.length - 2))}@${domain}`;
}

/* --------------------------------------------------------------------- auth */

function setSession(res, user) {
  const token = signToken({ uid: user.id, role: user.role, exp: Date.now() + SESSION_DAYS * 864e5 });
  const secure = process.env.COOKIE_SECURE === '1';
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}${secure ? '; Secure' : ''}`
  );
}

router.post('/auth/register', (req, res) => {
  const name = str(req.body?.name, 120);
  const email = str(req.body?.email, 160).toLowerCase();
  const password = String(req.body?.password || '');
  const phone = str(req.body?.phone, 40);
  if (!name) return res.status(400).json({ error: 'Please enter your name.' });
  if (!emailLooksValid(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  if (db.prepare(`SELECT id FROM users WHERE email = ?`).get(email))
    return res.status(409).json({ error: 'An account already exists with this email address.' });

  const info = db
    .prepare(`INSERT INTO users (name, email, password_hash, phone) VALUES (?, ?, ?, ?)`)
    .run(name, email, hashPassword(password), phone || null);
  const user = db
    .prepare(`SELECT id, name, email, phone, role, created_at AS createdAt FROM users WHERE id = ?`)
    .get(info.lastInsertRowid);
  setSession(res, user);
  res.status(201).json({ user: publicUser(user) });
});

router.post('/auth/login', (req, res) => {
  const email = str(req.body?.email, 160).toLowerCase();
  const password = String(req.body?.password || '');
  const user = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email);
  if (!user || !verifyPassword(password, user.password_hash))
    return res.status(401).json({ error: 'Email or password is incorrect.' });
  setSession(res, user);
  res.json({ user: publicUser(user) });
});

router.post('/auth/logout', (_req, res) => {
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
  res.json({ ok: true });
});

router.get('/auth/me', attachUser, (req, res) => {
  res.json({ user: req.user ? publicUser(req.user) : null });
});

router.patch('/auth/profile', requireAuth, (req, res) => {
  const name = str(req.body?.name, 120) || req.user.name;
  const phone = str(req.body?.phone, 40);
  db.prepare(`UPDATE users SET name = ?, phone = ? WHERE id = ?`).run(name, phone || null, req.user.id);
  const user = db
    .prepare(`SELECT id, name, email, phone, role, created_at AS createdAt FROM users WHERE id = ?`)
    .get(req.user.id);
  res.json({ user: publicUser(user) });
});

router.post('/auth/password', requireAuth, (req, res) => {
  const current = String(req.body?.currentPassword || '');
  const next = String(req.body?.newPassword || '');
  const row = db.prepare(`SELECT password_hash FROM users WHERE id = ?`).get(req.user.id);
  if (!row || !verifyPassword(current, row.password_hash))
    return res.status(400).json({ error: 'Your current password is incorrect.' });
  if (next.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters.' });
  db.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`).run(hashPassword(next), req.user.id);
  res.json({ ok: true, message: 'Password updated.' });
});

/* ----------------------------------------------------------------- addresses */

router.get('/addresses', requireAuth, (req, res) => {
  res.json(db.prepare(`SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC`).all(req.user.id));
});

router.post('/addresses', requireAuth, (req, res) => {
  const b = req.body || {};
  const required = ['fullName', 'line1', 'city', 'postalCode', 'country'];
  const missing = required.filter((f) => !str(b[f]));
  if (missing.length) return res.status(400).json({ error: 'Please complete every required address field.' });
  const info = db
    .prepare(
      `INSERT INTO addresses (user_id, label, full_name, phone, line1, line2, city, state, postal_code, country, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      req.user.id,
      str(b.label, 40) || null,
      str(b.fullName, 120),
      str(b.phone, 40) || null,
      str(b.line1, 200),
      str(b.line2, 200) || null,
      str(b.city, 100),
      str(b.state, 100) || null,
      str(b.postalCode, 40),
      str(b.country, 80),
      b.isDefault ? 1 : 0
    );
  if (b.isDefault) db.prepare(`UPDATE addresses SET is_default = 0 WHERE user_id = ? AND id != ?`).run(req.user.id, info.lastInsertRowid);
  res.status(201).json(db.prepare(`SELECT * FROM addresses WHERE id = ?`).get(info.lastInsertRowid));
});

router.delete('/addresses/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  db.prepare(`DELETE FROM addresses WHERE id = ? AND user_id = ?`).run(id, req.user.id);
  res.json({ ok: true });
});

/* ------------------------------------------------------------------- admin */

router.get('/admin/summary', requireAdmin, (_req, res) => {
  const scalar = (sql) => db.prepare(sql).get().c;
  const revenue = db.prepare(`SELECT COALESCE(SUM(total), 0) AS v FROM orders WHERE status != 'cancelled'`).get().v;
  res.json({
    products: scalar(`SELECT COUNT(*) AS c FROM products`),
    orders: scalar(`SELECT COUNT(*) AS c FROM orders`),
    revenue: money(revenue),
    customers: scalar(`SELECT COUNT(*) AS c FROM users WHERE role = 'customer'`),
    subscribers: scalar(`SELECT COUNT(*) AS c FROM subscribers`),
    messages: scalar(`SELECT COUNT(*) AS c FROM messages WHERE status = 'new'`),
    lowStock: db
      .prepare(`SELECT slug, name, stock FROM products WHERE stock <= 20 ORDER BY stock ASC LIMIT 6`)
      .all(),
    recentOrders: db
      .prepare(`SELECT number, full_name, total, status, created_at FROM orders ORDER BY id DESC LIMIT 6`)
      .all()
      .map((o) => ({ number: o.number, name: o.full_name, total: money(o.total), status: o.status, createdAt: o.created_at })),
  });
});

router.get('/admin/products', requireAdmin, (req, res) => {
  const q = str(req.query.q, 80).toLowerCase();
  const where = q ? `WHERE LOWER(name) LIKE @q OR LOWER(sku) LIKE @q OR LOWER(slug) LIKE @q` : '';
  const rows = db
    .prepare(`SELECT * FROM products ${where} ORDER BY updated_at DESC, id DESC`)
    .all(q ? { q: `%${q}%` } : {});
  res.json(rows.map(serializeProduct));
});

function productPayload(body, existing = null) {
  const images = Array.isArray(body.images)
    ? body.images.filter(Boolean)
    : String(body.images || '')
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean);
  const variants = Array.isArray(body.variants)
    ? body.variants
        .filter((v) => v && str(v.label))
        .map((v) => ({ label: str(v.label, 60), price: money(v.price), stock: parseInt(v.stock, 10) || 0 }))
    : parseJSON(existing?.variants, []);
  return {
    slug: str(body.slug, 120) || existing?.slug,
    name: str(body.name, 160) || existing?.name,
    category: str(body.category, 60) || existing?.category,
    brand: str(body.brand, 60) || existing?.brand,
    sku: str(body.sku, 60) || existing?.sku,
    short_description: str(body.shortDescription, 400) ?? existing?.short_description,
    description: str(body.description, 4000) || existing?.description,
    price: body.price !== undefined ? money(body.price) : existing?.price,
    sale_price:
      body.salePrice === '' || body.salePrice === null || body.salePrice === undefined
        ? null
        : money(body.salePrice),
    stock: body.stock !== undefined ? parseInt(body.stock, 10) || 0 : existing?.stock ?? 0,
    rating: body.rating !== undefined ? Number(body.rating) || 0 : existing?.rating ?? 0,
    review_count: body.reviewCount !== undefined ? parseInt(body.reviewCount, 10) || 0 : existing?.review_count ?? 0,
    badge: str(body.badge, 40) || null,
    featured: body.featured ? 1 : 0,
    bestseller: body.bestseller ? 1 : 0,
    is_new: body.isNew ? 1 : 0,
    ingredients: str(body.ingredients, 2000) || existing?.ingredients,
    benefits: JSON.stringify(Array.isArray(body.benefits) ? body.benefits.filter(Boolean) : parseJSON(existing?.benefits, [])),
    how_to_use: str(body.howToUse, 2000) || existing?.how_to_use,
    details: JSON.stringify(Array.isArray(body.details) ? body.details.filter(Boolean) : parseJSON(existing?.details, [])),
    variants: JSON.stringify(variants),
    images: JSON.stringify(images.length ? images : ['/assets/img/products/placeholder.svg']),
  };
}

router.post('/admin/products', requireAdmin, (req, res) => {
  const payload = productPayload(req.body || {});
  if (!payload.slug || !payload.name || !payload.category || !payload.brand || !payload.price)
    return res.status(400).json({ error: 'Slug, name, category, brand and price are required.' });
  if (db.prepare(`SELECT id FROM products WHERE slug = ?`).get(payload.slug))
    return res.status(409).json({ error: 'A product with that slug already exists.' });
  const info = db
    .prepare(
      `INSERT INTO products (slug, name, category, brand, sku, short_description, description, price, sale_price, stock,
        rating, review_count, badge, featured, bestseller, is_new, ingredients, benefits, how_to_use, details, variants, images)
       VALUES (@slug, @name, @category, @brand, @sku, @short_description, @description, @price, @sale_price, @stock,
        @rating, @review_count, @badge, @featured, @bestseller, @is_new, @ingredients, @benefits, @how_to_use, @details, @variants, @images)`
    )
    .run(payload);
  res.status(201).json(serializeProduct(db.prepare(`SELECT * FROM products WHERE id = ?`).get(info.lastInsertRowid)));
});

router.patch('/admin/products/:id', requireAdmin, (req, res) => {
  const existing = db.prepare(`SELECT * FROM products WHERE id = ?`).get(parseInt(req.params.id, 10));
  if (!existing) return res.status(404).json({ error: 'Product not found.' });
  const payload = productPayload({ ...req.body }, existing);
  db.prepare(
    `UPDATE products SET slug=@slug, name=@name, category=@category, brand=@brand, sku=@sku,
      short_description=@short_description, description=@description, price=@price, sale_price=@sale_price,
      stock=@stock, rating=@rating, review_count=@review_count, badge=@badge, featured=@featured,
      bestseller=@bestseller, is_new=@is_new, ingredients=@ingredients, benefits=@benefits, how_to_use=@how_to_use,
      details=@details, variants=@variants, images=@images, updated_at=datetime('now') WHERE id=@id`
  ).run({ ...payload, id: existing.id });
  res.json(serializeProduct(db.prepare(`SELECT * FROM products WHERE id = ?`).get(existing.id)));
});

router.delete('/admin/products/:id', requireAdmin, (req, res) => {
  db.prepare(`DELETE FROM products WHERE id = ?`).run(parseInt(req.params.id, 10));
  res.json({ ok: true });
});

router.get('/admin/orders', requireAdmin, (req, res) => {
  const q = str(req.query.q, 80).toLowerCase();
  const status = str(req.query.status, 30);
  const clauses = [];
  const params = {};
  if (q) {
    clauses.push(`(LOWER(number) LIKE @q OR LOWER(email) LIKE @q OR LOWER(full_name) LIKE @q)`);
    params.q = `%${q}%`;
  }
  if (status) {
    clauses.push(`status = @status`);
    params.status = status;
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const rows = db.prepare(`SELECT * FROM orders ${where} ORDER BY id DESC LIMIT 200`).all(params);
  res.json(rows.map((r) => serializeOrder(r, orderItems(r.id))));
});

router.patch('/admin/orders/:id', requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const row = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(id);
  if (!row) return res.status(404).json({ error: 'Order not found.' });
  const status = str(req.body?.status, 30) || row.status;
  const paymentStatus = str(req.body?.paymentStatus, 30) || row.payment_status;
  db.prepare(`UPDATE orders SET status = ?, payment_status = ?, updated_at = datetime('now') WHERE id = ?`).run(
    status,
    paymentStatus,
    id
  );
  res.json(serializeOrder(db.prepare(`SELECT * FROM orders WHERE id = ?`).get(id), orderItems(id)));
});

router.get('/admin/customers', requireAdmin, (_req, res) => {
  const rows = db
    .prepare(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.created_at AS createdAt,
              COUNT(o.id) AS orderCount, COALESCE(SUM(o.total), 0) AS spend
       FROM users u LEFT JOIN orders o ON o.user_id = u.id
       GROUP BY u.id ORDER BY u.created_at DESC`
    )
    .all();
  res.json(rows.map((r) => ({ ...r, spend: money(r.spend) })));
});

router.get('/admin/subscribers', requireAdmin, (_req, res) => {
  res.json(db.prepare(`SELECT * FROM subscribers ORDER BY id DESC`).all());
});

router.delete('/admin/subscribers/:id', requireAdmin, (req, res) => {
  db.prepare(`DELETE FROM subscribers WHERE id = ?`).run(parseInt(req.params.id, 10));
  res.json({ ok: true });
});

router.get('/admin/messages', requireAdmin, (_req, res) => {
  res.json(db.prepare(`SELECT * FROM messages ORDER BY id DESC`).all());
});

router.patch('/admin/messages/:id', requireAdmin, (req, res) => {
  const status = str(req.body?.status, 20) || 'read';
  db.prepare(`UPDATE messages SET status = ? WHERE id = ?`).run(status, parseInt(req.params.id, 10));
  res.json({ ok: true });
});

router.get('/admin/content', requireAdmin, (_req, res) => {
  const rows = db.prepare(`SELECT key, value FROM settings`).all();
  const out = {};
  rows.forEach((r) => (out[r.key] = parseJSON(r.value, null)));
  res.json(out);
});

router.put('/admin/content', requireAdmin, (req, res) => {
  const payload = req.body || {};
  const allowed = db.prepare(`SELECT key FROM settings`).all().map((r) => r.key);
  const statement = db.prepare(`UPDATE settings SET value = ? WHERE key = ?`);
  const write = db.transaction((entries) => {
    entries.forEach(([key, value]) => {
      if (allowed.includes(key)) statement.run(JSON.stringify(value), key);
    });
  });
  write(Object.entries(payload).filter(([key]) => allowed.includes(key)));
  res.json({ ok: true });
});

router.get('/admin/posts', requireAdmin, (_req, res) => {
  res.json(db.prepare(`SELECT * FROM posts ORDER BY published_at DESC`).all());
});

router.post('/admin/posts', requireAdmin, (req, res) => {
  const b = req.body || {};
  const slug = str(b.slug, 140) || str(b.title, 140).toLowerCase().replace(/[^a-z0-9]+/g, '-');
  if (!slug || !str(b.title)) return res.status(400).json({ error: 'Title and slug are required.' });
  if (db.prepare(`SELECT id FROM posts WHERE slug = ?`).get(slug))
    return res.status(409).json({ error: 'An article with that slug already exists.' });
  const info = db
    .prepare(
      `INSERT INTO posts (slug, title, category, author, reading_time, published_at, image, excerpt, body, related_products, featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      slug,
      str(b.title, 200),
      str(b.category, 60) || 'Guides',
      str(b.author, 120) || 'Aurora Editorial',
      parseInt(b.readingTime, 10) || 5,
      str(b.publishedAt, 20) || new Date().toISOString().slice(0, 10),
      str(b.image, 300) || '/assets/img/blog/skincare-routine.webp',
      str(b.excerpt, 400),
      String(b.body || ''),
      JSON.stringify(Array.isArray(b.relatedProducts) ? b.relatedProducts : []),
      b.featured ? 1 : 0
    );
  res.status(201).json(db.prepare(`SELECT * FROM posts WHERE id = ?`).get(info.lastInsertRowid));
});

router.patch('/admin/posts/:id', requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const row = db.prepare(`SELECT * FROM posts WHERE id = ?`).get(id);
  if (!row) return res.status(404).json({ error: 'Article not found.' });
  const b = req.body || {};
  db.prepare(
    `UPDATE posts SET title=?, category=?, author=?, reading_time=?, published_at=?, image=?, excerpt=?, body=?, related_products=?, featured=? WHERE id=?`
  ).run(
    str(b.title, 200) || row.title,
    str(b.category, 60) || row.category,
    str(b.author, 120) || row.author,
    parseInt(b.readingTime, 10) || row.reading_time,
    str(b.publishedAt, 20) || row.published_at,
    str(b.image, 300) || row.image,
    str(b.excerpt, 400) || row.excerpt,
    b.body !== undefined ? String(b.body) : row.body,
    JSON.stringify(Array.isArray(b.relatedProducts) ? b.relatedProducts : parseJSON(row.related_products, [])),
    b.featured ? 1 : 0,
    id
  );
  res.json(db.prepare(`SELECT * FROM posts WHERE id = ?`).get(id));
});

router.delete('/admin/posts/:id', requireAdmin, (req, res) => {
  db.prepare(`DELETE FROM posts WHERE id = ?`).run(parseInt(req.params.id, 10));
  res.json({ ok: true });
});

router.get('/admin/categories', requireAdmin, (_req, res) => {
  res.json(db.prepare(`SELECT * FROM categories ORDER BY sort_order, name`).all());
});

router.post('/admin/categories', requireAdmin, (req, res) => {
  const b = req.body || {};
  const slug = str(b.slug, 60) || str(b.name, 60).toLowerCase().replace(/[^a-z0-9]+/g, '-');
  if (!slug || !str(b.name)) return res.status(400).json({ error: 'Name is required.' });
  if (db.prepare(`SELECT id FROM categories WHERE slug = ?`).get(slug))
    return res.status(409).json({ error: 'That category already exists.' });
  const info = db
    .prepare(`INSERT INTO categories (slug, name, tagline, description, image, sort_order) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(
      slug,
      str(b.name, 80),
      str(b.tagline, 120) || null,
      str(b.description, 400) || null,
      str(b.image, 300) || '/assets/img/categories/skin-care.webp',
      parseInt(b.order, 10) || 99
    );
  res.status(201).json(db.prepare(`SELECT * FROM categories WHERE id = ?`).get(info.lastInsertRowid));
});

router.patch('/admin/categories/:id', requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const row = db.prepare(`SELECT * FROM categories WHERE id = ?`).get(id);
  if (!row) return res.status(404).json({ error: 'Category not found.' });
  const b = req.body || {};
  db.prepare(`UPDATE categories SET name=?, tagline=?, description=?, image=?, sort_order=? WHERE id=?`).run(
    str(b.name, 80) || row.name,
    str(b.tagline, 120) || row.tagline,
    str(b.description, 400) || row.description,
    str(b.image, 300) || row.image,
    b.order !== undefined ? parseInt(b.order, 10) || 0 : row.sort_order,
    id
  );
  res.json(db.prepare(`SELECT * FROM categories WHERE id = ?`).get(id));
});

router.delete('/admin/categories/:id', requireAdmin, (req, res) => {
  const row = db.prepare(`SELECT * FROM categories WHERE id = ?`).get(parseInt(req.params.id, 10));
  if (!row) return res.json({ ok: true });
  const used = db.prepare(`SELECT COUNT(*) AS c FROM products WHERE category = ?`).get(row.slug).c;
  if (used) return res.status(400).json({ error: `Move the ${used} product(s) in this category before deleting it.` });
  db.prepare(`DELETE FROM categories WHERE id = ?`).run(row.id);
  res.json({ ok: true });
});

/* ------------------------------------------------------------------ uploads */

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'public', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
      const ext = (path.extname(file.originalname) || '.jpg').toLowerCase().replace(/[^a-z0-9.]/g, '');
      cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`);
    },
  }),
  limits: { fileSize: 6 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, /^image\//.test(file.mimetype)),
});

router.post('/admin/uploads', requireAdmin, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Please choose an image file (max 6 MB).' });
  res.status(201).json({ ok: true, url: `/uploads/${req.file.filename}` });
});

module.exports = { router, attachUser, UPLOAD_DIR };
