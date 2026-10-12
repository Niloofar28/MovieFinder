/**
 * Admin dashboard — products, categories, orders, customers, journal,
 * subscribers, messages and editable site content.
 *
 * Access is enforced by the API (role check on every /api/admin/* route); this
 * page only decides what to render. No customer data is exposed to customers.
 */

import { api, escapeHtml, query } from '../api.js';
import { money, session } from '../store.js';
import { emptyState, icons, mountShell, setPageMeta, toast } from '../ui.js';

await mountShell('/admin');
setPageMeta({
  title: 'Store Admin — Aurora Skincare',
  description: 'Internal store administration.',
  path: '/admin',
});

const root = document.getElementById('admin-root');

const TABS = [
  ['overview', 'Overview'],
  ['products', 'Products'],
  ['categories', 'Categories'],
  ['orders', 'Orders'],
  ['customers', 'Customers'],
  ['journal', 'Journal'],
  ['subscribers', 'Subscribers'],
  ['messages', 'Messages'],
  ['content', 'Site content'],
];

let tab = new URLSearchParams(location.search).get('tab') || 'overview';
let editingProduct = null;
let editingPost = null;
let editingCategory = null;
const cache = { products: [], categories: [], brands: [], orders: [], customers: [], posts: [], subscribers: [], messages: [], content: null };

