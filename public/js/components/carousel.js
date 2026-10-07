/**
 * Horizontal card carousel.
 *
 * Built on native scroll + CSS scroll-snap rather than a transform library, so
 * touch swiping, momentum and accessibility come from the browser. Adds pointer
 * dragging for desktop, prev/next buttons, dots and arrow-key support.
 */
import { qs, qsa, debounce } from '../lib/utils.js';

const arrow = (dir) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="${
    dir === 'prev' ? 'm15 18-6-6 6-6' : 'm9 6 6 6-6 6'
  }"/></svg>`;

export function initCarousel(root, { label = 'Properties', loop = false } = {}) {
  if (!root) return null;

  const viewport = qs('[data-carousel-viewport]', root);
  const items = qsa('[data-carousel-item]', root);
  if (!viewport || items.length === 0) return null;

  const prev = qs('[data-carousel-prev]', root);
  const next = qs('[data-carousel-next]', root);
  const dotsHost = qs('[data-carousel-dots]', root);

  viewport.setAttribute('tabindex', '0');
  viewport.setAttribute('role', 'region');
  viewport.setAttribute('aria-label', `${label} carousel`);

  /* Dots — one per card. */
  const dots = items.map((_, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'carousel__dot';
    dot.setAttribute('aria-label', `Go to property ${index + 1}`);
    dot.addEventListener('click', () => scrollToIndex(index));
    if (dotsHost) dotsHost.appendChild(dot);
    return dot;
  });

  const step = () => {
    const first = items[0];
    const styles = window.getComputedStyle(items[0].parentElement);
    const gap = parseFloat(styles.columnGap || styles.gap || '0') || 0;
    return first.getBoundingClientRect().width + gap;
  };

  const scrollToIndex = (index) => {
    viewport.scrollTo({ left: index * step(), behavior: 'smooth' });
  };

  const activeIndex = () => Math.round(viewport.scrollLeft / step());

  const sync = () => {
    const max = viewport.scrollWidth - viewport.clientWidth - 2;
    if (prev) prev.disabled = !loop && viewport.scrollLeft <= 2;
    if (next) next.disabled = !loop && viewport.scrollLeft >= max;
    const index = Math.max(0, Math.min(items.length - 1, activeIndex()));
    dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === index)));
  };

  /* Move one card, wrapping at the ends when the carousel loops. */
  const stepBy = (delta) => {
    const next = activeIndex() + delta;
    if (loop) return scrollToIndex((next + items.length) % items.length);
    scrollToIndex(Math.min(items.length - 1, Math.max(0, next)));
  };

  prev?.addEventListener('click', () => stepBy(-1));
  next?.addEventListener('click', () => stepBy(1));

  viewport.addEventListener('scroll', debounce(sync, 90), { passive: true });
  window.addEventListener('resize', debounce(sync, 150));

  /* Keyboard support on the focused region. */
  viewport.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      stepBy(1);
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      stepBy(-1);
    }
  });

  /* Pointer dragging for mouse users (touch is handled natively). */
  let dragging = false;
  let startX = 0;
  let startLeft = 0;
  let moved = false;

  viewport.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'touch') return;
    dragging = true;
    moved = false;
    startX = event.clientX;
    startLeft = viewport.scrollLeft;
    viewport.setPointerCapture(event.pointerId);
  });

  viewport.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const delta = event.clientX - startX;
    if (Math.abs(delta) > 4 && !moved) {
      moved = true;
      viewport.classList.add('is-dragging');
    }
    if (moved) viewport.scrollLeft = startLeft - delta;
  });

  const endDrag = (event) => {
    if (!dragging) return;
    dragging = false;
    viewport.classList.remove('is-dragging');
    if (viewport.hasPointerCapture?.(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }
    if (moved) scrollToIndex(activeIndex());
  };

  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);

  /* Suppress the click that ends a drag, so dragging never opens a property. */
  viewport.addEventListener(
    'click',
    (event) => {
      if (moved) {
        event.preventDefault();
        event.stopPropagation();
        moved = false;
      }
    },
    true
  );

  sync();

  return { sync, scrollToIndex };
}
