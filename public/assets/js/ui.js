/**
 * AURORA SKINCARE — shared UI shell and reusable components.
 * Every page calls mountShell() so the header, footer, bag drawer, search
 * panel and toast stack are defined in exactly one place.
 */

import { api, escapeHtml, query } from './api.js';
import { cart, getContent, money, session, subscribe, wishlist, freeShippingThreshold } from './store.js';

/* ------------------------------------------------------------------- icons */

const stroke = (paths, extra = '') =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${paths}</svg>`;

export const icons = {
  search: stroke('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  user: stroke('<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c1.4-3.4 4.2-5.2 7.5-5.2s6.1 1.8 7.5 5.2"/>'),
  heart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M12 20s-7.5-4.6-7.5-9.4A4.1 4.1 0 0 1 12 7.6a4.1 4.1 0 0 1 7.5 3C19.5 15.4 12 20 12 20Z"/></svg>`,
  bag: stroke('<path d="M6 8h12l-1 12H7L6 8Z"/><path d="M9 8V6.6A3 3 0 0 1 12 4a3 3 0 0 1 3 2.6V8"/>'),
  menu: stroke('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  close: stroke('<path d="m6 6 12 12M18 6 6 18"/>'),
  chevronDown: stroke('<path d="m6 9 6 6 6-6"/>', 'width="16" height="16"'),
  chevronRight: stroke('<path d="m9 6 6 6-6 6"/>', 'width="18" height="18"'),
  arrowRight: stroke('<path d="M4 12h15"/><path d="m13 6 6 6-6 6"/>', 'width="18" height="18"'),
  arrowLeft: stroke('<path d="M20 12H5"/><path d="m11 18-6-6 6-6"/>', 'width="18" height="18"'),
  plus: stroke('<path d="M12 5v14M5 12h14"/>', 'width="18" height="18"'),
  minus: stroke('<path d="M5 12h14"/>', 'width="18" height="18"'),
  trash: stroke('<path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/>', 'width="18" height="18"'),
  grid: stroke('<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>'),
  list: stroke('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  filter: stroke('<path d="M4 6h16M7 12h10M10 18h4"/>'),
  zoom: stroke('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5M11 8.5v5M8.5 11h5"/>'),
  play: stroke('<circle cx="12" cy="12" r="9"/><path d="m10 8.5 6 3.5-6 3.5v-7Z"/>', 'width="18" height="18"'),
  check: stroke('<path d="m5 13 4 4L19 7"/>'),
  alert: stroke('<circle cx="12" cy="12" r="9"/><path d="M12 8v4.5M12 16h.01"/>'),
  info: stroke('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'),
  mail: stroke('<rect x="3.5" y="6" width="17" height="12" rx="2"/><path d="m4.5 8 7.5 5 7.5-5"/>'),
  truck: stroke('<path d="M3 8h10v8H3zM13 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/>'),
  lock: stroke('<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8.5 10V8a3.5 3.5 0 0 1 7 0v2"/>'),
  refresh: stroke('<path d="M4 12a8 8 0 0 1 13.6-5.7L20 8"/><path d="M20 4v4h-4"/><path d="M20 12a8 8 0 0 1-13.6 5.7L4 16"/><path d="M4 20v-4h4"/>'),
  leaf: stroke('<path d="M5 19c0-8 5-13 14-13 0 9-5 13-11 13H5Z"/><path d="M5 19c2.5-4 5.5-6.5 9-8"/>'),
  flask: stroke('<path d="M9 4h6M10 4v5l-4.5 8A2 2 0 0 0 7.3 20h9.4a2 2 0 0 0 1.8-3L14 9V4"/><path d="M7.5 15h9"/>'),
  shield: stroke('<path d="M12 4l7 3v5c0 5-3.2 7.4-7 8.6C8.2 19.4 5 17 5 12V7l7-3Z"/><path d="m9.5 12 2 2 3.5-4"/>'),
  sparkle: stroke('<path d="M12 4l1.6 4.6L18 10l-4.4 1.4L12 16l-1.6-4.6L6 10l4.4-1.4L12 4Z"/><path d="M18.5 16.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2Z"/>'),
  creditCard: stroke('<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18"/><path d="M7 14h3"/>'),
  heartHand: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19s-6.5-4-6.5-8.4A3.6 3.6 0 0 1 12 8.2a3.6 3.6 0 0 1 6.5 2.4C18.5 15 12 19 12 19Z"/></svg>`,
  emptyBag: stroke('<path d="M6 8h12l-1 12H7L6 8Z"/><path d="M9 8V6.6A3 3 0 0 1 12 4a3 3 0 0 1 3 2.6V8"/>', 'stroke-width="1.2"'),
  emptyHeart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><path d="M12 20s-7.5-4.6-7.5-9.4A4.1 4.1 0 0 1 12 7.6a4.1 4.1 0 0 1 7.5 3C19.5 15.4 12 20 12 20Z"/></svg>`,
  instagram: stroke('<rect x="4" y="4" width="16" height="16" rx="4.5"/><circle cx="12" cy="12" r="3.6"/><circle cx="16.4" cy="7.6" r=".9" fill="currentColor"/>'),
  facebook: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 21v-7h2.4l.4-2.8h-2.8V9.4c0-.8.2-1.4 1.4-1.4h1.5V5.5c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2H8v2.8h2.5v7h3Z"/></svg>`,
  tiktok: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.2 4h-2.4v10.3a2.2 2.2 0 1 1-2.2-2.2c.2 0 .4 0 .6.1V9.8a4.6 4.6 0 1 0 4 4.6V9.4c.8.6 1.8 1 2.9 1V8a3.9 3.9 0 0 1-2.9-4Z"/></svg>`,
  pinterest: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.3 4C8 4 5.6 6.6 5.6 9.6c0 1.6.9 3.3 2.4 3.8.2.1.4 0 .4-.2l.3-1.2c0-.2 0-.3-.1-.4-.5-.6-.9-1.5-.9-2.3 0-2.3 1.7-4.3 4.5-4.3 2.5 0 4 1.5 4 3.5 0 2.6-1.2 4.4-2.7 4.4-.9 0-1.5-.7-1.3-1.6l.7-2.8c.2-.8-.2-1.5-1-1.5-1 0-1.8 1-1.8 2.4 0 .9.3 1.5.3 1.5l-1.2 5c-.3 1.3 0 2.9.1 3 0 .1.2.1.2 0 .2-.2 1.3-1.6 1.7-2.9l.6-2.2c.4.7 1.4 1.3 2.5 1.3 3 0 5-2.7 5-5.9C18.9 6 16.3 4 12.3 4Z"/></svg>`,
  star: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 4.6 2.3 4.7 5.2.7-3.8 3.6.9 5.2-4.6-2.5-4.6 2.5.9-5.2L4.5 10l5.2-.7L12 4.6Z"/></svg>`,
  starEmpty: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="m12 4.6 2.3 4.7 5.2.7-3.8 3.6.9 5.2-4.6-2.5-4.6 2.5.9-5.2L4.5 10l5.2-.7L12 4.6Z"/></svg>`,
};

export const logoMark = `<svg class="brand-mark" viewBox="0 0 48 48" role="img" aria-label="Aurora Skincare"><defs><linearGradient id="auroraGrad" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#813b91"/><stop offset="1" stop-color="#c98ad6"/></linearGradient></defs><path d="M24 6c4.6 4.1 7 8.6 7 13.4 0 5.6-3.1 9.5-7 13.6-3.9-4.1-7-8-7-13.6C17 14.6 19.4 10.1 24 6Z" fill="url(#auroraGrad)"/><path d="M24 12.5c2.6 3 4 6.2 4 9.6 0 3.9-1.6 7.2-4 10.4-2.4-3.2-4-6.5-4-10.4 0-3.4 1.4-6.6 4-9.6Z" fill="#f6e6f7"/><path d="M17.5 25.5c-3.9-.7-6.5-2.7-8-6 4.1-.3 7 .8 9.3 3.2M30.5 25.5c3.9-.7 6.5-2.7 8-6-4.1-.3-7 .8-9.3 3.2" stroke="url(#auroraGrad)" stroke-width="2.1" fill="none" stroke-linecap="round"/></svg>`;

/* ---------------------------------------------------------------- metadata */

export function setPageMeta({ title, description, image, path, jsonLd, type = 'website' }) {
  if (title) document.title = title;
  const set = (selector, attr, value) => {
    if (!value) return;
    let node = document.head.querySelector(selector);
    if (!node) {
      node = document.createElement('meta');
      node.setAttribute(attr.startsWith('property') ? 'property' : 'name', attr.replace(/^(property|name)="|"$/g, ''));
      document.head.appendChild(node);
    }
    node.setAttribute('content', value);
  };
  const canonical = `${location.origin}${path || location.pathname}`;
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = canonical;
  if (description) set('meta[name="description"]', 'name="description"', description);
  set('meta[property="og:title"]', 'property="og:title"', title || document.title);
  set('meta[property="og:description"]', 'property="og:description"', description);
  set('meta[property="og:type"]', 'property="og:type"', type);
  set('meta[property="og:url"]', 'property="og:url"', canonical);
  if (image) set('meta[property="og:image"]', 'property="og:image"', new URL(image, location.origin).href);
  if (jsonLd) {
    const existing = document.getElementById('page-jsonld');
    if (existing) existing.remove();
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'page-jsonld';
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);
  }
}

/* ------------------------------------------------------------------ toasts */

export function toast(message, type = 'success') {
  let stack = document.querySelector('.toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.className = 'toast-stack';
    stack.setAttribute('role', 'status');
    stack.setAttribute('aria-live', 'polite');
    document.body.appendChild(stack);
  }
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.innerHTML = `<span class="toast__icon">${type === 'error' ? icons.alert : icons.check}</span><span>${escapeHtml(message)}</span>`;
  el.querySelector('svg').style.cssText = 'width:18px;height:18px;flex:none;color:' + (type === 'error' ? 'var(--danger)' : 'var(--success)');
  stack.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity 200ms ease';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 220);
  }, 3600);
}