const lines = (value) =>
  String(value || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

const variantsFromText = (value) =>
  lines(value)
    .map((line) => {
      const [label, price, stock] = line.split('|').map((part) => (part || '').trim());
      return label ? { label, price: Number(price) || 0, stock: Number(stock) || 0 } : null;
    })
    .filter(Boolean);

const variantsToText = (variants) =>
  (variants || []).map((v) => `${v.label} | ${v.price} | ${v.stock}`).join('\n');

/* --------------------------------------------------------------- rendering */

function loginHtml() {
  return `
  <div class="container section" style="max-width:520px">
    <div class="card">
      <h1 style="font-size:var(--step-3)">Store admin</h1>
      <p class="muted">Sign in with an administrator account to manage the store.</p>
      <form id="admin-login">
        <div class="field"><label for="a-email">Email</label>
          <input class="input" id="a-email" name="email" type="email" autocomplete="email" required></div>
        <div class="field"><label for="a-password">Password</label>
          <input class="input" id="a-password" name="password" type="password" autocomplete="current-password" required></div>
        <div id="admin-login-alert" hidden></div>
        <button class="btn btn--block" type="submit">Sign in</button>
      </form>
      <p class="form-note" style="margin-top:.75rem">
        The first administrator account is created from the ADMIN_EMAIL / ADMIN_PASSWORD environment values when the
        store starts — see the setup notes in the repository README.
      </p>
    </div>
  </div>`;
}

function dashboardHtml() {
  return `
  <div class="container section" style="padding-top:1rem">
    <div class="toolbar">
      <div>
        <h1 style="font-size:var(--step-3);margin:0">Store admin</h1>
        <p class="muted" style="margin:.2rem 0 0">Signed in as ${escapeHtml(session.user.email)} (${escapeHtml(session.user.role)})</p>
      </div>
      <div class="toolbar__controls">
        <a class="btn btn--ghost btn--sm" href="/">View storefront</a>
        <button class="btn btn--ghost btn--sm" type="button" data-admin-signout>Sign out</button>
      </div>
    </div>
    <div class="split-layout">
      <nav class="account-nav" aria-label="Admin sections">
        ${TABS.map(
          ([id, label]) => `<button type="button" data-admin-tab="${id}" aria-current="${tab === id}">${label}</button>`
        ).join('')}
      </nav>
      <div id="admin-panel" class="stack"></div>
    </div>
  </div>`;
}

async function renderPanel() {
  const panel = document.getElementById('admin-panel');
  panel.innerHTML = '<div class="skeleton" style="height:180px"></div>';
  document.querySelectorAll('[data-admin-tab]').forEach((button) =>
    button.setAttribute('aria-current', String(button.dataset.adminTab === tab))
  );
  history.replaceState({}, '', `/admin?tab=${tab}`);

  try {
    if (tab === 'overview') return renderOverview(panel);
    if (tab === 'products') return renderProducts(panel);
    if (tab === 'categories') return renderCategories(panel);
    if (tab === 'orders') return renderOrders(panel);
    if (tab === 'customers') return renderCustomers(panel);
    if (tab === 'journal') return renderPosts(panel);
    if (tab === 'subscribers') return renderSubscribers(panel);
    if (tab === 'messages') return renderMessages(panel);
    if (tab === 'content') return renderContent(panel);
  } catch (err) {
    panel.innerHTML = `<div class="alert alert--error" role="alert">${escapeHtml(err.message)}</div>`;
  }
}

/* ---------------------------------------------------------------- overview */

async function renderOverview(panel) {
  const data = await api.get('/api/admin/summary');
  const flags = (cache.content && cache.content.flags) || {};
  panel.innerHTML = `
  <div class="stat-grid">
    <div class="stat"><span>Products</span><strong>${data.products}</strong></div>
    <div class="stat"><span>Orders</span><strong>${data.orders}</strong></div>
    <div class="stat"><span>Revenue (demo)</span><strong>${money(data.revenue)}</strong></div>
    <div class="stat"><span>Customers</span><strong>${data.customers}</strong></div>
    <div class="stat"><span>Subscribers</span><strong>${data.subscribers}</strong></div>
    <div class="stat"><span>New messages</span><strong>${data.messages}</strong></div>
  </div>

  <section class="card">
    <h2 style="font-size:var(--step-2)">Integrations status</h2>
    <p class="muted" style="margin:0">
      Payment provider connected: <strong>${flags.paymentsConfigured ? 'yes' : 'no — checkout runs in demo mode'}</strong><br>
      Social destinations configured: <strong>${flags.socialConfigured ? 'yes' : 'no — profile links are placeholders'}</strong><br>
      Verified customer reviews: <strong>${flags.reviewsVerified ? 'yes' : 'no — ratings are sample catalog data'}</strong>
    </p>
  </section>

  <section class="card">
    <h2 style="font-size:var(--step-2)">Low stock</h2>
    ${
      data.lowStock.length
        ? `<div class="table-wrap"><table><thead><tr><th>Product</th><th>Stock</th><th></th></tr></thead><tbody>
            ${data.lowStock
              .map(
                (item) => `<tr><td>${escapeHtml(item.name)}</td><td>${item.stock}</td>
                  <td><button class="btn btn--ghost btn--sm" type="button" data-edit-product="${escapeHtml(item.slug)}">Edit</button></td></tr>`
              )
              .join('')}
          </tbody></table></div>`
        : '<p class="muted">Nothing is running low.</p>'
    }
  </section>

  <section class="card">
    <h2 style="font-size:var(--step-2)">Recent orders</h2>
    ${
      data.recentOrders.length
        ? `<div class="table-wrap"><table><thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead><tbody>
            ${data.recentOrders
              .map(
                (order) => `<tr><td>${escapeHtml(order.number)}</td><td>${escapeHtml(order.name)}</td>
                  <td>${money(order.total)}</td><td><span class="status status--${escapeHtml(order.status)}">${escapeHtml(order.status)}</span></td></tr>`
              )
              .join('')}
          </tbody></table></div>`
        : '<p class="muted">No orders yet.</p>'
    }
  </section>`;

  panel.querySelectorAll('[data-edit-product]').forEach((button) =>
    button.addEventListener('click', () => {
      tab = 'products';
      editingProduct = button.dataset.editProduct;
      renderPanel();
    })
  );
}

/* ---------------------------------------------------------------- products */

async function loadCatalog() {
  const [products, categories, brands] = await Promise.all([
    api.get(`/api/admin/products${query({ q: '' })}`),
    api.get('/api/admin/categories'),
    api.get('/api/brands'),
  ]);
  cache.products = products;
  cache.categories = categories;
  cache.brands = brands;
}

function productFormHtml(product) {
  const p = product || {};
  return `
  <section class="card" id="product-editor">
    <h2 style="font-size:var(--step-2)">${product ? `Edit “${escapeHtml(product.name)}”` : 'New product'}</h2>
    <form id="product-form" data-slug="${escapeHtml(product ? product.slug : '')}">
      <div class="form-row">
        <div class="field"><label for="f-name">Name <span class="req">*</span></label>
          <input class="input" id="f-name" name="name" required value="${escapeHtml(p.name || '')}"></div>
        <div class="field"><label for="f-slug">Slug</label>
          <input class="input" id="f-slug" name="slug" value="${escapeHtml(p.slug || '')}" placeholder="auto from name"></div>
        <div class="field"><label for="f-sku">SKU</label>
          <input class="input" id="f-sku" name="sku" value="${escapeHtml(p.sku || '')}"></div>
      </div>
      <div class="form-row">
        <div class="field"><label for="f-category">Category <span class="req">*</span></label>
          <select class="select" id="f-category" name="category">
            ${cache.categories
              .map(
                (c) => `<option value="${escapeHtml(c.slug)}" ${p.category === c.slug ? 'selected' : ''}>${escapeHtml(c.name)}</option>`
              )
              .join('')}
          </select></div>
        <div class="field"><label for="f-brand">Brand <span class="req">*</span></label>
          <select class="select" id="f-brand" name="brand">
            ${cache.brands
              .map(
                (b) => `<option value="${escapeHtml(b.slug)}" ${p.brand === b.slug ? 'selected' : ''}>${escapeHtml(b.name)}</option>`
              )
              .join('')}
          </select></div>
        <div class="field"><label for="f-badge">Badge</label>
          <input class="input" id="f-badge" name="badge" value="${escapeHtml(p.badge || '')}" placeholder="Bestseller, New…"></div>
      </div>
      <div class="form-row">
        <div class="field"><label for="f-price">Price (USD) <span class="req">*</span></label>
          <input class="input" id="f-price" name="price" type="number" step="0.01" min="0" required value="${p.basePrice ?? ''}"></div>
        <div class="field"><label for="f-sale">Sale price (optional)</label>
          <input class="input" id="f-sale" name="salePrice" type="number" step="0.01" min="0" value="${p.salePrice ?? ''}"></div>
        <div class="field"><label for="f-stock">Stock</label>
          <input class="input" id="f-stock" name="stock" type="number" min="0" value="${p.stock ?? 0}"></div>
      </div>
      <div class="form-row">
        <div class="field"><label for="f-rating">Sample rating</label>
          <input class="input" id="f-rating" name="rating" type="number" step="0.1" min="0" max="5" value="${p.rating ?? 0}"></div>
        <div class="field"><label for="f-reviews">Sample rating count</label>
          <input class="input" id="f-reviews" name="reviewCount" type="number" min="0" value="${p.reviewCount ?? 0}"></div>
      </div>
      <div class="field"><label for="f-short">Short description</label>
        <input class="input" id="f-short" name="shortDescription" value="${escapeHtml(p.shortDescription || '')}"></div>
      <div class="field"><label for="f-desc">Full description</label>
        <textarea class="textarea" id="f-desc" name="description">${escapeHtml(p.description || '')}</textarea></div>
      <div class="field"><label for="f-ingredients">Key ingredients</label>
        <textarea class="textarea" id="f-ingredients" name="ingredients">${escapeHtml(p.ingredients || '')}</textarea></div>
      <div class="field"><label for="f-how">How to use</label>
        <textarea class="textarea" id="f-how" name="howToUse">${escapeHtml(p.howToUse || '')}</textarea></div>
      <div class="form-row">
        <div class="field"><label for="f-benefits">Benefits (one per line)</label>
          <textarea class="textarea" id="f-benefits" name="benefits">${(p.benefits || []).join('\n')}</textarea></div>
        <div class="field"><label for="f-details">Product details (one per line)</label>
          <textarea class="textarea" id="f-details" name="details">${(p.details || []).join('\n')}</textarea></div>
      </div>
      <div class="field">
        <label for="f-variants">Variants — one per line as <code>Label | price | stock</code></label>
        <textarea class="textarea" id="f-variants" name="variants">${escapeHtml(variantsToText(p.variants))}</textarea>
      </div>
      <div class="field">
        <label for="f-images">Image paths or URLs (one per line)</label>
        <textarea class="textarea" id="f-images" name="images">${(p.images || []).join('\n')}</textarea>
        <div class="range-row" style="margin-top:.4rem">
          <input type="file" accept="image/*" data-upload-target="f-images">
          <span class="form-note">Uploads are stored publicly under /uploads and referenced by path.</span>
        </div>
      </div>
      <div class="range-row" style="gap:1rem;flex-wrap:wrap;margin-bottom:1rem">
        <label class="checkbox"><input type="checkbox" name="featured" ${p.featured ? 'checked' : ''}><span>Featured</span></label>
        <label class="checkbox"><input type="checkbox" name="bestseller" ${p.bestseller ? 'checked' : ''}><span>Best seller</span></label>
        <label class="checkbox"><input type="checkbox" name="isNew" ${p.isNew ? 'checked' : ''}><span>New arrival</span></label>
      </div>
      <div class="range-row" style="flex-wrap:wrap">
        <button class="btn" type="submit">${product ? 'Save product' : 'Create product'}</button>
        <button class="btn btn--ghost" type="button" data-cancel-edit>Cancel</button>
        ${
          product
            ? `<button class="btn btn--ghost" type="button" data-delete-product="${product.id}">Delete product</button>`
            : ''
        }
      </div>
    </form>
  </section>`;
}

async function renderProducts(panel) {
  await loadCatalog();
  const editing = editingProduct ? cache.products.find((p) => String(p.id) === String(editingProduct)) : null;

  panel.innerHTML = `
  <div class="toolbar">
    <form id="product-filter" style="display:flex;gap:.5rem;flex:1;max-width:360px">
      <input class="input" name="q" placeholder="Search products, SKU, slug">
      <button class="btn btn--sm" type="submit">Search</button>
    </form>
    <button class="btn btn--sm" type="button" data-new-product>New product</button>
  </div>
  ${editing || editingProduct === 'new' ? productFormHtml(editing) : ''}
  <div class="table-wrap">
    <table>
      <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Flags</th><th></th></tr></thead>
      <tbody>
        ${cache.products
          .map(
            (product) => `<tr>
              <td><strong>${escapeHtml(product.name)}</strong><br><span class="muted">${escapeHtml(product.sku)}</span></td>
              <td>${escapeHtml(product.category)}</td>
              <td>${money(product.price)}${product.salePrice ? ` <del>${money(product.basePrice)}</del>` : ''}</td>
              <td>${product.stock}</td>
              <td>${[product.featured && 'Featured', product.bestseller && 'Best seller', product.isNew && 'New']
                .filter(Boolean)
                .join(', ') || '—'}</td>
              <td style="white-space:nowrap">
                <button class="btn btn--ghost btn--sm" type="button" data-edit-product="${product.id}">Edit</button>
              </td>
            </tr>`
          )
          .join('')}
      </tbody>
    </table>
  </div>
  <p class="form-note">Ratings and rating counts are sample catalog data — they are labelled as demonstration values in the storefront.</p>`;

  panel.querySelector('[data-new-product]').addEventListener('click', () => {
    editingProduct = 'new';
    renderPanel();
  });
  panel.querySelectorAll('[data-edit-product]').forEach((button) =>
    button.addEventListener('click', () => {
      editingProduct = button.dataset.editProduct;
      renderPanel();
    })
  );
  panel.querySelector('[data-cancel-edit]')?.addEventListener('click', () => {
    editingProduct = null;
    renderPanel();
  });
  panel.querySelector('[data-delete-product]')?.addEventListener('click', async (event) => {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    await api.del(`/api/admin/products/${event.currentTarget.dataset.deleteProduct}`);
    toast('Product deleted.');
    editingProduct = null;
    renderPanel();
  });

  const form = panel.querySelector('#product-form');
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = {
      name: form.name.value.trim(),
      slug: form.slug.value.trim() || form.name.value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      sku: form.sku.value.trim() || `AS-${Date.now().toString().slice(-6)}`,
      category: form.category.value,
      brand: form.brand.value,
      badge: form.badge.value.trim(),
      price: Number(form.price.value),
      salePrice: form.salePrice.value === '' ? null : Number(form.salePrice.value),
      stock: Number(form.stock.value),
      rating: Number(form.rating.value),
      reviewCount: Number(form.reviewCount.value),
      shortDescription: form.shortDescription.value.trim(),
      description: form.description.value.trim(),
      ingredients: form.ingredients.value.trim(),
      howToUse: form.howToUse.value.trim(),
      benefits: lines(form.benefits.value),
      details: lines(form.details.value),
      variants: variantsFromText(form.variants.value),
      images: lines(form.images.value),
      featured: form.featured.checked,
      bestseller: form.bestseller.checked,
      isNew: form.isNew.checked,
    };
    const slug = form.dataset.slug;
    try {
      if (slug) {
        const existing = cache.products.find((p) => p.slug === slug);
        await api.patch(`/api/admin/products/${existing.id}`, payload);
        toast('Product updated.');
      } else {
        await api.post('/api/admin/products', payload);
        toast('Product created.');
      }
      editingProduct = null;
      renderPanel();
    } catch (err) {
      toast(err.message, 'error');
    }
  });

  panel.querySelector('#product-filter').addEventListener('submit', async (event) => {
    event.preventDefault();
    cache.products = await api.get(`/api/admin/products${query({ q: event.target.q.value.trim() })}`);
    editingProduct = null;
    renderPanel();
  });

  wireUploads(panel);
}

