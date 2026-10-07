/**
 * Property image gallery: large main image, thumbnail strip and a full-screen
 * viewer with keyboard support.
 */
import { icons } from '../lib/icons.js';
import { escapeHtml, qs, qsa } from '../lib/utils.js';

export function initGallery(root, images) {
  if (!root || !images || images.length === 0) return;

  root.innerHTML = `
    <div class="gallery">
      <div class="gallery__main" data-gallery-main>
        <img src="${images[0].src}" alt="${escapeHtml(images[0].alt)}" width="1400" height="900" decoding="async">
        <button class="gallery__expand" type="button" data-gallery-open>
          ${icons.expand}<span>View all photos</span>
        </button>
      </div>
      <div class="gallery__thumbs" role="group" aria-label="Property photos">
        ${images
          .map(
            (image, index) => `
          <button class="gallery__thumb" type="button" data-gallery-thumb="${index}"
                  aria-current="${index === 0}"
                  aria-label="Show photo ${index + 1} of ${images.length}">
            <img src="${image.src}" alt="" loading="lazy" decoding="async" width="400" height="300">
          </button>`
          )
          .join('')}
      </div>
    </div>`;

  const main = qs('[data-gallery-main]', root);
  const mainImage = qs('img', main);
  let index = 0;

  const show = (next, { swap = true } = {}) => {
    index = (next + images.length) % images.length;
    const apply = () => {
      mainImage.src = images[index].src;
      mainImage.alt = images[index].alt;
      main.classList.remove('is-swapping');
    };
    if (!swap) {
      apply();
    } else {
      main.classList.add('is-swapping');
      window.setTimeout(apply, 180);
    }
    qsa('[data-gallery-thumb]', root).forEach((thumb, i) =>
      thumb.setAttribute('aria-current', String(i === index))
    );
    if (lightboxImage) renderLightbox();
  };

  qsa('[data-gallery-thumb]', root).forEach((thumb) =>
    thumb.addEventListener('click', () => show(Number(thumb.dataset.galleryThumb)))
  );

  /* --- Full-screen viewer ------------------------------------------------ */
  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.setAttribute('role', 'dialog');
  lightbox.setAttribute('aria-modal', 'true');
  lightbox.setAttribute('aria-label', 'Property photo viewer');
  lightbox.innerHTML = `
    <button class="lightbox__btn lightbox__btn--close" type="button" data-lb-close aria-label="Close photo viewer">${icons.close}</button>
    <button class="lightbox__btn lightbox__btn--prev" type="button" data-lb-prev aria-label="Previous photo">${icons.chevronLeft}</button>
    <figure class="lightbox__figure">
      <img alt="" data-lb-image>
      <figcaption class="lightbox__caption" data-lb-caption></figcaption>
    </figure>
    <button class="lightbox__btn lightbox__btn--next" type="button" data-lb-next aria-label="Next photo">${icons.chevronRight}</button>
    <p class="lightbox__count" data-lb-count></p>`;
  document.body.appendChild(lightbox);

  const lightboxImage = qs('[data-lb-image]', lightbox);

  function renderLightbox() {
    lightboxImage.src = images[index].src;
    lightboxImage.alt = images[index].alt;
    qs('[data-lb-caption]', lightbox).textContent = images[index].alt;
    qs('[data-lb-count]', lightbox).textContent = `${index + 1} / ${images.length}`;
  }

  let opener = null;

  const openLightbox = () => {
    opener = document.activeElement;
    renderLightbox();
    lightbox.classList.add('is-open');
    document.body.classList.add('is-locked');
    qs('[data-lb-close]', lightbox).focus();
  };

  const closeLightbox = () => {
    lightbox.classList.remove('is-open');
    document.body.classList.remove('is-locked');
    if (opener && opener.focus) opener.focus({ preventScroll: true });
  };

  qs('[data-gallery-open]', main).addEventListener('click', openLightbox);
  qs('[data-lb-close]', lightbox).addEventListener('click', closeLightbox);
  qs('[data-lb-prev]', lightbox).addEventListener('click', () => show(index - 1, { swap: false }));
  qs('[data-lb-next]', lightbox).addEventListener('click', () => show(index + 1, { swap: false }));
  lightbox.addEventListener('mousedown', (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (event) => {
    if (!lightbox.classList.contains('is-open')) return;
    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowRight') show(index + 1, { swap: false });
    if (event.key === 'ArrowLeft') show(index - 1, { swap: false });
  });
}
