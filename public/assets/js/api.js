/**
 * AURORA SKINCARE — thin API client.
 * All store data lives in the backend (SQLite); the browser only ever holds
 * the bag, wishlist and recently-viewed list locally.
 */

async function request(path, { method = 'GET', body, headers = {}, raw } = {}) {
  const options = {
    method,
    headers: { Accept: 'application/json', ...headers },
    credentials: 'same-origin',
  };
  if (body instanceof FormData) {
    options.body = body;
  } else if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(path, options);
  } catch (err) {
    throw new Error('We could not reach the store. Please check your connection and try again.');
  }

  if (response.status === 204) return null;

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const error = new Error((payload && payload.error) || 'Something went wrong. Please try again.');
    error.status = response.status;
    error.details = (payload && payload.details) || null;
    throw error;
  }
  return raw ? response : payload;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  del: (path) => request(path, { method: 'DELETE' }),
  upload: (path, file) => {
    const form = new FormData();
    form.append('file', file);
    return request(path, { method: 'POST', body: form });
  },
};

/** Builds a query string, dropping empty values and arrays → CSV. */
export function query(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      if (value.length) search.set(key, value.join(','));
      return;
    }
    search.set(key, String(value));
  });
  const str = search.toString();
  return str ? `?${str}` : '';
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