/* -------------------------------------------------------------- categories */

async function renderCategories(panel) {
  cache.categories = await api.get('/api/admin/categories');
  const editing = editingCategory ? cache.categories.find((c) => String(c.id) === String(editingCategory)) : null;

  panel.innerHTML = `
  <div class="toolbar">
    <h2 style="font-size:var(--step-2);margin:0">Categories</h2>
    <button class="btn btn--sm" type="button" data-new-category>New category</button>
  </div>
  ${
    editingCategory
      ? `<section class="card">
          <h3 style="font-size:var(--step-1)">${editing ? `Edit ${escapeHtml(editing.name)}` : 'New category'}</h3>
          <form id="category-form" data-id="${editing ? editing.id : ''}">
            <div class="form-row">
              <div class="field"><label for="c-name">Name <span class="req">*</span></label>
                <input class="input" id="c-name" name="name" required value="${escapeHtml(editing?.name || '')}"></div>
              <div class="field"><label for="c-slug">Slug</label>
                <input class="input" id="c-slug" name="slug" value="${escapeHtml(editing?.slug || '')}"></div>
              <div class="field"><label for="c-order">Order</label>
                <input class="input" id="c-order" name="order" type="number" value="${editing?.sort_order ?? 99}"></div>
            </div>
            <div class="field"><label for="c-tagline">Tagline</label>
              <input class="input" id="c-tagline" name="tagline" value="${escapeHtml(editing?.tagline || '')}"></div>
            <div class="field"><label for="c-description">Description</label>
              <textarea class="textarea" id="c-description" name="description">${escapeHtml(editing?.description || '')}</textarea></div>
            <div class="field"><label for="c-image">Image path or URL</label>
              <input class="input" id="c-image" name="image" value="${escapeHtml(editing?.image || '')}">
              <input type="file" accept="image/*" data-upload-target="c-image" style="margin-top:.4rem">
            </div>
            <div class="range-row">
              <button class="btn" type="submit">${editing ? 'Save category' : 'Create category'}</button>
              <button class="btn btn--ghost" type="button" data-cancel-category>Cancel</button>
            </div>
          </form>
        </section>`
      : ''
  }
  <div class="table-wrap">
    <table>
      <thead><tr><th>Order</th><th>Category</th><th>Products</th><th>Image</th><th></th></tr></thead>
      <tbody>
        ${cache.categories
          .map(
            (category) => `<tr>
              <td>${category.sort_order}</td>
              <td><strong>${escapeHtml(category.name)}</strong><br><span class="muted">${escapeHtml(category.slug)}</span></td>
              <td>${cache.products.filter((p) => p.category === category.slug).length}</td>
              <td><img src="${escapeHtml(category.image || '')}" alt="" width="48" height="48" style="width:48px;height:48px;object-fit:cover;border-radius:50%"></td>
              <td style="white-space:nowrap">
                <button class="btn btn--ghost btn--sm" type="button" data-edit-category="${category.id}">Edit</button>
                <button class="btn btn--ghost btn--sm" type="button" data-delete-category="${category.id}">Delete</button>
              </td>
            </tr>`
          )
          .join('')}
      </tbody>
    </table>
  </div>`;

  panel.querySelector('[data-new-category]').addEventListener('click', () => {
    editingCategory = 'new';
    renderPanel();
  });
  panel.querySelectorAll('[data-edit-category]').forEach((button) =>
    button.addEventListener('click', () => {
      editingCategory = button.dataset.editCategory;
      renderPanel();
    })
  );
  panel.querySelector('[data-cancel-category]')?.addEventListener('click', () => {
    editingCategory = null;
    renderPanel();
  });
  panel.querySelectorAll('[data-delete-category]').forEach((button) =>
    button.addEventListener('click', async () => {
      if (!confirm('Delete this category?')) return;
      try {
        await api.del(`/api/admin/categories/${button.dataset.deleteCategory}`);
        toast('Category deleted.');
        renderPanel();
      } catch (err) {
        toast(err.message, 'error');
      }
    })
  );

  panel.querySelector('#category-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.target;
    const payload = {
      name: form.name.value.trim(),
      slug: form.slug.value.trim(),
      order: Number(form.order.value),
      tagline: form.tagline.value.trim(),
      description: form.description.value.trim(),
      image: form.image.value.trim(),
    };
    try {
      if (form.dataset.id) await api.patch(`/api/admin/categories/${form.dataset.id}`, payload);
      else await api.post('/api/admin/categories', payload);
      editingCategory = null;
      toast('Category saved.');
      renderPanel();
    } catch (err) {
      toast(err.message, 'error');
    }
  });

  wireUploads(panel);
}