/* --------------------------------------------------------------- components */

export function stars(rating = 0, reviewCount = null, { showCount = true } = {}) {
  const rounded = Math.round((Number(rating) || 0) * 2) / 2;
  let html = '<span class="stars" role="img" aria-label="' + escapeHtml(`${rating} out of 5`) + '">';
  for (let i = 1; i <= 5; i += 1) {
    html += rounded >= i ? icons.star : rounded >= i - 0.5 ? icons.star : icons.starEmpty;
  }
  html += '</span>';
  if (showCount) {
    html += `<span>${(Number(rating) || 0).toFixed(1)}${
      reviewCount != null ? ` &middot; ${Number(reviewCount) || 0} ratings` : ''
    }</span>`;
  }
  return html;
}

export function priceBlock(product, className = 'price') {
  const onSale = product.salePrice && product.salePrice < product.basePrice;
  return `<p class="${className}">${money(product.price)}${
    onSale ? ` <del>${money(product.basePrice)}</del>` : ''
  }</p>`;
}

export function productBadges(product) {
  const badges = [];
  if (product.salePrice && product.salePrice < product.basePrice) {
    const pct = Math.round((1 - product.salePrice / product.basePrice) * 100);
    badges.push(`<span class="badge badge--sale">-${pct}%</span>`);
  } else if (product.badge) {
    badges.push(`<span class="badge">${escapeHtml(product.badge)}</span>`);
  }
  if (product.isNew && !badges.length) badges.push('<span class="badge badge--new">New</span>');
  if (!product.inStock) badges.push('<span class="badge badge--sold">Sold out</span>');
  return badges.join('');
}

