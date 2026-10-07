/** Small shared helpers — no dependencies. */

export const qs = (selector, scope = document) => scope.querySelector(selector);
export const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];

/** Escape user/data-supplied strings before they go into innerHTML. */
export function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** 2350000 -> "$2,350,000" (full value, used on detail pages). */
export function formatPriceFull(value) {
  return `$${Number(value).toLocaleString('en-US')}`;
}

export function debounce(fn, delay = 250) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/** localStorage that degrades quietly when storage is unavailable. */
export const storage = {
  get(key, fallback = null) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage blocked — the site still works, just without persistence */
    }
  }
};

/** Read a query-string parameter from the current URL. */
export function param(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/** Human-readable label for a beds/baths count. */
export const plural = (count, singular) => `${count} ${singular}${count === 1 ? '' : 's'}`;

/** Simple email shape check used by the form validation layer. */
export const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value).trim());

