/**
 * Accessible modal dialog: focus trap, Escape to close, backdrop click, and the
 * caller's element focused again on close.
 */
import { icons } from '../lib/icons.js';
import { qs, qsa } from '../lib/utils.js';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

let lastFocused = null;

function shell() {
  let modal = qs('[data-modal]');
  if (modal) return modal;

  modal = document.createElement('div');
  modal.className = 'modal';
  modal.setAttribute('data-modal', '');
  modal.innerHTML = `
    <div class="modal__panel" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="modal__head">
        <div>
          <h2 id="modal-title"></h2>
          <p data-modal-subtitle hidden></p>
        </div>
        <button class="modal__close" type="button" data-modal-close aria-label="Close dialog">${icons.close}</button>
      </div>
      <div class="modal__body"></div>
    </div>`;
  document.body.appendChild(modal);

  modal.addEventListener('mousedown', (event) => {
    if (event.target === modal) closeModal();
  });
  qs('[data-modal-close]', modal).addEventListener('click', closeModal);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });

  return modal;
}

function trapFocus(event) {
  const modal = qs('[data-modal]');
  if (!modal || event.key !== 'Tab') return;
  const focusable = qsa(FOCUSABLE, modal).filter((el) => el.offsetParent !== null);
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

/**
 * @param {{ title: string, subtitle?: string, body: string }} options
 */
export function openModal({ title, subtitle = '', body }) {
  const modal = shell();
  lastFocused = document.activeElement;

  qs('#modal-title', modal).textContent = title;
  const subtitleEl = qs('[data-modal-subtitle]', modal);
  subtitleEl.textContent = subtitle;
  subtitleEl.toggleAttribute('hidden', !subtitle);
  qs('.modal__body', modal).innerHTML = body;

  modal.classList.add('is-open');
  document.body.classList.add('is-locked');
  document.addEventListener('keydown', trapFocus);

  const firstField = qs('input, select, textarea, button:not([data-modal-close])', modal);
  if (firstField) firstField.focus({ preventScroll: true });

  return modal;
}

export function closeModal() {
  const modal = qs('[data-modal]');
  if (!modal) return;
  modal.classList.remove('is-open');
  document.body.classList.remove('is-locked');
  document.removeEventListener('keydown', trapFocus);
  if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus({ preventScroll: true });
  lastFocused = null;
}

export const isModalOpen = () => !!qs('[data-modal].is-open');