/* ------------------------------------------------------------------ orders */

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

async function renderOrders(panel) {
  cache.orders = await api.get(`/api/admin/orders${query({ q: '', status: '' })}`);
  panel.innerHTML = `
  <div class="toolbar">
    <form id="order-filter" style="display:flex;gap:.5rem;flex:1;max-width:520px">
      <input class="input" name="q" placeholder="Search order number, email, name">
      <select class="select" name="status">
        <option value="">All statuses</option>
        ${ORDER_STATUSES.map((status) => `<option value="${status}">${status}</option>`).join('')}
      </select>
      <button class="btn btn--sm" type="submit">Filter</button>
    </form>
    <p class="toolbar__count">${cache.orders.length} orders</p>
  </div>

  ${
    cache.orders.length
      ? cache.orders
          .map(
            (order) => `
      <section class="card">
        <div class="range-row" style="justify-content:space-between;flex-wrap:wrap">
          <div>
            <strong>${escapeHtml(order.number)}</strong>
            <span class="status status--${escapeHtml(order.status)}">${escapeHtml(order.status)}</span>
            <p class="muted" style="margin:.25rem 0 0">
              ${escapeHtml(order.fullName)} &middot; ${escapeHtml(order.email)} &middot; ${escapeHtml(order.createdAt)}<br>
              ${escapeHtml(order.address.line1)}, ${escapeHtml(order.address.city)} ${escapeHtml(order.address.postalCode)} ${escapeHtml(order.address.country)}
            </p>
          </div>
          <div style="text-align:right">
            <strong>${money(order.total)}</strong>
            <p class="muted" style="margin:0;font-size:var(--step--1)">${escapeHtml(order.deliveryLabel)} &middot; ${escapeHtml(order.paymentMethod)}</p>
          </div>
        </div>
        <details style="margin-top:.75rem">
          <summary style="cursor:pointer">Items (${order.items.length})</summary>
          <ul style="margin:.5rem 0 0;padding-left:1.1rem">
            ${order.items
              .map(
                (item) =>
                  `<li>${escapeHtml(item.name)}${item.variant ? ` (${escapeHtml(item.variant)})` : ''} × ${item.quantity} — ${money(
                    item.lineTotal
                  )}</li>`
              )
              .join('')}
          </ul>
          <p class="muted" style="margin:.5rem 0 0">
            Subtotal ${money(order.subtotal)} · discount ${money(order.discount)} · shipping ${money(order.shipping)}${
              order.couponCode ? ` · code ${escapeHtml(order.couponCode)}` : ''
            }
          </p>
          ${order.notes ? `<p class="muted">Note: ${escapeHtml(order.notes)}</p>` : ''}
        </details>
        <div class="range-row" style="margin-top:.75rem">
          <label class="sr-only" for="status-${order.id}">Order status</label>
          <select class="select" id="status-${order.id}" data-order-status="${order.id}" style="max-width:200px">
            ${ORDER_STATUSES.map(
              (status) => `<option value="${status}" ${order.status === status ? 'selected' : ''}>${status}</option>`
            ).join('')}
          </select>
          <button class="btn btn--sm" type="button" data-save-order="${order.id}">Update status</button>
          <a class="btn btn--ghost btn--sm" href="/order?number=${encodeURIComponent(order.number)}&email=${encodeURIComponent(
            order.email
          )}">View as customer</a>
        </div>
      </section>`
          )
          .join('')
      : emptyState({ title: 'No orders yet', text: 'Orders placed in the store will appear here.' })
  }`;

  panel.querySelector('#order-filter').addEventListener('submit', async (event) => {
    event.preventDefault();
    cache.orders = await api.get(
      `/api/admin/orders${query({ q: event.target.q.value.trim(), status: event.target.status.value })}`
    );
    renderPanel();
  });

  panel.querySelectorAll('[data-save-order]').forEach((button) =>
    button.addEventListener('click', async () => {
      const id = button.dataset.saveOrder;
      const status = panel.querySelector(`[data-order-status="${id}"]`).value;
      try {
        await api.patch(`/api/admin/orders/${id}`, { status });
        toast('Order status updated.');
        renderPanel();
      } catch (err) {
        toast(err.message, 'error');
      }
    })
  );
}

