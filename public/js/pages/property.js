/**
 * Property detail page. Reads `?id=` and renders the whole record: gallery,
 * facts, description, features, advisor and similar properties.
 */
import { getProperty, getAgent, similarProperties, PROPERTIES } from '../data/properties.js';
import { initGallery } from '../components/gallery.js';
import { propertyCardListHTML } from '../components/property-card.js';
import { initCarousel } from '../components/carousel.js';
import { openEnquiry } from '../components/enquiry.js';
import { initReveal } from '../components/reveal.js';
import { isFavorite, toggleFavorite } from '../lib/favorites.js';
import { icons } from '../lib/icons.js';
import { escapeHtml, param, qs, formatPriceFull, plural } from '../lib/utils.js';

const CAPTIONS = [
  'Exterior view',
  'Living area',
  'Principal bedroom',
  'Kitchen and dining',
  'Bathroom'
];

const id = param('id');
const property = getProperty(id) || PROPERTIES[0];
const agent = getAgent(property.agentId);

const galleryHost = qs('[data-gallery]');
const headHost = qs('[data-detail-head]');
const mainHost = qs('[data-detail-main]');
const sidebarHost = qs('[data-detail-sidebar]');
const similarHost = qs('[data-similar]');

if (galleryHost && headHost && mainHost && sidebarHost) {
  document.title = `${property.title} — Horizon Properties`;

  /* --- Gallery ----------------------------------------------------------- */
  initGallery(
    galleryHost,
    property.gallery.map((src, index) => ({
      src,
      alt: `${property.title}, ${property.location} — ${CAPTIONS[index] || 'Interior'}`
    }))
  );

  /* --- Title block ------------------------------------------------------- */
  headHost.innerHTML = `
    <div>
      <p class="eyebrow">${escapeHtml(property.status)} · ${escapeHtml(property.type)}</p>
      <h1 class="detail__title">${escapeHtml(property.title)}</h1>
      <p class="detail__location">${icons.pin}${escapeHtml(property.location)}</p>
    </div>
    <div>
      <p class="detail__price">${escapeHtml(property.priceLabel)}</p>
      <p class="detail__price-note">${formatPriceFull(property.price)} · ${property.sqft.toLocaleString('en-US')} sq ft</p>
      <button class="chip" type="button" data-save="${property.id}" aria-pressed="${isFavorite(property.id)}">
        ${icons.heart}<span data-save-label>${isFavorite(property.id) ? 'Saved' : 'Save property'}</span>
      </button>
    </div>`;

  /* --- Body -------------------------------------------------------------- */
  /* Land is meaningless for the two apartment listings, so it is optional. */
  const specs = [
    ['Bedrooms', plural(property.beds, 'bedroom')],
    ['Bathrooms', plural(property.baths, 'bathroom')],
    ['Interior', `${property.sqft.toLocaleString('en-US')} sq ft`],
    property.lot ? ['Land', property.lot] : null,
    ['Built', String(property.year)]
  ].filter(Boolean);

  mainHost.innerHTML = `
    <div class="spec-grid reveal">
      ${specs
        .map(
          ([label, value]) =>
            `<div class="spec"><p class="spec__label">${label}</p><p class="spec__value">${escapeHtml(value)}</p></div>`
        )
        .join('')}
    </div>

    <section class="detail__block reveal">
      <h2>About this property</h2>
      <p class="lead">${escapeHtml(property.tagline)}</p>
      <p>${escapeHtml(property.description)}</p>
    </section>

    <section class="detail__block reveal">
      <h2>Key features</h2>
      <ul class="feature-list">
        ${property.features.map((feature) => `<li>${escapeHtml(feature)}</li>`).join('')}
      </ul>
    </section>

    <section class="detail__block reveal">
      <h2>Amenities</h2>
      <div class="tag-list">
        ${property.amenities.map((amenity) => `<span class="tag">${escapeHtml(amenity)}</span>`).join('')}
      </div>
    </section>`;

  /* --- Advisor + CTAs ---------------------------------------------------- */
  sidebarHost.innerHTML = `
    <div class="agent-card reveal">
      <div class="agent-card__head">
        <img class="agent-card__photo" src="${agent.photo}" alt="${escapeHtml(agent.name)}"
             loading="lazy" decoding="async" width="64" height="64">
        <div>
          <h3 class="agent-card__name">${escapeHtml(agent.name)}</h3>
          <p class="agent-card__role">${escapeHtml(agent.role)}</p>
        </div>
      </div>
      <p class="agent-card__bio">${escapeHtml(agent.bio)}</p>
      <div class="agent-card__actions">
        <button class="btn btn--primary btn--block" type="button" data-viewing>
          ${icons.calendar}Schedule a viewing
        </button>
        <button class="btn btn--outline btn--block" type="button" data-contact>
          ${icons.mail}Contact advisor
        </button>
      </div>
      <div class="agent-card__contact">
        <a href="${agent.phoneHref}">${agent.phone}</a>
        <a href="mailto:${agent.email}">${agent.email}</a>
      </div>
    </div>`;

  /* --- Similar properties ------------------------------------------------ */
  const similar = similarProperties(property, 4);
  if (similarHost && similar.length) {
    similarHost.innerHTML = `
      <div class="carousel" data-featured>
        <div class="carousel__viewport" data-carousel-viewport>
          <div class="carousel__track">
            ${similar
              .map(
                (item) =>
                  `<div class="carousel__item" data-carousel-item>${propertyCardListHTML([item])}</div>`
              )
              .join('')}
          </div>
        </div>
        <div class="carousel__controls">
          <div class="carousel__dots" data-carousel-dots></div>
          <div class="carousel__nav">
            <button class="carousel__btn" type="button" data-carousel-prev aria-label="Previous properties">${icons.chevronLeft}</button>
            <button class="carousel__btn" type="button" data-carousel-next aria-label="Next properties">${icons.chevronRight}</button>
          </div>
        </div>
      </div>`;
    initCarousel(qs('[data-featured]'), { label: 'Similar properties' });
  } else if (similarHost) {
    similarHost.closest('section')?.remove();
  }

  /* --- Interactions ------------------------------------------------------ */
  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-viewing]') || event.target.closest('[data-sticky-viewing]')) {
      openEnquiry({ mode: 'viewing', property, agent });
    }
    if (event.target.closest('[data-contact]') || event.target.closest('[data-sticky-contact]')) {
      openEnquiry({ mode: 'contact', property, agent });
    }
  });

  /* The detail-page save button carries a text label, so keep it in sync too. */
  const saveButton = qs('.detail__head [data-save]');
  const saveLabel = qs('[data-save-label]');
  if (saveButton && saveLabel) {
    const syncLabel = () => {
      const saved = isFavorite(property.id);
      saveButton.setAttribute('aria-pressed', String(saved));
      saveLabel.textContent = saved ? 'Saved' : 'Save property';
    };
    saveButton.addEventListener('click', () => {
      toggleFavorite(property.id);
      syncLabel();
    });
    window.addEventListener('favorites:change', syncLabel);
  }

  /* Mobile sticky bar appears once the title block scrolls away. */
  const sticky = qs('[data-sticky-cta]');
  if (sticky) {
    const onScroll = () => {
      const passed = window.scrollY > (headHost.offsetTop || 200);
      sticky.classList.toggle('is-visible', passed && window.innerWidth < 768);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  initReveal();
}
