/** Homepage: featured carousel, services, "why choose" and the team preview. */
import { PROPERTIES, SERVICES, WHY_US, AGENTS } from '../data/properties.js';
import { propertyCardHTML } from '../components/property-card.js';
import { initCarousel } from '../components/carousel.js';
import { initReveal } from '../components/reveal.js';
import { icons } from '../lib/icons.js';
import { escapeHtml, qs } from '../lib/utils.js';

const featured = PROPERTIES.filter((property) => property.featured);

/* --- Featured properties carousel --------------------------------------- */
const track = qs('[data-featured-track]');
if (track) {
  track.innerHTML = featured
    .map(
      (property, index) =>
        `<div class="carousel__item" data-carousel-item>${propertyCardHTML(property, {
          variant: 'overlay',
          eager: index < 2
        })}</div>`
    )
    .join('');
  initCarousel(qs('[data-featured]'), { label: 'Featured properties', loop: true });
}

/* --- Services ----------------------------------------------------------- */
const servicesHost = qs('[data-services-grid]');
if (servicesHost) {
  servicesHost.innerHTML = SERVICES.map(
    (service, index) => `
      <article class="service reveal reveal--delay-${(index % 3) + 1}">
        <p class="service__index">${String(index + 1).padStart(2, '0')}</p>
        <h3>${escapeHtml(service.title)}</h3>
        <p>${escapeHtml(service.summary)}</p>
        ${
          service.image
            ? `<div class="service__media"><img src="${service.image}" alt="" loading="lazy" decoding="async" width="1000" height="720"></div>`
            : ''
        }
      </article>`
  ).join('');
}

/* --- Why choose Horizon ------------------------------------------------- */
const whyHost = qs('[data-why-grid]');
if (whyHost) {
  whyHost.innerHTML = WHY_US.map(
    (item, index) => `
      <div class="why__item reveal reveal--delay-${(index % 4) + 1}">
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.text)}</p>
      </div>`
  ).join('');
}

/* --- Team preview ------------------------------------------------------- */
const teamHost = qs('[data-team-grid]');
if (teamHost) {
  teamHost.innerHTML = AGENTS.map(
    (agent, index) => `
      <article class="member reveal reveal--delay-${(index % 4) + 1}">
        <div class="member__media">
          <img src="${agent.photo}" alt="${escapeHtml(agent.name)}, ${escapeHtml(agent.role)}"
               loading="lazy" decoding="async" width="620" height="760">
          <div class="member__overlay">
            <a class="member__link" href="mailto:${agent.email}">${icons.mail}Email</a>
            <a class="member__link" href="${agent.phoneHref}">${icons.phone}Call</a>
          </div>
        </div>
        <div class="member__body">
          <h3 class="member__name">${escapeHtml(agent.name)}</h3>
          <p class="member__role">${escapeHtml(agent.role)}</p>
        </div>
      </article>`
  ).join('');
}

initReveal();