/* --------------------------------------------------------------- customers */

async function renderCustomers(panel) {
  cache.customers = await api.get('/api/admin/customers');
  panel.innerHTML = `
  <section class="card">
    <h2 style="font-size:var(--step-2)">Customers</h2>
    <p class="muted">Customer records are only visible to administrators. No payment data is stored.</p>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Orders</th><th>Spend</th><th>Joined</th></tr></thead>
        <tbody>
          ${cache.customers
            .map(
              (customer) => `<tr>
                <td>${escapeHtml(customer.name)}</td>
                <td>${escapeHtml(customer.email)}</td>
                <td>${escapeHtml(customer.phone || '—')}</td>
                <td>${escapeHtml(customer.role)}</td>
                <td>${customer.orderCount}</td>
                <td>${money(customer.spend)}</td>
                <td>${escapeHtml(customer.createdAt)}</td>
              </tr>`
            )
            .join('')}
        </tbody>
      </table>
    </div>
  </section>`;
}

/* ----------------------------------------------------------------- journal */

async function renderPosts(panel) {
  cache.posts = await api.get('/api/admin/posts');
  const editing = editingPost ? cache.posts.find((p) => String(p.id) === String(editingPost)) : null;

  panel.innerHTML = `
  <div class="toolbar">
    <h2 style="font-size:var(--step-2);margin:0">Journal articles</h2>
    <button class="btn btn--sm" type="button" data-new-post>New article</button>
  </div>
  ${
    editingPost
      ? `<section class="card">
          <h3 style="font-size:var(--step-1)">${editing ? `Edit “${escapeHtml(editing.title)}”` : 'New article'}</h3>
          <form id="post-form" data-id="${editing ? editing.id : ''}">
            <div class="form-row">
              <div class="field"><label for="p-title">Title <span class="req">*</span></label>
                <input class="input" id="p-title" name="title" required value="${escapeHtml(editing?.title || '')}"></div>
              <div class="field"><label for="p-slug">Slug</label>
                <input class="input" id="p-slug" name="slug" value="${escapeHtml(editing?.slug || '')}"></div>
            </div>
            <div class="form-row">
              <div class="field"><label for="p-category">Category</label>
                <input class="input" id="p-category" name="category" value="${escapeHtml(editing?.category || 'Guides')}"></div>
              <div class="field"><label for="p-author">Author</label>
                <input class="input" id="p-author" name="author" value="${escapeHtml(editing?.author || 'Aurora Editorial')}"></div>
              <div class="field"><label for="p-reading">Reading time (minutes)</label>
                <input class="input" id="p-reading" name="readingTime" type="number" min="1" value="${editing?.reading_time ?? 5}"></div>
              <div class="field"><label for="p-date">Published</label>
                <input class="input" id="p-date" name="publishedAt" type="date" value="${escapeHtml(
                  editing?.published_at || new Date().toISOString().slice(0, 10)
                )}"></div>
            </div>
            <div class="field"><label for="p-image">Featured image path or URL</label>
              <input class="input" id="p-image" name="image" value="${escapeHtml(editing?.image || '')}">
              <input type="file" accept="image/*" data-upload-target="p-image" style="margin-top:.4rem"></div>
            <div class="field"><label for="p-excerpt">Excerpt</label>
              <textarea class="textarea" id="p-excerpt" name="excerpt">${escapeHtml(editing?.excerpt || '')}</textarea></div>
            <div class="field"><label for="p-body">Article body (HTML allowed)</label>
              <textarea class="textarea" id="p-body" name="body" style="min-height:260px">${escapeHtml(editing?.body || '')}</textarea></div>
            <label class="checkbox" style="margin-bottom:1rem"><input type="checkbox" name="featured" ${
              editing?.featured ? 'checked' : ''
            }><span>Feature on the journal page</span></label>
            <div class="range-row">
              <button class="btn" type="submit">${editing ? 'Save article' : 'Create article'}</button>
              <button class="btn btn--ghost" type="button" data-cancel-post>Cancel</button>
            </div>
          </form>
        </section>`
      : ''
  }
  <div class="table-wrap">
    <table>
      <thead><tr><th>Title</th><th>Category</th><th>Published</th><th>Featured</th><th></th></tr></thead>
      <tbody>
        ${cache.posts
          .map(
            (post) => `<tr>
              <td><strong>${escapeHtml(post.title)}</strong><br><span class="muted">${escapeHtml(post.slug)}</span></td>
              <td>${escapeHtml(post.category || '')}</td>
              <td>${escapeHtml(post.published_at)}</td>
              <td>${post.featured ? 'Yes' : '—'}</td>
              <td style="white-space:nowrap">
                <button class="btn btn--ghost btn--sm" type="button" data-edit-post="${post.id}">Edit</button>
                <button class="btn btn--ghost btn--sm" type="button" data-delete-post="${post.id}">Delete</button>
              </td>
            </tr>`
          )
          .join('')}
      </tbody>
    </table>
  </div>`;

  panel.querySelector('[data-new-post]').addEventListener('click', () => {
    editingPost = 'new';
    renderPanel();
  });
  panel.querySelectorAll('[data-edit-post]').forEach((button) =>
    button.addEventListener('click', () => {
      editingPost = button.dataset.editPost;
      renderPanel();
    })
  );
  panel.querySelector('[data-cancel-post]')?.addEventListener('click', () => {
    editingPost = null;
    renderPanel();
  });
  panel.querySelectorAll('[data-delete-post]').forEach((button) =>
    button.addEventListener('click', async () => {
      if (!confirm('Delete this article?')) return;
      await api.del(`/api/admin/posts/${button.dataset.deletePost}`);
      toast('Article deleted.');
      renderPanel();
    })
  );

  panel.querySelector('#post-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.target;
    const payload = {
      title: form.title.value.trim(),
      slug: form.slug.value.trim(),
      category: form.category.value.trim(),
      author: form.author.value.trim(),
      readingTime: Number(form.readingTime.value),
      publishedAt: form.publishedAt.value,
      image: form.image.value.trim(),
      excerpt: form.excerpt.value.trim(),
      body: form.body.value,
      featured: form.featured.checked,
    };
    try {
      if (form.dataset.id) await api.patch(`/api/admin/posts/${form.dataset.id}`, payload);
      else await api.post('/api/admin/posts', payload);
      editingPost = null;
      toast('Article saved.');
      renderPanel();
    } catch (err) {
      toast(err.message, 'error');
    }
  });

  wireUploads(panel);
}

