/**
 * Site header: brand, primary navigation, contact CTA and the mobile drawer.
 *
 * The markup is rendered from here so every page shares one navigation source.
 */
import { COMPANY } from '../data/properties.js';
import { brand, icons } from '../lib/icons.js';
import { qs, qsa } from '../lib/utils.js';
import { countFavorites } from '../lib/favorites.js';

const LINKS = [
  { href: 'index.html', label: 'Home' },
  { href: 'properties.html', label: 'Properties' },
  { href: 'about.html', label: 'About Us' },
  { href: 'services.html', label: 'Services' },
  { href: 'team.html', label: 'Team' },
  { href: 'contact.html', label: 'Contact' }
];

const currentFile = () => {
  const file = window.location.pathname.split('/').pop();
  return file === '' ? 'index.html' : file;
};

const linkMarkup = (active) =>
  LINKS.map(
    ({ href, label }) =>
      `<li><a class="nav__link" href="${href}"${
        href === active ? ' aria-current="page"' : ''
      }>${label}</a></li>`
  ).join('');

const drawerMarkup = (active) =>
  LINKS.map(
    ({ href, label }) =>
      `<a class="drawer__link" href="${href}"${
        href === active ? ' aria-current="page"' : ''
      }>${label}</a>`
  ).join('');

export function renderHeader() {
  const header = qs('[data-header]');
  if (!header) return;

  const active = currentFile();
  const saved = countFavorites();

  header.innerHTML = `
    <div class="site-header__inner">
      ${brand()}
      <nav class="nav" aria-label="Primary">
        <ul class="nav__list">${linkMarkup(active)}</ul>
      </nav>
      <div class="header__actions">
        <a class="header__saved" href="properties.html?saved=1" aria-label="Saved properties">
          ${icons.heart}
          <span class="header__saved-count"${saved ? '' : ' hidden'} data-saved-count>${saved}</span>
        </a>
        <a class="header__phone" href="${COMPANY.phoneHref}">
          ${icons.phone}<span>${COMPANY.phone}</span>
        </a>
        <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="mobile-drawer" aria-label="Open menu">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
    <div class="drawer" id="mobile-drawer" inert>
      <nav aria-label="Mobile">
        ${drawerMarkup(active)}
      </nav>
      <div class="drawer__footer">
        <a class="drawer__phone" href="${COMPANY.phoneHref}">${icons.phone} ${COMPANY.phone}</a>
        <p class="drawer__meta">${COMPANY.address}<br>${COMPANY.hours}</p>
      </div>
    </div>`;

  initHeader(header);
}

function initHeader(header) {
  const isStatic = header.classList.contains('site-header--static');
  const drawer = qs('.drawer', header);
  const toggle = qs('.nav-toggle', header);

  /* Transparent over the hero, solid once scrolled past it. */
  if (!isStatic) {
    const onScroll = () => header.classList.toggle('is-solid', window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  const setDrawer = (open) => {
    drawer.classList.toggle('is-open', open);
    drawer.toggleAttribute('inert', !open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('is-locked', open);
    if (open) {
      const first = qs('.drawer__link', drawer);
      if (first) first.focus({ preventScroll: true });
    }
  };

  toggle.addEventListener('click', () => setDrawer(!drawer.classList.contains('is-open')));

  drawer.addEventListener('click', (event) => {
    if (event.target.closest('a')) setDrawer(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && drawer.classList.contains('is-open')) {
      setDrawer(false);
      toggle.focus();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 900 && drawer.classList.contains('is-open')) setDrawer(false);
  });

  /* Keep the saved counter in step with the favorites store. */
  const badge = qs('[data-saved-count]', header);
  window.addEventListener('favorites:change', (event) => {
    const count = event.detail.ids.length;
    if (!badge) return;
    badge.textContent = String(count);
    badge.toggleAttribute('hidden', count === 0);
  });
}

/** Small helper used by page scripts that need the drawer closed after routing. */
export const closeDrawer = () => {
  const drawer = qs('.drawer');
  if (drawer && drawer.classList.contains('is-open')) {
    drawer.classList.remove('is-open');
    drawer.setAttribute('inert', '');
    document.body.classList.remove('is-locked');
    const toggle = qs('.nav-toggle');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  }
};

export const navLinkCount = () => qsa('.nav__link').length;
