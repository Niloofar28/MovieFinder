/** Team page — advisors with their biographies. */
import { AGENTS } from '../data/properties.js';
import { initReveal } from '../components/reveal.js';
import { icons } from '../lib/icons.js';
import { escapeHtml, qs } from '../lib/utils.js';

const host = qs('[data-team-list]');

if (host) {
  host.innerHTML = AGENTS.map(
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
          <p class="member__bio">${escapeHtml(agent.bio)}</p>
        </div>
      </article>`
  ).join('');
  initReveal();
}