/**
 * Product card. `variant="list"` is used by the shop page list view.
 */
export function productCard(product, { quickAdd = true, className = '' } = {}) {
  const href = `/product?slug=${encodeURIComponent(product.slug)}`;
  const alt = product.images && product.images[1];
  const saved = wishlist.has(product.slug);
  return `
  <article class="product-card ${className}" data-slug="${escapeHtml(product.slug)}">
    <div class="product-card__media">
      <a href="${href}" aria-label="${escapeHtml(product.name)}">
        <img class="primary" src="${escapeHtml(product.images[0])}" alt="${escapeHtml(product.name)}" loading="lazy" decoding="async" width="600" height="600">
        ${alt ? `<img class="alt" src="${escapeHtml(alt)}" alt="" aria-hidden="true" loading="lazy" decoding="async">` : ''}
      </a>
      <div class="product-card__badges">${productBadges(product)}</div>
      <button type="button" class="product-card__wish" data-wishlist="${escapeHtml(product.slug)}"
        aria-pressed="${saved}" aria-label="${saved ? 'Remove from' : 'Add to'} wishlist: ${escapeHtml(product.name)}">
        ${icons.heart}
      </button>
      ${
        quickAdd
          ? `<div class="product-card__quick">
              <button type="button" class="btn btn--sm btn--block" data-quick-add="${escapeHtml(product.slug)}"
                ${product.inStock ? '' : 'disabled aria-disabled="true"'}>
                ${product.inStock ? 'Add to bag' : 'Sold out'}
              </button>
            </div>`
          : ''
      }
    </div>
    <div class="product-card__body">
      <span class="product-card__category">${escapeHtml(product.category.replace(/-/g, ' '))}</span>
      <h3 class="product-card__title"><a href="${href}">${escapeHtml(product.name)}</a></h3>
      <div class="product-card__rating">${stars(product.rating, product.reviewCount)}</div>
      ${priceBlock(product)}
    </div>
  </article>`;
}

export function categoryCard(category) {
  return `
  <a class="category-card" href="/shop?category=${encodeURIComponent(category.slug)}">
    <span class="category-card__media">
      <img src="${escapeHtml(category.image)}" alt="${escapeHtml(category.name)} collection" loading="lazy" decoding="async" width="420" height="420">
    </span>
    <span>
      <h3>${escapeHtml(category.name)}</h3>
      <p>${escapeHtml(category.tagline || '')}</p>
    </span>
  </a>`;
}

