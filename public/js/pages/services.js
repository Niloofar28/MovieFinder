/** Services page — the full service list, rendered from the content layer. */
import { SERVICES } from '../data/properties.js';
import { initReveal } from '../components/reveal.js';
import { escapeHtml, qs } from '../lib/utils.js';

const host = qs('[data-services-list]');

if (host) {
  host.innerHTML = SERVICES.map(
    (service, index) => `
      <article class="service reveal reveal--delay-${(index % 3) + 1}">
        <p class="service__index">${String(index + 1).padStart(2, '0')}</p>
        <h2 class="service__title">${escapeHtml(service.title)}</h2>
        <p>${escapeHtml(service.detail)}</p>
        ${
          service.image
            ? `<div class="service__media"><img src="${service.image}" alt="" loading="lazy" decoding="async" width="1000" height="720"></div>`
            : ''
        }
      </article>`
  ).join('');
  initReveal();
}
