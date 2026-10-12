/**
 * AURORA SKINCARE — client-side store.
 *
 * The bag, wishlist and recently-viewed list are kept in localStorage so they
 * survive page loads and are available to guests. Nothing price- or stock-
 * related is ever trusted from here: the server recalculates every total when
 * an order is placed.
 */

import { api, query } from './api.js';

const KEYS = {
  cart: 'aurora.cart.v1',
  wishlist: 'aurora.wishlist.v1',
  recent: 'aurora.recent.v1',
};

const listeners = new Set();

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage may be unavailable in private mode — the UI still works in-memory */
  }
}

function emit() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (err) {
      console.error(err);
    }
  });
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const money = (value) => `$${(Number(value) || 0).toFixed(2)}`;

export const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(String(value).replace(' ', 'T') + 'Z');
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

/* ----------------------------------------------------------------- content */

let contentPromise = null;
export function getContent() {
  if (!contentPromise) contentPromise = api.get('/api/content').catch(() => ({}));
  return contentPromise;
}

export function freeShippingThreshold() {
  return 50;
}

/* --------------------------------------------------------------------- bag */

const lineKey = (slug, variant) => `${slug}::${variant || ''}`;

export const cart = {
  lines() {
    return read(KEYS.cart, []);
  },
  save(lines) {
    write(KEYS.cart, lines);
    emit();
  },
  count() {
    return cart.lines().reduce((sum, line) => sum + (Number(line.quantity) || 0), 0);
  },
  subtotal() {
    return Math.round(cart.lines().reduce((sum, l) => sum + l.price * l.quantity, 0) * 100) / 100;
  },
  add(product, { variant = '', quantity = 1 } = {}) {
    const lines = cart.lines();
    const variantData = (product.variants || []).find((v) => v.label === variant);
    const price = variantData ? Number(variantData.price) : Number(product.price);
    const stock = variantData ? Number(variantData.stock) : Number(product.stock);
    const key = lineKey(product.slug, variant);
    const existing = lines.find((l) => lineKey(l.slug, l.variant) === key);
    if (existing) {
      existing.quantity = Math.min(existing.quantity + quantity, stock || existing.quantity + quantity);
      existing.price = price;
      existing.stock = stock;
    } else {
      lines.push({
        slug: product.slug,
        name: product.name,
        variant,
        quantity: Math.min(quantity, stock || quantity),
        price,
        stock,
        image: product.image,
        category: product.category,
      });
    }
    cart.save(lines);
    return cart.lines();
  },
  setQuantity(slug, variant, quantity) {
    const lines = cart.lines();
    const line = lines.find((l) => lineKey(l.slug, l.variant) === lineKey(slug, variant));
    if (!line) return lines;
    const max = line.stock || 99;
    line.quantity = Math.max(1, Math.min(Number(quantity) || 1, max));
    cart.save(lines);
    return cart.lines();
  },
  remove(slug, variant) {
    cart.save(cart.lines().filter((l) => lineKey(l.slug, l.variant) !== lineKey(slug, variant)));
    return cart.lines();
  },
  clear() {
    cart.save([]);
  },
  /** Re-checks the bag against live catalog prices and stock. */
  async refresh() {
    const lines = cart.lines();
    if (!lines.length) return lines;
    const slugs = [...new Set(lines.map((l) => l.slug))];
    const results = await Promise.all(
      slugs.map((slug) => api.get(`/api/products/${encodeURIComponent(slug)}`).catch(() => null))
    );
    const bySlug = {};
    results.forEach((r) => {
      if (r && r.product) bySlug[r.product.slug] = r.product;
    });
    const next = [];
    lines.forEach((line) => {
      const product = bySlug[line.slug];
      if (!product) return;
      const variantData = (product.variants || []).find((v) => v.label === line.variant);
      const stock = variantData ? Number(variantData.stock) : Number(product.stock);
      const price = variantData ? Number(variantData.price) : Number(product.price);
      if (stock <= 0) return;
      next.push({
        ...line,
        name: product.name,
        price,
        stock,
        image: product.image,
        category: product.category,
        quantity: Math.min(line.quantity, stock),
      });
    });
    cart.save(next);
    return next;
  },
};

/* ---------------------------------------------------------------- wishlist */

export const wishlist = {
  slugs() {
    return read(KEYS.wishlist, []);
  },
  has(slug) {
    return wishlist.slugs().includes(slug);
  },
  count() {
    return wishlist.slugs().length;
  },
  toggle(slug) {
    const slugs = wishlist.slugs();
    const next = slugs.includes(slug) ? slugs.filter((s) => s !== slug) : [...slugs, slug];
    write(KEYS.wishlist, next);
    emit();
    return next.includes(slug);
  },
  remove(slug) {
    write(
      KEYS.wishlist,
      wishlist.slugs().filter((s) => s !== slug)
    );
    emit();
  },
  async products() {
    const slugs = wishlist.slugs();
    if (!slugs.length) return [];
    const data = await api.get(`/api/products${query({ perPage: 48 })}`);
    const wanted = new Set(slugs);
    return data.items.filter((item) => wanted.has(item.slug));
  },
};

/* --------------------------------------------------------- recently viewed */

export const recentlyViewed = {
  list() {
    return read(KEYS.recent, []);
  },
  push(slug) {
    const next = [slug, ...recentlyViewed.list().filter((s) => s !== slug)].slice(0, 10);
    write(KEYS.recent, next);
  },
  async products(excludeSlug = null) {
    const slugs = recentlyViewed.list().filter((s) => s !== excludeSlug);
    if (!slugs.length) return [];
    const data = await api.get(`/api/products${query({ perPage: 48 })}`);
    const order = new Map(slugs.map((slug, index) => [slug, index]));
    return data.items
      .filter((item) => order.has(item.slug))
      .sort((a, b) => order.get(a.slug) - order.get(b.slug))
      .slice(0, 6);
  },
};

/* ----------------------------------------------------------------- session */

export const session = {
  user: null,
  loaded: false,
  async load(force = false) {
    if (session.loaded && !force) return session.user;
    const data = await api.get('/api/auth/me').catch(() => ({ user: null }));
    session.user = data.user || null;
    session.loaded = true;
    emit();
    return session.user;
  },
  async login(email, password) {
    const data = await api.post('/api/auth/login', { email, password });
    session.user = data.user;
    session.loaded = true;
    emit();
    return data.user;
  },
  async register(payload) {
    const data = await api.post('/api/auth/register', payload);
    session.user = data.user;
    session.loaded = true;
    emit();
    return data.user;
  },
  async logout() {
    await api.post('/api/auth/logout');
    session.user = null;
    session.loaded = true;
    emit();
  },
  isAdmin() {
    return !!session.user && session.user.role === 'admin';
  },
};

export { lineKey };