export function emptyState({ icon = 'emptyBag', title, text, actionHtml = '' }) {
  return `
  <div class="empty-state">
    ${icons[icon] || icons.info}
    <h3>${escapeHtml(title)}</h3>
    <p>${escapeHtml(text)}</p>
    ${actionHtml}
  </div>`;
}

export function skeletonCards(count = 5) {
  return Array.from({ length: count }, () => '<div class="skeleton skeleton--card" aria-hidden="true"></div>').join('');
}

export function breadcrumbs(items) {
  const crumbs = [{ label: 'Home', href: '/' }, ...items];
  const html = crumbs
    .map((item, index) =>
      index === crumbs.length - 1 || !item.href
        ? `<span aria-current="page">${escapeHtml(item.label)}</span>`
        : `<a href="${item.href}">${escapeHtml(item.label)}</a>`
    )
    .join('<span aria-hidden="true">/</span>');
  return `<nav class="breadcrumbs" aria-label="Breadcrumb">${html}</nav>`;
}

export function breadcrumbJsonLd(items) {
  const crumbs = [{ label: 'Home', href: '/' }, ...items];
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: new URL(item.href || location.pathname, location.origin).href,
    })),
  };
}

/* ------------------------------------------------------------ interactivity */

/** Delegated handling for wishlist buttons + quick add, used on every page. */
export function bindProductActions(root = document) {
  root.addEventListener('click', async (event) => {
    const wishButton = event.target.closest('[data-wishlist]');
    if (wishButton) {
      event.preventDefault();
      const slug = wishButton.dataset.wishlist;
      const added = wishlist.toggle(slug);
      wishButton.setAttribute('aria-pressed', String(added));
      wishButton.setAttribute('aria-label', `${added ? 'Remove from' : 'Add to'} wishlist`);
      toast(added ? 'Saved to your wishlist.' : 'Removed from your wishlist.');
      return;
    }

    const addButton = event.target.closest('[data-quick-add]');
    if (addButton) {
      event.preventDefault();
      const slug = addButton.dataset.quickAdd;
      addButton.disabled = true;
      try {
        const { product } = await api.get(`/api/products/${encodeURIComponent(slug)}`);
        cart.add(product, { variant: product.variants?.[0]?.label || '', quantity: 1 });
        productCardToast(product);
        openCart();
      } catch (err) {
        toast(err.message, 'error');
      } finally {
        addButton.disabled = false;
      }
    }
  });
}

export function productCardToast(product) {
  toast(`${product.name} added to your bag.`);
}

/* -------------------------------------------------------------- cart drawer */

let drawerEl = null;
let scrimEl = null;
let lastFocused = null;

function cartLineHtml(line) {
  const href = `/product?slug=${encodeURIComponent(line.slug)}`;
  return `
  <div class="line-item" data-line="${escapeHtml(line.slug)}" data-variant="${escapeHtml(line.variant || '')}">
    <div class="line-item__media"><img src="${escapeHtml(line.image)}" alt="${escapeHtml(line.name)}" loading="lazy"></div>
    <div>
      <p class="line-item__title"><a href="${href}">${escapeHtml(line.name)}</a></p>
      ${line.variant ? `<p class="line-item__meta">${escapeHtml(line.variant)}</p>` : ''}
      <div class="qty" role="group" aria-label="Quantity for ${escapeHtml(line.name)}">
        <button type="button" data-cart-step="-1" aria-label="Decrease quantity">&minus;</button>
        <input type="number" min="1" max="${line.stock || 99}" value="${line.quantity}" data-cart-qty aria-label="Quantity">
        <button type="button" data-cart-step="1" aria-label="Increase quantity">+</button>
      </div>
    </div>
    <div style="text-align:right;display:grid;gap:.5rem;justify-items:end">
      <span class="line-item__price">${money(line.price * line.quantity)}</span>
      <button type="button" class="btn--quiet" data-cart-remove style="border:none;background:none;cursor:pointer;color:var(--muted);font-size:.78rem">Remove</button>
    </div>
  </div>`;
}

export function renderCartDrawer() {
  if (!drawerEl) return;
  const lines = cart.lines();
  const body = drawerEl.querySelector('.drawer-body');
  const foot = drawerEl.querySelector('.drawer-foot');
  const heading = drawerEl.querySelector('[data-cart-count]');
  const count = cart.count();
  if (heading) heading.textContent = count ? `${count} item${count === 1 ? '' : 's'}` : '';

  if (!lines.length) {
    body.innerHTML = emptyState({
      icon: 'emptyBag',
      title: 'Your bag is empty',
      text: 'Once you add something you love, it will appear here.',
      actionHtml: '<a class="btn" href="/shop">Start shopping</a>',
    });
    foot.innerHTML = '<button class="btn btn--ghost btn--block" data-close-cart>Continue shopping</button>';
    return;
  }

  body.innerHTML = lines.map(cartLineHtml).join('');
  const subtotal = cart.subtotal();
  const threshold = freeShippingThreshold();
  const remaining = Math.max(0, threshold - subtotal);
  foot.innerHTML = `
    <div class="ship-progress">
      ${
        remaining > 0
          ? `You are ${money(remaining)} away from free standard shipping.`
          : '<strong>Nice — you have earned free standard shipping.</strong>'
      }
      <div class="ship-progress__bar"><span style="width:${Math.min(100, (subtotal / threshold) * 100)}%"></span></div>
    </div>
    <div class="summary__row"><span>Subtotal</span><span>${money(subtotal)}</span></div>
    <p class="form-note">Shipping and promo codes are calculated at checkout.</p>
    <a class="btn btn--block" href="/checkout">Checkout</a>
    <a class="btn btn--ghost btn--block" href="/cart">View full bag</a>
  `;
}

