/**
 * Homepage — hero, trust strip, categories, best sellers, promotional banner,
 * social gallery and newsletter, in the order defined by the brand brief.
 */

import { api } from '../api.js';
import { money } from '../store.js';
import {
  categoryCard,
  icons,
  mountShell,
  newsletterBlock,
  priceBlock,
  productCard,
  setPageMeta,
  skeletonCards,
  stars,
} from '../ui.js';

const { content, categories } = await mountShell('/');

setPageMeta({
  title: 'Aurora Skincare — Premium Skincare & Beauty',
  description:
    'Shop Aurora Skincare for serums, moisturisers, makeup, fragrance and body care. Thoughtful formulas, readable ingredient lists and everyday rituals.',
  path: '/',
  image: '/assets/img/hero/hero-model.webp',
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Aurora Skincare',
    url: location.origin,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${location.origin}/shop?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Aurora Skincare',
      description: (content.brand && content.brand.description) || '',
    },
  },
});

/* -------------------------------------------------------------------- hero */

const hero = content.hero || {};
document.getElementById('home-hero').innerHTML = `
  <div class="container hero__inner">
    <div class="hero__copy">
      <p class="hero__eyebrow reveal">${icons.sparkle} ${hero.eyebrow || ''}</p>
      <h1 class="reveal">
        ${hero.headlineLine1 || 'Beauty That'}<br>
        <em>${hero.headlineAccent || 'Defines'}</em> ${hero.headlineLine2 || 'You'}
      </h1>
      <p class="hero__text reveal reveal-2">${hero.subtext || ''}</p>
      <div class="hero__cta reveal reveal-3">
        <a class="btn" href="${hero.primaryCta?.href || '/shop'}">${hero.primaryCta?.label || 'Shop Now'} ${icons.arrowRight}</a>
        <a class="btn btn--ghost" href="${hero.secondaryCta?.href || '/categories'}">${icons.play} ${hero.secondaryCta?.label || 'Explore More'}</a>
      </div>
      <div class="social-proof reveal reveal-4">
        <span class="avatars" aria-hidden="true">
          ${['a1', 'a2', 'a3', 'a4', 'a5']
            .map((a) => `<img src="/assets/img/avatars/${a}.webp" alt="" width="80" height="80" loading="lazy">`)
            .join('')}
        </span>
        <span class="social-proof__meta">
          ${stars(hero.ratingValue || 4.9, null, { showCount: false })}
          <strong>${hero.ratingText || '4.9/5 (2.5k+ Reviews)'}</strong>
        </span>
      </div>
    </div>
    <div class="hero__visual">
      <figure class="hero__figure reveal reveal-2">
        <img src="/assets/img/hero/hero-model.webp"
          alt="Model with a radiant complexion applying Aurora Skincare serum"
          width="1100" height="1400" fetchpriority="high" decoding="async">
      </figure>
      <p class="hero__badge reveal reveal-3" aria-label="${hero.badge || '100% safe and natural'}">
        100%<span>SAFE &amp;</span>NATURAL
      </p>
      <div class="hero__chips reveal reveal-4">
        ${(hero.productChips || [])
          .map(
            (chip) => `<a class="hero__chip" href="${chip.href}">
              <strong>${chip.name}</strong><span>${money(chip.price)}</span>
            </a>`
          )
          .join('')}
      </div>
    </div>
  </div>`;

/* ------------------------------------------------------------- trust strip */

document.getElementById('home-trust').innerHTML = `
  <div class="container">
    <ul class="trust-list">
      ${(content.trust || [])
        .map(
          (item) => `
        <li class="trust-item">
          ${icons[item.icon] || icons.sparkle}
          <span>
            <h3>${item.title}</h3>
            <p>${item.sub}</p>
          </span>
        </li>`
        )
        .join('')}
    </ul>
    <p class="trust-note">${content.trustNote || ''}</p>
  </div>`;

/* -------------------------------------------------------------- categories */

document.getElementById('home-categories').innerHTML = `
  <div class="container">
    <div class="section-head">
      <div>
        <h2>Shop by Category</h2>
        <p class="section-sub">Find your next favourite by the step it belongs to.</p>
      </div>
      <a class="section-link" href="/categories">View All Categories ${icons.arrowRight}</a>
    </div>
    <div class="category-row scroller">${categories.map(categoryCard).join('')}</div>
  </div>`;

/* ------------------------------------------------------------ best sellers */

const bestSellerGrid = document.getElementById('best-sellers-grid');
bestSellerGrid.classList.add('product-grid');
bestSellerGrid.innerHTML = skeletonCards(5);

const bestSellers = await api
  .get('/api/products?bestsellers=1&perPage=5')
  .catch(() => ({ items: [] }));
bestSellerGrid.innerHTML = bestSellers.items.length
  ? bestSellers.items.map((product) => productCard(product)).join('')
  : '';
document.getElementById('best-sellers-section').hidden = !bestSellers.items.length;

/* ------------------------------------------------------------------ banner */

const banner = content.banner || {};
document.getElementById('home-banner').innerHTML = `
  <div class="container">
    <div class="promo">
      <div class="promo__inner">
        <div>
          <h2>${banner.headlineLine1 || 'Glow More,'}<br>${banner.headlineLine2 || 'Worry Less'}</h2>
          <p class="promo__text">${banner.subtext || ''}</p>
          <a class="btn" href="${banner.cta?.href || '/shop'}">${banner.cta?.label || 'Grab the Offer'} ${icons.arrowRight}</a>
        </div>
        <div class="promo__media">
          <img src="${banner.image}" alt="Aurora Skincare serum, cream and botanical set" loading="lazy" decoding="async" width="900" height="620">
          <p class="promo__badge">
            ${banner.badge?.top || 'UP TO'}<span>${banner.badge?.value || '30%'}</span>${banner.badge?.bottom || 'OFF'}
          </p>
        </div>
        <ul class="promo__benefits">
          ${(banner.benefits || [])
            .map(
              (benefit) => `
            <li>
              ${icons[benefit.icon] || icons.check}
              <span><strong>${benefit.title}</strong><span>${benefit.sub}</span></span>
            </li>`
            )
            .join('')}
        </ul>
      </div>
    </div>
  </div>`;

/* ----------------------------------------------------------------- gallery */

const gallery = content.gallery || {};
document.getElementById('home-gallery').innerHTML = `
  <div class="container">
    <div class="section-head">
      <div>
        <h2>${gallery.title || '#AuroraGlow'}</h2>
        <p class="section-sub">Real routines, soft mornings and everything in between.</p>
      </div>
      <a class="section-link" href="${gallery.followHref || '#'}" ${gallery.followHref ? 'target="_blank" rel="noopener"' : 'aria-disabled="true"'}>
        ${gallery.followLabel || 'Follow Us'} ${icons.arrowRight}
      </a>
    </div>
    <div class="gallery-row gallery-scroller scroller">
      ${(gallery.tiles || [])
        .map(
          (tile) => `
        <a class="gallery-tile" href="${tile.href || '#'}" ${tile.href ? 'target="_blank" rel="noopener"' : 'aria-disabled="true"'}>
          <img src="${tile.image}" alt="${tile.alt}" loading="lazy" decoding="async" width="760" height="760">
          <span class="gallery-tile__overlay">${icons.instagram}</span>
        </a>`
        )
        .join('')}
    </div>
    ${
      content.social && content.social.configured === false
        ? `<p class="trust-note">${content.social.note || ''}</p>`
        : ''
    }
  </div>`;

/* -------------------------------------------------------------- newsletter */

document.getElementById('home-newsletter').innerHTML = newsletterBlock(content);