/* ------------------------------------------------------- subscribers/mail */

async function renderSubscribers(panel) {
  cache.subscribers = await api.get('/api/admin/subscribers');
  panel.innerHTML = `
  <section class="card">
    <h2 style="font-size:var(--step-2)">Newsletter subscribers</h2>
    ${
      cache.subscribers.length
        ? `<div class="table-wrap"><table>
            <thead><tr><th>Email</th><th>Consent</th><th>Source</th><th>Joined</th><th></th></tr></thead>
            <tbody>
              ${cache.subscribers
                .map(
                  (row) => `<tr>
                    <td>${escapeHtml(row.email)}</td>
                    <td>${row.consent ? 'Yes' : 'No'}</td>
                    <td>${escapeHtml(row.source || 'website')}</td>
                    <td>${escapeHtml(row.created_at)}</td>
                    <td><button class="btn btn--ghost btn--sm" type="button" data-delete-subscriber="${row.id}">Delete</button></td>
                  </tr>`
                )
                .join('')}
            </tbody></table></div>`
        : '<p class="muted">No subscribers yet.</p>'
    }
    <p class="form-note">Subscribers who tick the consent box agreed to receive marketing email. No emails are sent from this demo build.</p>
  </section>`;

  panel.querySelectorAll('[data-delete-subscriber]').forEach((button) =>
    button.addEventListener('click', async () => {
      await api.del(`/api/admin/subscribers/${button.dataset.deleteSubscriber}`);
      toast('Subscriber removed.');
      renderPanel();
    })
  );
}