function trapFocus(container, event) {
  if (event.key !== 'Tab') return;
  const focusable = container.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

export function openCart() {
  renderCartDrawer();
  drawerEl?.classList.add('is-open');
  scrimEl?.classList.add('is-open');
  drawerEl?.setAttribute('aria-hidden', 'false');
  lastFocused = document.activeElement;
  drawerEl?.querySelector('[data-close-cart]')?.focus();
  document.body.style.overflow = 'hidden';
}

export function closeCart() {
  drawerEl?.classList.remove('is-open');
  drawerEl?.setAttribute('aria-hidden', 'true');
  if (!document.querySelector('.mobile-nav.is-open')) scrimEl?.classList.remove('is-open');
  document.body.style.overflow = '';
  lastFocused?.focus?.();
}

function bindDrawer() {
  drawerEl.addEventListener('click', (event) => {
    if (event.target.closest('[data-close-cart]')) return closeCart();
    const lineEl = event.target.closest('[data-line]');
    if (!lineEl) return;
    const slug = lineEl.dataset.line;
    const variant = lineEl.dataset.variant;
    const line = cart.lines().find((l) => l.slug === slug && (l.variant || '') === variant);
    if (!line) return;
    const stepButton = event.target.closest('[data-cart-step]');
    if (stepButton) {
      cart.setQuantity(slug, variant, line.quantity + Number(stepButton.dataset.cartStep));
      return;
    }
    if (event.target.closest('[data-cart-remove]')) {
      cart.remove(slug, variant);
      toast('Removed from your bag.');
      return;
    }
  });
  drawerEl.addEventListener('change', (event) => {
    const input = event.target.closest('[data-cart-qty]');
    if (!input) return;
    const lineEl = input.closest('[data-line]');
    cart.setQuantity(lineEl.dataset.line, lineEl.dataset.variant, input.value);
  });
  drawerEl.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeCart();
    trapFocus(drawerEl, event);
  });
}

/* ------------------------------------------------------------- search panel */

let searchEl = null;

function bindSearch() {
  const input = searchEl.querySelector('input[type="search"]');
  const suggestions = searchEl.querySelector('.search-suggestions');
  let timer = null;

  const runSearch = async (term) => {
    if (!term || term.length < 2) {
      suggestions.innerHTML = '';
      return;
    }
    try {
      const data = await api.get(`/api/products${query({ q: term, perPage: 5 })}`);
      if (!data.items.length) {
        suggestions.innerHTML = `<p class="muted">No products match “${escapeHtml(term)}”.</p>`;
        return;
      }
      suggestions.innerHTML = data.items
        .map(
          (item) => `
        <a href="/product?slug=${encodeURIComponent(item.slug)}">
          <img src="${escapeHtml(item.image)}" alt="" loading="lazy">
          <span>
            <strong>${escapeHtml(item.name)}</strong><br>
            <span class="muted">${escapeHtml(item.category.replace(/-/g, ' '))} &middot; ${money(item.price)}</span>
          </span>
        </a>`
        )
        .join('');
    } catch {
      suggestions.innerHTML = '<p class="muted">Search is unavailable right now.</p>';
    }
  };

  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => runSearch(input.value.trim()), 220);
  });

  searchEl.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();
    const term = input.value.trim();
    location.href = `/shop${query({ q: term })}`;
  });

  searchEl.querySelectorAll('[data-search-term]').forEach((button) => {
    button.addEventListener('click', () => {
      input.value = button.dataset.searchTerm;
      runSearch(input.value);
      input.focus();
    });
  });
}

export function openSearch() {
  searchEl?.classList.add('is-open');
  searchEl?.setAttribute('aria-hidden', 'false');
  setTimeout(() => searchEl?.querySelector('input[type="search"]')?.focus(), 60);
}

export function closeSearch() {
  searchEl?.classList.remove('is-open');
  searchEl?.setAttribute('aria-hidden', 'true');
}

/* --------------------------------------------------------------- the shell */

