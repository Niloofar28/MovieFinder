/**
 * Form validation driven by markup.
 *
 * A field opts in with `data-validate="required|email|phone|min:3"` and gets its
 * message from `data-error`. Keeps the contact page and the modal enquiry forms
 * on exactly the same rules.
 */
import { isEmail, qsa } from './utils.js';

export function fieldRules(field) {
  return String(field.dataset.validate || '')
    .split('|')
    .map((rule) => rule.trim())
    .filter(Boolean);
}

function messageFor(field, rule) {
  const custom = field.dataset.error;
  if (custom) return custom;
  switch (rule.split(':')[0]) {
    case 'required':
      return 'This field is required.';
    case 'email':
      return 'Enter a valid email address.';
    case 'phone':
      return 'Enter a valid phone number.';
    case 'min':
      return `Please enter at least ${rule.split(':')[1]} characters.`;
    default:
      return 'Please check this field.';
  }
}

function fails(field, rule) {
  const value = String(field.value || '').trim();
  const [name, arg] = rule.split(':');
  switch (name) {
    case 'required':
      return value.length === 0;
    case 'email':
      return value.length > 0 && !isEmail(value);
    case 'phone':
      return value.length > 0 && !/^[+()\d][\d\s()+-]{6,}$/.test(value);
    case 'min':
      return value.length > 0 && value.length < Number(arg);
    default:
      return false;
  }
}

function setFieldError(field, message) {
  const holder = field.closest('.field') || field.parentElement;
  if (!holder) return;
  let note = holder.querySelector('.field-error');
  if (message) {
    if (!note) {
      note = document.createElement('p');
      note.className = 'field-error';
      note.id = `${field.id || field.name}-error`;
      holder.appendChild(note);
    }
    note.textContent = message;
    field.setAttribute('aria-invalid', 'true');
    field.setAttribute('aria-describedby', note.id);
    holder.classList.add('has-error');
  } else {
    if (note) note.remove();
    field.removeAttribute('aria-invalid');
    field.removeAttribute('aria-describedby');
    holder.classList.remove('has-error');
  }
}

/** Validate every opted-in field; returns { valid, values }. Errors are rendered inline. */
export function validateForm(form) {
  const fields = qsa('[data-validate]', form);
  const values = {};
  let valid = true;
  let firstInvalid = null;

  fields.forEach((field) => {
    const failing = fieldRules(field).find((rule) => fails(field, rule));
    setFieldError(field, failing ? messageFor(field, failing) : '');
    if (failing) {
      valid = false;
      firstInvalid = firstInvalid || field;
    }
    values[field.name || field.id] = String(field.value || '').trim();
  });

  if (firstInvalid) firstInvalid.focus();

  return { valid, values };
}

/** Clear all inline errors (used when a form is reset or a modal closes). */
export function resetForm(form) {
  qsa('[data-validate]', form).forEach((field) => setFieldError(field, ''));
  form.reset();
}