async function renderMessages(panel) {
  cache.messages = await api.get('/api/admin/messages');
  panel.innerHTML = `
  <section class="card">
    <h2 style="font-size:var(--step-2)">Customer messages</h2>
    ${
      cache.messages.length
        ? cache.messages
            .map(
              (message) => `
        <article class="card card--soft" style="margin-bottom:.75rem">
          <div class="range-row" style="justify-content:space-between;flex-wrap:wrap">
            <div>
              <strong>${escapeHtml(message.subject || 'Enquiry')}</strong>
              <p class="muted" style="margin:.2rem 0 0">${escapeHtml(message.name)} &middot; ${escapeHtml(message.email)} &middot; ${escapeHtml(
                message.created_at
              )}</p>
            </div>
            <span class="status status--${message.status === 'new' ? 'pending' : 'delivered'}">${escapeHtml(message.status)}</span>
          </div>
          <p style="margin:.6rem 0 0">${escapeHtml(message.message)}</p>
          <div class="range-row" style="margin-top:.6rem">
            <button class="btn btn--ghost btn--sm" type="button" data-message-status="${message.id}" data-status="${
              message.status === 'new' ? 'handled' : 'new'
            }">Mark as ${message.status === 'new' ? 'handled' : 'new'}</button>
            <a class="btn btn--ghost btn--sm" href="mailto:${escapeHtml(message.email)}">Reply by email</a>
          </div>
        </article>`
            )
            .join('')
        : '<p class="muted">No messages yet.</p>'
    }
  </section>`;

  panel.querySelectorAll('[data-message-status]').forEach((button) =>
    button.addEventListener('click', async () => {
      await api.patch(`/api/admin/messages/${button.dataset.messageStatus}`, { status: button.dataset.status });
      toast('Message updated.');
      renderPanel();
    })
  );
}