const NAV = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/shop' },
  { label: 'Categories', href: '/categories', dropdown: true },
  { label: 'Brands', href: '/brands' },
  { label: 'About Us', href: '/about' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contact', href: '/contact' },
];

function headerHtml(categories, active, user) {
  const navItems = NAV.map((item) => {
    const isActive = item.href === active || (item.href !== '/' && active.startsWith(item.href));
    if (!item.dropdown) {
      return `<li><a href="${item.href}" ${isActive ? 'aria-current="page"' : ''}>${item.label}</a></li>`;
    }
    return `
      <li class="nav-dropdown">
        <a href="${item.href}" ${isActive ? 'aria-current="page"' : ''}>${item.label} ${icons.chevronDown}</a>
        <ul class="nav-dropdown-menu">
          ${categories
            .map((c) => `<li><a href="/shop?category=${encodeURIComponent(c.slug)}">${escapeHtml(c.name)}</a></li>`)
            .join('')}
          <li><a href="/categories">All categories</a></li>
        </ul>
      </li>`;
  }).join('');

  const mobileItems = NAV.map((item) =>
    item.dropdown
      ? `<li>
          <a href="${item.href}">${item.label}</a>
          <ul class="subnav">
            ${categories.map((c) => `<li><a href="/shop?category=${encodeURIComponent(c.slug)}">${escapeHtml(c.name)}</a></li>`).join('')}
          </ul>
        </li>`
      : `<li><a href="${item.href}">${item.label}</a></li>`
  ).join('');

  return `
  <div class="container header-inner">
    <a class="brand" href="/" aria-label="Aurora Skincare home">
      ${logoMark}
      <span class="brand-text">
        <span class="brand-name">AURORA SKINCARE</span>
        <span class="brand-sub">Skincare</span>
      </span>
    </a>
    <nav class="main-nav" aria-label="Main">
      <ul>${navItems}</ul>
    </nav>
    <div class="header-actions">
      <button type="button" class="icon-btn" data-open-search aria-label="Search products">${icons.search}</button>
      <a class="icon-btn" href="/account" aria-label="${user ? `Account: ${escapeHtml(user.name)}` : 'Sign in or create an account'}">${icons.user}</a>
      <a class="icon-btn" href="/wishlist" aria-label="Wishlist">
        ${icons.heart}<span class="count-badge" data-wishlist-count>0</span>
      </a>
      <button type="button" class="icon-btn" data-open-cart aria-label="Shopping bag">
        ${icons.bag}<span class="count-badge" data-cart-count-badge>0</span>
      </button>
      <button type="button" class="icon-btn burger" data-open-menu aria-label="Open menu" aria-expanded="false">
        ${icons.menu}
      </button>
    </div>
  </div>
  <div class="mobile-nav" id="mobile-nav" aria-hidden="true" aria-label="Mobile navigation">
    <div class="mobile-nav__head">
      <span class="brand-text"><span class="brand-name">AURORA</span><span class="brand-sub">Skincare</span></span>
      <button type="button" class="icon-btn" data-close-menu aria-label="Close menu">${icons.close}</button>
    </div>
    <ul>${mobileItems}</ul>
    <div style="margin-top:1.25rem;display:grid;gap:.5rem">
      <a class="btn btn--block" href="/shop">Shop all products</a>
      <a class="btn btn--ghost btn--block" href="${user ? '/account' : '/account?mode=register'}">${user ? 'My account' : 'Create an account'}</a>
    </div>
  </div>`;
}

function footerHtml(content, categories) {
  const social = content.social || { links: [] };
  const socialLinks = (social.links || [])
    .map((link) => {
      const href = link.href || '';
      const label = `${link.label}${href ? '' : ' (placeholder — add a real URL in the admin area)'}`;
      return `<a href="${href || '#'}" ${href ? 'target="_blank" rel="noopener"' : 'aria-disabled="true"'} aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}">${icons[link.icon] || icons.info}</a>`;
    })
    .join('');

  const contact = content.contact || {};
  return `
  <div class="container footer-top">
    <div class="footer-col footer-about">
      <a class="brand" href="/" aria-label="Aurora Skincare home">${logoMark}
        <span class="brand-text"><span class="brand-name">AURORA SKINCARE</span><span class="brand-sub">Skincare</span></span>
      </a>
      <p style="margin-top:.9rem">${escapeHtml((content.brand && content.brand.description) || '')}</p>
      <div class="social-row">${socialLinks}</div>
    </div>
    ${(content.footer?.columns || [])
      .map(
        (column) => `
      <div class="footer-col">
        <h3>${escapeHtml(column.title)}</h3>
        <ul>${column.links.map((l) => `<li><a href="${l.href}">${escapeHtml(l.label)}</a></li>`).join('')}</ul>
      </div>`
      )
      .join('')}
    <div class="footer-col footer-contact">
      <h3>Contact Us</h3>
      <p><strong>Email</strong> ${escapeHtml(contact.email || '')}</p>
      <p><strong>Phone</strong> ${escapeHtml(contact.phone || '')}</p>
      <p><strong>Address</strong> ${escapeHtml(contact.address || '')}</p>
      <p><strong>Hours</strong> ${escapeHtml(contact.hours || '')}</p>
      ${contact.isSample ? `<p class="footer-note">${escapeHtml(contact.note || '')}</p>` : ''}
    </div>
  </div>
  <div class="container footer-bottom">
    <span>${escapeHtml((content.footer && content.footer.copyright) || '')}</span>
    <span class="footer-note">${escapeHtml((content.footer && content.footer.paymentNote) || '')}</span>
    <span class="footer-legal">
      <a href="/info?doc=privacy">Privacy</a>
      <a href="/info?doc=terms">Terms</a>
      <a href="/info?doc=cookies">Cookies</a>
    </span>
  </div>`;
}

