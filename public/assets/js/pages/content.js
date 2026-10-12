/**
 * About page and the information / policy pages (shipping, returns, privacy,
 * terms, cookies, disclaimer, size guide, FAQ and order tracking).
 */

import { api, escapeHtml } from '../api.js';
import { money } from '../store.js';
import {
  breadcrumbs,
  categoryCard,
  emptyState,
  icons,
  mountShell,
  openCart,
  productCard,
  setPageMeta,
  toast,
} from '../ui.js';

const page = document.body.dataset.page;
const { content, categories } = await mountShell(page === 'about' ? '/about' : '/info');
const root = document.getElementById('content-root');
const breadcrumbMount = document.getElementById('content-breadcrumbs');

/* ------------------------------------------------------------------- about */

if (page === 'about') {
  const about = content.about || {};
  breadcrumbMount.innerHTML = breadcrumbs([{ label: 'About Us' }]);
  setPageMeta({
    title: 'About Aurora Skincare — thoughtful beauty, everyday rituals',
    description:
      'Discover our approach to thoughtful beauty, everyday skincare and products designed to make your routine feel special.',
    path: '/about',
    image: about.image,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: 'About Aurora Skincare',
      url: `${location.origin}/about`,
    },
  });

  const featured = await api.get('/api/products?perPage=4&sort=featured').catch(() => ({ items: [] }));

  root.innerHTML = `
  <section class="hero" style="padding-bottom:0">
    <div class="container" style="padding:clamp(2rem,5vw,4rem) 0">
      <div class="hero__copy" style="max-width:52rem">
        <p class="hero__eyebrow">${icons.leaf} Our story</p>
        <h1 style="font-size:var(--step-4)">${escapeHtml(about.heroTitle || '')}</h1>
        <p class="hero__text">${escapeHtml(about.heroText || '')}</p>
        <div class="hero__cta">
          <a class="btn" href="/shop">Shop the collection ${icons.arrowRight}</a>
          <a class="btn btn--ghost" href="/blog">Read the journal</a>
        </div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="shop-layout" style="grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:center">
        <div class="prose">
          <h2>How Aurora began</h2>
          ${(about.story || []).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}
        </div>
        <img src="${escapeHtml(about.image || '')}" alt="Aurora Skincare products styled on a soft pink surface"
          style="border-radius:var(--radius-lg);width:100%" loading="lazy" decoding="async">
      </div>
    </div>
  </section>

  <section class="section section--soft">
    <div class="container">
      <div class="section-head"><h2>Our philosophy</h2></div>
      <div class="card-grid">
        ${(about.philosophy || [])
          .map(
            (item) => `<article class="card">
              <h3 style="font-size:var(--step-1)">${escapeHtml(item.title)}</h3>
              <p class="muted" style="margin:0">${escapeHtml(item.text)}</p>
            </article>`
          )
          .join('')}
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="card-grid">
        ${(about.values || [])
          .map(
            (value) => `<article class="card card--soft">
              ${icons[value.icon] || icons.sparkle}
              <h3 style="font-size:var(--step-1);margin-top:.5rem">${escapeHtml(value.title)}</h3>
              <p class="muted" style="margin:0">${escapeHtml(value.text)}</p>
            </article>`
          )
          .join('')}
      </div>
      <div class="card" style="margin-top:2rem">
        <h3 style="font-size:var(--step-2)">How we choose products</h3>
        <ul class="stack" style="gap:.5rem;padding-left:1.1rem;color:var(--muted)">
          ${(about.principles || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
        </ul>
      </div>
    </div>
  </section>

  <section class="section section--soft">
    <div class="container">
      <div class="section-head">
        <h2>Shop by category</h2>
        <a class="section-link" href="/categories">All categories ${icons.arrowRight}</a>
      </div>
      <div class="category-row scroller">${categories.slice(0, 6).map(categoryCard).join('')}</div>
    </div>
  </section>

  ${
    featured.items.length
      ? `<section class="section">
          <div class="container">
            <div class="section-head">
              <h2>Featured products</h2>
              <a class="section-link" href="/shop">Shop all ${icons.arrowRight}</a>
            </div>
            <div class="product-grid product-grid--four">${featured.items.map((item) => productCard(item)).join('')}</div>
          </div>
        </section>`
      : ''
  }`;
} else {
  /* ---------------------------------------------------------------- info */

  const docKey = new URLSearchParams(location.search).get('doc') || 'faq';
  const docs = content.docs || {};
  const doc = docs[docKey];

  breadcrumbMount.innerHTML = breadcrumbs([{ label: doc ? doc.title : 'Information' }]);

  if (!doc) {
    setPageMeta({ title: 'Information — Aurora Skincare', path: '/info' });
    root.innerHTML = `<div class="container section">${emptyState({
      title: 'That page does not exist',
      text: 'Pick one of the information pages from the list.',
      actionHtml: '<a class="btn" href="/info?doc=faq">Read the FAQs</a>',
    })}</div>`;
  } else {
    setPageMeta({
      title: `${doc.title} — Aurora Skincare`,
      description: `${doc.title}: ${(doc.body || doc.updated || '').replace(/<[^>]+>/g, ' ').slice(0, 150)}`,
      path: `/info?doc=${docKey}`,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: doc.title,
        url: `${location.origin}/info?doc=${docKey}`,
      },
    });

    const docLinks = Object.entries(docs)
      .filter(([, value]) => value.title)
      .map(
        ([key, value]) =>
          `<li><a href="/info?doc=${key}" ${key === docKey ? 'aria-current="page"' : ''}>${escapeHtml(value.title)}</a></li>`
      )
      .join('');

    root.innerHTML = `
    <div class="container section" style="padding-top:1rem">
      <div class="split-layout">
        <aside class="card" aria-label="Information pages">
          <h2 style="font-size:var(--step-1)">Information</h2>
          <ul class="stack" style="list-style:none;gap:.5rem">${docLinks}</ul>
        </aside>
        <div>
          <h1 style="font-size:var(--step-3)">${escapeHtml(doc.title)}</h1>
          ${doc.updated ? `<p class="muted">${escapeHtml(doc.updated)}</p>` : ''}
          ${doc.trackOrder ? '<div id="track-order-panel"></div>' : `<div class="prose">${doc.body || ''}</div>`}
        </div>
      </div>
    </div>`;

    if (doc.trackOrder) {
      const panel = document.getElementById('track-order-panel');
      panel.innerHTML = `
      <form id="track-form" class="card" style="margin-bottom:1.5rem">
        <div class="field">
          <label for="track-number">Order number <span class="req">*</span></label>
          <input class="input" id="track-number" name="number" required placeholder="AUR-20260101-AB12">
        </div>
        <div class="field">
          <label for="track-email">Email used at checkout <span class="req">*</span></label>
          <input class="input" id="track-email" name="email" type="email" required>
        </div>
        <button class="btn" type="submit">Find my order</button>
      </form>
      <div id="track-result" role="status"></div>`;
      document.getElementById('track-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        const number = event.target.number.value.trim().toUpperCase();
        const email = event.target.email.value.trim();
        const result = document.getElementById('track-result');
        result.innerHTML = '<p class="muted">Looking for your order…</p>';
        try {
          const data = await api.get(
            `/api/orders/track/${encodeURIComponent(number)}?email=${encodeURIComponent(email)}`
          );
          const order = data.order;
          result.innerHTML = `
          <section class="card">
            <div style="display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap;align-items:center">
              <h2 style="font-size:var(--step-2);margin:0">Order ${escapeHtml(order.number)}</h2>
              <span class="status status--${escapeHtml(order.status)}">${escapeHtml(order.status)}</span>
            </div>
            <p class="muted">Placed ${escapeHtml(order.createdAt)} &middot; ${order.items.length} item${
              order.items.length === 1 ? '' : 's'
            } &middot; total ${money(order.total)}</p>
            <ul class="stack" style="list-style:none;gap:.4rem">
              ${order.items
                .map(
                  (item) =>
                    `<li>${escapeHtml(item.name)}${item.variant ? ` (${escapeHtml(item.variant)})` : ''} × ${item.quantity}
                      <span class="muted">— ${money(item.lineTotal)}</span></li>`
                )
                .join('')}
            </ul>
            <p style="margin-top:1rem"><a class="btn btn--sm" href="/order?number=${encodeURIComponent(
              order.number
            )}&email=${encodeURIComponent(email)}">Full order details ${icons.arrowRight}</a></p>
          </section>`;
        } catch (err) {
          result.innerHTML = `<div class="alert alert--error" role="alert">${escapeHtml(err.message)}</div>`;
        }
      });
    }
  }
}
