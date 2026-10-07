/**
 * Property card — the one component used by the homepage carousel, the listing
 * grid and the "similar properties" rail, so a listing looks identical wherever
 * it appears.
 */
import { icons } from '../lib/icons.js';
import { escapeHtml, formatPriceFull } from '../lib/utils.js';
import { isFavorite, toggleFavorite } from '../lib/favorites.js';

export function propertyCardHTML(
  property,
  { compact = false, eager = false, variant = 'default' } = {}
) {
  if (variant === 'overlay') return overlayCardHTML(property, { eager });

  const flag = property.featured
    ? '<span class="card__flag card__flag--gold">Featured</span>'
    : `<span class="card__flag">${escapeHtml(property.type)}</span>`;

  return `
  <article class="card${compact ? ' card--compact' : ''}">
    <div class="card__media">
      <img src="${property.image}"
           alt="${escapeHtml(property.title)}, ${escapeHtml(property.location)}"
           ${eager ? '' : 'loading="lazy"'} decoding="async" width="900" height="1120">
      ${flag}
      <button class="card__save" type="button" data-save="${property.id}"
              aria-pressed="${isFavorite(property.id)}"
              aria-label="Save ${escapeHtml(property.title)}">
        ${icons.heart}
      </button>
    </div>
    <div class="card__body">
      <p class="card__location">${escapeHtml(property.location)}</p>
      <h3 class="card__title">
        <a href="property.html?id=${encodeURIComponent(property.id)}">${escapeHtml(property.title)}</a>
      </h3>
      <ul class="card__meta">
        <li>${icons.bed}${property.beds} Beds</li>
        <li>${icons.bath}${property.baths} Baths</li>
        <li>${icons.area}${property.sqft.toLocaleString('en-US')} sq ft</li>
      </ul>
      <p class="card__price">${escapeHtml(property.priceLabel)}
        <span class="sr-only">(${formatPriceFull(property.price)})</span>
      </p>
    </div>
  </article>`;
}

/**
 * Editorial variant used by the homepage featured carousel: the photograph fills
 * the card and the caption sits over a scrim, so the image carries the section.
 * Same data, same save button and same whole-card link as the standard card.
 */
function overlayCardHTML(property, { eager = false } = {}) {
  return `
  <article class="card card--overlay">
    <img class="card__img" src="${property.image}"
         alt="${escapeHtml(property.title)}, ${escapeHtml(property.location)}"
         ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" width="900" height="1125">
    <button class="card__save" type="button" data-save="${property.id}"
            aria-pressed="${isFavorite(property.id)}"
            aria-label="Save ${escapeHtml(property.title)}">
      ${icons.heart}
    </button>
    <div class="card__overlay">
      <p class="card__location">${escapeHtml(property.location)}</p>
      <h3 class="card__title">
        <a href="property.html?id=${encodeURIComponent(property.id)}">${escapeHtml(property.title)}</a>
      </h3>
      <p class="card__price">${escapeHtml(property.priceLabel)}</p>
    </div>
  </article>`;
}

export const propertyCardListHTML = (properties, options = {}) =>
  properties.map((property) => propertyCardHTML(property, options)).join('');

/**
 * Wire every save button inside `scope` (delegated, so re-rendered grids keep
 * working without re-binding).
 */
export function initSaveButtons(scope = document) {
  scope.addEventListener('click', (event) => {
    const button = event.target.closest('[data-save]');
    if (!button) return;
    event.preventDefault();
    const saved = toggleFavorite(button.dataset.save);
    button.setAttribute('aria-pressed', String(saved));
    button.setAttribute(
      'aria-label',
      `${saved ? 'Remove' : 'Save'} ${button.closest('.card')?.querySelector('.card__title')?.textContent.trim() || 'property'}`
    );
  });
}

/** Re-sync every visible save button after the favorites store changes elsewhere. */
export function syncSaveButtons(scope = document) {
  scope.querySelectorAll('[data-save]').forEach((button) => {
    button.setAttribute('aria-pressed', String(isFavorite(button.dataset.save)));
  });
}