function shellExtrasHtml(content) {
  const tiles = (content.gallery?.tiles || [])
    .slice(0, 6)
    .map((tile) => `<button type="button" data-search-term="${escapeHtml(tile.alt.split(' ').slice(0, 3).join(' '))}" hidden></button>`)
    .join('');
  return `
  <div class="scrim" data-scrim hidden></div>
  <aside class="cart-drawer" id="cart-drawer" aria-hidden="true" aria-label="Shopping bag">
    <div class="drawer-head">
      <h2>Your bag</h2>
      <span class="muted" data-cart-count></span>
      <button type="button" class="icon-btn" data-close-cart aria-label="Close bag">${icons.close}</button>
    </div>
    <div class="drawer-body"></div>
    <div class="drawer-foot"></div>
  </aside>
  <div class="search-panel" id="search-panel" aria-hidden="true" role="dialog" aria-label="Search products">
    <div class="container">
      <form role="search">
        <label class="sr-only" for="site-search">Search products</label>
        <input class="input" id="site-search" type="search" name="q" placeholder="Search serums, lipsticks, brands…" autocomplete="off">
        <button class="btn" type="submit">Search</button>
        <button class="icon-btn" type="button" data-close-search aria-label="Close search">${icons.close}</button>
      </form>
      <div class="search-hints">
        <span>Popular:</span>
        ${['serum', 'moisturiser', 'lipstick', 'perfume', 'sunscreen']
          .map((term) => `<button type="button" data-search-term="${term}">${term}</button>`)
          .join('')}
      </div>
      <div class="search-suggestions"></div>
    </div>
  </div>
  <div class="toast-stack" role="status" aria-live="polite"></div>
  ${tiles}`;
}

/** Renders the shared shell. Returns { content, categories }. */
export async function mountShell(activePath = location.pathname) {
  const [content, categoryList] = await Promise.all([
    getContent(),
    api.get('/api/categories').catch(() => []),
  ]);
  await session.load().catch(() => null);

  const header = document.getElementById('site-header');
  const footer = document.getElementById('site-footer');
  header.innerHTML = headerHtml(categoryList, activePath, session.user);
  footer.innerHTML = footerHtml(content, categoryList);

  const extras = document.createElement('div');
  extras.innerHTML = shellExtrasHtml(content);
  document.body.append(...extras.children);

  drawerEl = document.getElementById('cart-drawer');
  scrimEl = document.querySelector('[data-scrim]');
  searchEl = document.getElementById('search-panel');

  bindDrawer();
  bindSearch();

  const stickyObserver = () => {
    const stuck = window.scrollY > 8;
    header.classList.toggle('is-stuck', stuck);
  };
  stickyObserver();
  window.addEventListener('scroll', stickyObserver, { passive: true });

  const mobileNav = document.getElementById('mobile-nav');
  const openMenu = () => {
    mobileNav.classList.add('is-open');
    mobileNav.setAttribute('aria-hidden', 'false');
    scrimEl.hidden = false;
    scrimEl.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    header.querySelector('[data-open-menu]')?.setAttribute('aria-expanded', 'true');
    mobileNav.querySelector('a')?.focus();
  };
  const closeMenu = () => {
    mobileNav.classList.remove('is-open');
    mobileNav.setAttribute('aria-hidden', 'true');
    if (!drawerEl.classList.contains('is-open')) {
      scrimEl.classList.remove('is-open');
      document.body.style.overflow = '';
    }
    header.querySelector('[data-open-menu]')?.setAttribute('aria-expanded', 'false');
  };

  header.addEventListener('click', (event) => {
    if (event.target.closest('[data-open-cart]')) openCart();
    if (event.target.closest('[data-open-menu]')) openMenu();
    if (event.target.closest('[data-open-search]')) openSearch();
  });
  mobileNav.addEventListener('click', (event) => {
    if (event.target.closest('[data-close-menu]')) closeMenu();
  });
  searchEl.addEventListener('click', (event) => {
    if (event.target.closest('[data-close-search]')) closeSearch();
  });
  scrimEl.addEventListener('click', () => {
    closeCart();
    closeMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeCart();
      closeSearch();
      closeMenu();
    }
    if (event.key === '/' && !/input|textarea|select/i.test(document.activeElement.tagName)) {
      event.preventDefault();
      openSearch();
    }
    trapFocus(searchEl, event);
  });

  const syncCounts = () => {
    const cartCount = cart.count();
    const badge = header.querySelector('[data-cart-count-badge]');
    if (badge) {
      badge.textContent = cartCount;
      badge.dataset.empty = String(cartCount === 0);
    }
    const wishBadge = header.querySelector('[data-wishlist-count]');
    if (wishBadge) {
      wishBadge.textContent = wishlist.count();
      wishBadge.dataset.empty = String(wishlist.count() === 0);
    }
  };
  syncCounts();
  renderCartDrawer();
  subscribe(() => {
    syncCounts();
    renderCartDrawer();
  });

  bindProductActions();
  wireNewsletterForms();
  return { content, categories: categoryList };
}

