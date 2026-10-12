/**
 * Contact page — validated enquiry form and clearly-labelled sample contact
 * details. Submissions are stored in the store database for the admin team.
 */

import { api, escapeHtml } from '../api.js';
import { breadcrumbs, icons, mountShell, setPageMeta, toast } from '../ui.js';

const { content } = await mountShell('/contact');
const root = document.getElementById('contact-root');
document.getElementById('contact-breadcrumbs').innerHTML = breadcrumbs([{ label: 'Contact' }]);

setPageMeta({
  title: 'Contact Aurora Skincare',
  description:
    'Get in touch with the Aurora Skincare customer care team about orders, products or returns.',
  path: '/contact',
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Contact Aurora Skincare',
    url: `${location.origin}/contact`,
  },
});

const contact = content.contact || {};

root.innerHTML = `
<div class="container section" style="padding-top:1rem">
  <div class="split-layout">
    <div class="stack">
      <section class="card">
        <h2 style="font-size:var(--step-2)">Customer care</h2>
        <p class="muted" style="margin-top:0">${escapeHtml(contact.note || '')}</p>
        <ul class="stack" style="list-style:none;gap:.75rem;margin-top:.5rem">
          <li>${icons.mail} <a href="mailto:${escapeHtml(contact.email || '')}">${escapeHtml(contact.email || '')}</a></li>
          <li>${icons.info} ${escapeHtml(contact.phone || '')}</li>
          <li>${icons.truck} ${escapeHtml(contact.address || '')}</li>
          <li>${icons.play} ${escapeHtml(contact.hours || '')}</li>
        </ul>
      </section>
      <section class="card">
        <h2 style="font-size:var(--step-2)">Follow along</h2>
        <div class="social-row">
          ${(content.social?.links || [])
            .map(
              (link) => `<a href="${link.href || '#'}" ${link.href ? 'target="_blank" rel="noopener"' : 'aria-disabled="true"'}
                aria-label="${escapeHtml(link.label)}${link.href ? '' : ' (placeholder destination)'}"
                title="${escapeHtml(link.label)}${link.href ? '' : ' — placeholder destination'}">${icons[link.icon] || icons.info}</a>`
            )
            .join('')}
        </div>
        ${content.social?.configured === false ? `<p class="form-note">${escapeHtml(content.social.note || '')}</p>` : ''}
      </section>
    </div>

    <section class="card">
      <h2 style="font-size:var(--step-2)">Send us a message</h2>
      <form id="contact-form" novalidate>
        <div class="form-row">
          <div class="field">
            <label for="name">Full name <span class="req">*</span></label>
            <input class="input" id="name" name="name" autocomplete="name" required>
            <p class="field-error" data-error-for="name" hidden></p>
          </div>
          <div class="field">
            <label for="email">Email <span class="req">*</span></label>
            <input class="input" id="email" name="email" type="email" autocomplete="email" required>
            <p class="field-error" data-error-for="email" hidden></p>
          </div>
        </div>
        <div class="field">
          <label for="subject">Subject</label>
          <select class="select" id="subject" name="subject">
            <option>Order enquiry</option>
            <option>Product question</option>
            <option>Returns and refunds</option>
            <option>Wholesale or press</option>
            <option>Something else</option>
          </select>
        </div>
        <div class="field">
          <label for="message">Message <span class="req">*</span></label>
          <textarea class="textarea" id="message" name="message" required placeholder="How can we help?"></textarea>
          <p class="field-error" data-error-for="message" hidden></p>
        </div>
        <div id="contact-alert" hidden></div>
        <button class="btn" type="submit">Send message</button>
        <p class="form-note" style="margin-top:.6rem">
          We reply within one working day. Messages are stored in the store database and can be reviewed in the admin dashboard.
        </p>
      </form>
    </section>
  </div>
</div>`;

const form = document.getElementById('contact-form');
const alertBox = document.getElementById('contact-alert');

function setError(name, message) {
  const field = form.querySelector(`[name="${name}"]`);
  const error = form.querySelector(`[data-error-for="${name}"]`);
  if (field) field.setAttribute('aria-invalid', message ? 'true' : 'false');
  if (error) {
    error.textContent = message || '';
    error.hidden = !message;
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const message = form.message.value.trim();

  let firstInvalid = null;
  const checks = [
    ['name', !name ? 'Please tell us your name.' : ''],
    ['email', !email ? 'Please enter your email address.' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'Please enter a valid email address.' : ''],
    ['message', message.length < 10 ? 'Please write a slightly longer message.' : ''],
  ];
  checks.forEach(([field, error]) => {
    setError(field, error);
    if (error && !firstInvalid) firstInvalid = form[field];
  });
  if (firstInvalid) {
    firstInvalid.focus();
    return;
  }

  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  try {
    const result = await api.post('/api/contact', { name, email, subject: form.subject.value, message });
    alertBox.hidden = false;
    alertBox.innerHTML = `<div class="alert alert--success" role="status">${escapeHtml(result.message)}</div>`;
    form.reset();
    toast('Message sent.');
  } catch (err) {
    alertBox.hidden = false;
    alertBox.innerHTML = `<div class="alert alert--error" role="alert">${escapeHtml(err.message)}</div>`;
  } finally {
    button.disabled = false;
  }
});
