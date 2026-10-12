/**
 * Category directory (/categories) and brand directory (/brands).
 */

import { api, escapeHtml, query } from '../api.js';
import { breadcrumbs, categoryCard, emptyState, icons, mountShell, setPageMeta } from '../ui.js';

const page = document.body.dataset.page;
const { categories } = await mountShell(page === 'brands' ? '/brands' : '/categories');
const root = document.getElementById('catalog-root');
const breadcrumbMount = document.getElementById('catalog-breadcrumbs');

if (page === 'categories') {
  breadcrumbMount.innerHTML = breadcrumbs([{ label: 'Categories' }]);
  setPageMeta({
    title: 'Shop by Category — Aurora Skincare',
    description:
      'Browse Aurora Skincare by category: skincare, makeup, hair care, bath and body, fragrance, and beauty tools.',
    path: '/categories',
  });

  const products = await api.get('/api/products?perPage=4&sort=featured').catch(() => ({ items: [] }));

  root.innerHTML = `
  <div class="container section" style="padding-top:1rem">
    <div class="category-row scroller">
      ${categories.map(categoryCard).join('')}
    </div>

    <div class="stack" style="margin-top:3rem">
      ${categories
        .map(
          (category) => `
        <section class="card" style="display:grid;gap:1rem">
          <div style="display:flex;flex-wrap:wrap;gap:1rem;align-items:center;justify-content:space-between">
            <div style="display:flex;gap:1rem;align-items:center">
              <img src="${escapeHtml(category.image)}" alt="" width="72" height="72"
                style="width:72px;height:72px;border-radius:50%;object-fit:cover">
              <div>
                <h2 style="font-size:var(--step-2);margin:0">${escapeHtml(category.name)}</h2>
                <p class="muted" style="margin:.2rem 0 0">${escapeHtml(category.description || '')}</p>
              </div>
            </div>
            <a class="btn btn--sm" href="/shop?category=${encodeURIComponent(category.slug)}">
              Shop ${escapeHtml(category.name)} (${category.productCount}) ${icons.arrowRight}
            </a>
          </div>
        </section>`
        )
        .join('')}
    </div>

    ${
      products.items.length
        ? `<section class="section">
            <div class="section-head"><h2>Featured right now</h2>
              <a class="section-link" href="/shop">Shop all ${icons.arrowRight}</a></div>
            <div class="product-grid product-grid--four">
              ${products.items
                .map(
                  (item) => `<article class="product-card">
                    <div class="product-card__media">
                      <a href="/product?slug=${encodeURIComponent(item.slug)}">
                        <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy">
                      </a>
                    </div>
                    <div class="product-card__body">
                      <h3 class="product-card__title"><a href="/product?slug=${encodeURIComponent(item.slug)}">${escapeHtml(
                        item.name
                      )}</a></h3>
                    </div>
                  </article>`
                )
                .join('')}
            </div>
          </section>`
        : ''
    }
  </div>`;
} else {
  breadcrumbMount.innerHTML = breadcrumbs([{ label: 'Brands' }]);
  setPageMeta({
    title: 'Our Brands — Aurora Skincare',
    description:
      'The house brands stocked at Aurora Skincare, from our own signature line to botanical, active-led, colour, fragrance and tool specialists.',
    path: '/brands',
  });

  const brands = await api.get('/api/brands').catch(() => []);
  const list = [...brands].sort((a, b) => a.name.localeCompare(b.name));

  root.innerHTML = `
  <div class="container section" style="padding-top:1rem">
    <div class="toolbar">
      <form id="brand-search" role="search" style="display:flex;gap:.5rem;max-width:380px;flex:1">
        <label class="sr-only" for="brand-q">Search brands</label>
        <input class="input" id="brand-q" type="search" placeholder="Search brands">
        <button class="btn btn--sm" type="submit">Search</button>
      </form>
      <p class="toolbar__count" id="brand-count">${list.length} brands</p>
    </div>

    <div class="grid" id="brand-list" style="grid-template-columns:repeat(auto-fit,minmax(280px,1fr))">
      ${list
        .map(
          (brand) => `
        <article class="card" data-name="${escapeHtml(brand.name.toLowerCase())}">
          <h2 style="font-size:var(--step-2);margin-bottom:.25rem">${escapeHtml(brand.name)}</h2>
          <p class="badge" style="margin-bottom:.5rem">${escapeHtml(brand.tagline || '')}</p>
          <p class="muted">${escapeHtml(brand.description || '')}</p>
          <p class="muted" style="font-size:var(--step--1)">${brand.productCount} product${
            brand.productCount === 1 ? '' : 's'
          } available</p>
          <a class="btn btn--sm" href="/shop?brand=${encodeURIComponent(brand.slug)}">
            Shop ${escapeHtml(brand.name)} ${icons.arrowRight}
          </a>
        </article>`
        )
        .join('')}
    </div>
    <div id="brand-empty" hidden>${emptyState({
      icon: 'search',
      title: 'No brands match that search',
      text: 'Try a different name.',
    })}</div>

    <section class="section">
      <div class="section-head"><h2>Browse every product</h2>
        <a class="section-link" href="/shop">Open the shop ${icons.arrowRight}</a></div>
      <div class="product-grid product-grid--four" id="brand-featured"></div>
    </section>
  </div>`;

  const cards = [...root.querySelectorAll('[data-name]')];
  document.getElementById('brand-search').addEventListener('submit', (event) => {
    event.preventDefault();
    const term = event.target.q.value.trim().toLowerCase();
    let visible = 0;
    cards.forEach((card) => {
      const match = !term || card.dataset.name.includes(term);
      card.hidden = !match;
      if (match) visible += 1;
    });
    document.getElementById('brand-count').textContent = `${visible} brands`;
    document.getElementById('brand-empty').hidden = visible > 0;
  });

  const featured = await api.get(`/api/products${query({ perPage: 4, sort: 'rating' })}`).catch(() => ({ items: [] }));
  document.getElementById('brand-featured').innerHTML = featured.items
    .map(
      (item) => `<article class="product-card">
        <div class="product-card__media">
          <a href="/product?slug=${encodeURIComponent(item.slug)}">
            <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy">
          </a>
        </div>
        <div class="product-card__body">
          <h3 class="product-card__title"><a href="/product?slug=${encodeURIComponent(item.slug)}">${escapeHtml(item.name)}</a></h3>
          <span class="product-card__category">${escapeHtml(item.brand.replace(/-/g, ' '))}</span>
        </div>
      </article>`
    )
    .join('');
}