/* ------------------------------------------------------------ site content */

const CONTENT_SECTIONS = [
  ['brand', 'Brand'],
  ['hero', 'Homepage hero'],
  ['trust', 'Trust indicators'],
  ['banner', 'Promotional banner'],
  ['gallery', 'Social gallery'],
  ['newsletter', 'Newsletter'],
  ['footer', 'Footer'],
  ['contact', 'Contact details'],
  ['social', 'Social links'],
  ['flags', 'Feature flags'],
  ['docs', 'Information & policy pages'],
];

async function renderContent(panel) {
  cache.content = await api.get('/api/admin/content');
  panel.innerHTML = `
  <section class="card">
    <h2 style="font-size:var(--step-2)">Site content</h2>
    <p class="muted">
      Edit the copy that appears across the storefront. Each block is stored as JSON in the store database and is
      served to every page. Keep the shape of each block (same keys) so the templates keep working.
    </p>
  </section>
  ${CONTENT_SECTIONS.map(
    ([key, label]) => `
    <section class="card">
      <h3 style="font-size:var(--step-1)">${escapeHtml(label)}</h3>
      <div class="field">
        <label class="sr-only" for="content-${key}">${escapeHtml(label)} JSON</label>
        <textarea class="textarea" id="content-${key}" style="min-height:180px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.82rem">${escapeHtml(
          JSON.stringify(cache.content[key] ?? {}, null, 2)
        )}</textarea>
      </div>
      <button class="btn btn--sm" type="button" data-save-content="${key}">Save ${escapeHtml(label)}</button>
    </section>`
  ).join('')}`;

  panel.querySelectorAll('[data-save-content]').forEach((button) =>
    button.addEventListener('click', async () => {
      const key = button.dataset.saveContent;
      const textarea = document.getElementById(`content-${key}`);
      let value;
      try {
        value = JSON.parse(textarea.value);
      } catch {
        toast('That block is not valid JSON — check for missing commas or quotes.', 'error');
        return;
      }
      try {
        await api.put('/api/admin/content', { [key]: value });
        cache.content[key] = value;
        toast(`${key} content saved.`);
      } catch (err) {
        toast(err.message, 'error');
      }
    })
  );
}

/* ---------------------------------------------------------------- uploads */

function wireUploads(scope) {
  scope.querySelectorAll('[data-upload-target]').forEach((input) => {
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) return;
      const target = document.getElementById(input.dataset.uploadTarget);
      try {
        const result = await api.upload('/api/admin/uploads', file);
        if (target.tagName === 'TEXTAREA') target.value = `${target.value.trim()}\n${result.url}`.trim();
        else target.value = result.url;
        toast('Image uploaded.');
      } catch (err) {
        toast(err.message, 'error');
      } finally {
        input.value = '';
      }
    });
  });
}

/* ------------------------------------------------------------------- boot */

async function boot() {
  await session.load(true);
  if (!session.user) {
    root.innerHTML = loginHtml();
    document.getElementById('admin-login').addEventListener('submit', async (event) => {
      event.preventDefault();
      const alertBox = document.getElementById('admin-login-alert');
      try {
        await session.login(event.target.email.value.trim(), event.target.password.value);
        await boot();
      } catch (err) {
        alertBox.hidden = false;
        alertBox.innerHTML = `<div class="alert alert--error" role="alert">${escapeHtml(err.message)}</div>`;
      }
    });
    return;
  }
  if (!session.isAdmin()) {
    root.innerHTML = `
    <div class="container section" style="max-width:640px">
      ${emptyState({
        icon: 'lock',
        title: 'Administrator access required',
        text: 'This dashboard is available to store administrators only. Your account does not have admin rights.',
        actionHtml: '<a class="btn" href="/account">Back to your account</a>',
      })}
    </div>`;
    return;
  }

  cache.content = await api.get('/api/admin/content').catch(() => ({}));
  root.innerHTML = dashboardHtml();
  document.querySelectorAll('[data-admin-tab]').forEach((button) =>
    button.addEventListener('click', () => {
      tab = button.dataset.adminTab;
      renderPanel();
    })
  );
  document.querySelector('[data-admin-signout]')?.addEventListener('click', async () => {
    await session.logout();
    toast('Signed out.');
    boot();
  });
  await renderPanel();
}

await boot();
