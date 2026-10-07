/**
 * Shared bootstrap for every page: header, footer, reveal animations and the
 * favourites wiring. Loaded before the page-specific module.
 */
import { renderHeader } from './components/header.js';
import { renderFooter } from './components/footer.js';
import { initReveal } from './components/reveal.js';
import { initSaveButtons, syncSaveButtons } from './components/property-card.js';
import { icons } from './lib/icons.js';
import { qs } from './lib/utils.js';

renderHeader();
renderFooter();
initSaveButtons(document);
initReveal();

/* Keep every card's saved state in step, wherever the change came from. */
window.addEventListener('favorites:change', () => syncSaveButtons(document));

/* Back-to-top control. */
const toTop = document.createElement('button');
toTop.type = 'button';
toTop.className = 'to-top';
toTop.setAttribute('aria-label', 'Back to top');
toTop.innerHTML = icons.arrowUp;
toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
document.body.appendChild(toTop);

const toggleToTop = () => toTop.classList.toggle('is-visible', window.scrollY > 700);
toggleToTop();
window.addEventListener('scroll', toggleToTop, { passive: true });

/* Smooth in-page anchors that respect the fixed header. */
document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href^="#"]');
  if (!link) return;
  const id = link.getAttribute('href');
  if (!id || id === '#') return;
  const target = qs(id);
  if (!target) return;
  event.preventDefault();
  const top = target.getBoundingClientRect().top + window.scrollY - 90;
  window.scrollTo({ top, behavior: 'smooth' });
  target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
});
