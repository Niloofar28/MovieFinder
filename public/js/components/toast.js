/** Lightweight toast used for form and favorites confirmations. */
import { icons } from '../lib/icons.js';

let node = null;
let timer = null;

function ensure() {
  if (node) return node;
  node = document.createElement('div');
  node.className = 'toast';
  node.setAttribute('role', 'status');
  node.setAttribute('aria-live', 'polite');
  document.body.appendChild(node);
  return node;
}

/**
 * @param {string} message
 * @param {'success'|'error'} tone
 */
export function toast(message, tone = 'success') {
  const el = ensure();
  el.innerHTML = `${tone === 'error' ? icons.close : icons.check}<span></span>`;
  el.querySelector('span').textContent = message;
  el.classList.add('is-visible');

  clearTimeout(timer);
  timer = setTimeout(() => el.classList.remove('is-visible'), 3200);
}
