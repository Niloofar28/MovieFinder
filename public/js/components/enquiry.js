/**
 * Enquiry forms — "Contact agent" and "Schedule a viewing".
 *
 * There is no server in this project, so submissions are validated, saved to
 * localStorage and confirmed. Swapping `saveEnquiry` for a POST to a real
 * endpoint is the only change needed to make these live.
 */
import { icons } from '../lib/icons.js';
import { escapeHtml, storage } from '../lib/utils.js';
import { validateForm } from '../lib/validate.js';
import { openModal, closeModal } from './modal.js';

const KEY = 'horizon:enquiries';

function saveEnquiry(entry) {
  const all = storage.get(KEY, []);
  const list = Array.isArray(all) ? all : [];
  list.push({ ...entry, submittedAt: new Date().toISOString() });
  storage.set(KEY, list);
}

export const getEnquiries = () => {
  const all = storage.get(KEY, []);
  return Array.isArray(all) ? all : [];
};

function successPanel({ title, message }) {
  return `
    <div class="success-panel">
      <span class="success-panel__icon">${icons.check}</span>
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(message)}</p>
      <button class="btn btn--primary btn--block" type="button" data-modal-close>Close</button>
    </div>`;
}

/**
 * @param {{ mode: 'contact'|'viewing', property: object, agent: object }} options
 */
export function openEnquiry({ mode, property, agent }) {
  const isViewing = mode === 'viewing';
  const title = isViewing ? 'Schedule a viewing' : 'Contact the advisor';
  const subtitle = `${property.title} — ${property.location}`;

  const body = `
    <form class="form-grid" data-enquiry novalidate>
      <div class="field">
        <label for="enq-name">Full name</label>
        <input id="enq-name" name="name" type="text" autocomplete="name"
               data-validate="required|min:2" data-error="Please enter your name.">
      </div>
      <div class="field">
        <label for="enq-email">Email</label>
        <input id="enq-email" name="email" type="email" autocomplete="email"
               data-validate="required|email" data-error="Enter a valid email address.">
      </div>
      <div class="field">
        <label for="enq-phone">Phone</label>
        <input id="enq-phone" name="phone" type="tel" autocomplete="tel"
               data-validate="phone" data-error="Enter a valid phone number.">
      </div>
      ${
        isViewing
          ? `<div class="field">
              <label for="enq-date">Preferred date</label>
              <input id="enq-date" name="date" type="date" data-validate="required" data-error="Choose a date.">
            </div>`
          : `<div class="field">
              <label for="enq-interest">I am interested in</label>
              <select id="enq-interest" name="interest">
                <option>Buying this property</option>
                <option>Selling a similar property</option>
                <option>Investment advice</option>
                <option>Something else</option>
              </select>
            </div>`
      }
      <div class="field field--full">
        <label for="enq-message">Message</label>
        <textarea id="enq-message" name="message"
                  placeholder="${isViewing ? 'Anything we should know before the visit?' : 'Tell us what you are looking for.'}"></textarea>
      </div>
      <div class="field field--full">
        <button class="btn btn--primary btn--block" type="submit">
          ${isViewing ? 'Request this viewing' : 'Send enquiry'} ${icons.arrowRight}
        </button>
      </div>
      <div class="field field--full">
        <p class="result-count">Prefer to talk? Call ${escapeHtml(agent.phone)} or email
          <a href="mailto:${agent.email}">${escapeHtml(agent.email)}</a>.</p>
      </div>
    </form>`;

  const modal = openModal({ title, subtitle, body });

  const form = modal.querySelector('[data-enquiry]');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const { valid, values } = validateForm(form);
    if (!valid) return;

    saveEnquiry({
      mode,
      propertyId: property.id,
      propertyTitle: property.title,
      agentId: agent.id,
      ...values
    });

    modal.querySelector('.modal__body').innerHTML = successPanel({
      title: isViewing ? 'Viewing requested' : 'Enquiry sent',
      message: isViewing
        ? `${agent.name} will confirm your visit to ${property.title} shortly.`
        : `${agent.name} has received your enquiry about ${property.title} and will reply within one business day.`
    });

    modal
      .querySelectorAll('[data-modal-close]')
      .forEach((button) => button.addEventListener('click', closeModal));
  });
}