/* -------------------------------------------------------------- newsletter */

export function newsletterBlock(content) {
  const cfg = content.newsletter || {};
  return `
  <section class="section" aria-labelledby="newsletter-title">
    <div class="container">
      <div class="newsletter">
        <div class="newsletter__intro">
          <span class="newsletter__icon">${icons.mail}</span>
          <div>
            <h2 id="newsletter-title">${escapeHtml(cfg.title || 'Stay Beautiful, Stay Updated')}</h2>
            <p>${escapeHtml(cfg.subtext || '')}</p>
          </div>
        </div>
        <form data-newsletter novalidate>
          <div class="input-group">
            <label class="sr-only" for="newsletter-email">Email address</label>
            <input class="input" id="newsletter-email" type="email" name="email" required placeholder="Enter your email address" autocomplete="email">
            <button class="btn" type="submit">${escapeHtml(cfg.buttonLabel || 'Subscribe Now')}</button>
          </div>
          <label class="checkbox">
            <input type="checkbox" name="consent" checked>
            <span>${escapeHtml(cfg.consentLabel || 'I agree to receive marketing emails.')}</span>
          </label>
          <p class="form-note" data-newsletter-status role="status"></p>
        </form>
      </div>
    </div>
  </section>`;
}

export function wireNewsletterForms(root = document) {
  root.querySelectorAll('[data-newsletter]').forEach((form) => {
    if (form.dataset.bound) return;
    form.dataset.bound = 'true';
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const status = form.querySelector('[data-newsletter-status]');
      const email = form.querySelector('input[type="email"]').value.trim();
      const consent = !!form.querySelector('input[name="consent"]')?.checked;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        status.textContent = 'Please enter a valid email address.';
        status.style.color = 'var(--danger)';
        return;
      }
      const button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      try {
        const content = await getContent();
        const result = await api.post('/api/newsletter', { email, consent, source: 'website' });
        status.textContent = result.duplicate
          ? 'You are already on the list with this address.'
          : (content.newsletter && content.newsletter.successMessage) || 'Subscribed.';
        status.style.color = 'var(--success)';
        form.reset();
        toast('Thanks — you are on the list.');
      } catch (err) {
        status.textContent = err.message;
        status.style.color = 'var(--danger)';
      } finally {
        button.disabled = false;
      }
    });
  });
}

/* ---------------------------------------------------------------- utilities */

export function getParam(name) {
  return new URLSearchParams(location.search).get(name);
}

export function lazyLoadImages(root = document) {
  root.querySelectorAll('img[data-src]').forEach((img) => {
    img.src = img.dataset.src;
    img.removeAttribute('data-src');
  });
}

export function bindTabs(root) {
  const lists = root.querySelectorAll('[data-tabs]');
  lists.forEach((tabs) => {
    const buttons = [...tabs.querySelectorAll('[role="tab"]')];
    buttons.forEach((button, index) => {
      button.addEventListener('click', () => activate(index));
      button.addEventListener('keydown', (event) => {
        if (!['ArrowRight', 'ArrowLeft'].includes(event.key)) return;
        event.preventDefault();
        const next = event.key === 'ArrowRight' ? (index + 1) % buttons.length : (index - 1 + buttons.length) % buttons.length;
        buttons[next].focus();
        activate(next);
      });
    });
    const activate = (index) => {
      buttons.forEach((button, i) => {
        button.setAttribute('aria-selected', String(i === index));
        const panel = document.getElementById(button.getAttribute('aria-controls'));
        if (panel) panel.hidden = i !== index;
      });
    };
    activate(0);
  });
}
