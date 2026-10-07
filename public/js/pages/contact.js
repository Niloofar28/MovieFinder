/**
 * Contact page form.
 *
 * Validates, stores the message alongside the property enquiries and shows a
 * confirmation. Replace `storage.set` with a POST to go live.
 */
import { icons } from '../lib/icons.js';
import { escapeHtml, storage } from '../lib/utils.js';
import { validateForm } from '../lib/validate.js';
import { qs } from '../lib/utils.js';

const form = qs('[data-contact-form]');

if (form) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const { valid, values } = validateForm(form);
    if (!valid) return;

    const all = storage.get('horizon:enquiries', []);
    const list = Array.isArray(all) ? all : [];
    list.push({ mode: 'general', ...values, submittedAt: new Date().toISOString() });
    storage.set('horizon:enquiries', list);

    const host = qs('[data-contact-form-wrap]');
    if (host) {
      host.innerHTML = `
        <div class="success-panel">
          <span class="success-panel__icon">${icons.check}</span>
          <h2>Message received</h2>
          <p>Thank you, ${escapeHtml(values.name || 'there')}. An advisor will reply within one business day.</p>
          <a class="btn btn--primary" href="properties.html">Browse properties</a>
        </div>`;
    }
  });
}
