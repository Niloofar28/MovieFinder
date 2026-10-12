/**
 * Customer account — sign in / register, profile, saved addresses, order
 * history, wishlist summary and recently viewed products.
 */

import { api, escapeHtml } from '../api.js';
import { cart, formatDate, money, recentlyViewed, session, wishlist } from '../store.js';
import { breadcrumbs, emptyState, icons, mountShell, setPageMeta, toast } from '../ui.js';

await mountShell('/account');
const root = document.getElementById('account-root');
document.getElementById('account-breadcrumbs').innerHTML = breadcrumbs([{ label: 'Account' }]);
setPageMeta({
  title: 'Your Account — Aurora Skincare',
  description: 'Sign in to see your Aurora Skincare order history, saved addresses and profile.',
  path: '/account',
});

const params = new URLSearchParams(location.search);
let mode = params.get('mode') === 'register' ? 'register' : 'login';
let tab = params.get('tab') || 'profile';

await session.load();

const TABS = [
  ['profile', 'Profile'],
  ['orders', 'Order history'],
  ['addresses', 'Saved addresses'],
  ['activity', 'Wishlist & recently viewed'],
];

function authHtml() {
  return `
  <div class="container section" style="max-width:560px">
    <div class="card">
      <div class="section-head" style="margin-bottom:1rem">
        <h1 style="font-size:var(--step-3)">${mode === 'register' ? 'Create your account' : 'Welcome back'}</h1>
      </div>
      <div class="tabs__list" style="margin-bottom:1rem">
        <button type="button" data-mode="login" aria-selected="${mode === 'login'}">Sign in</button>
        <button type="button" data-mode="register" aria-selected="${mode === 'register'}">Create account</button>
      </div>
      <form id="auth-form" novalidate>
        ${
          mode === 'register'
            ? `<div class="field">
                <label for="name">Full name <span class="req">*</span></label>
                <input class="input" id="name" name="name" autocomplete="name" required>
              </div>`
            : ''
        }
        <div class="field">
          <label for="email">Email <span class="req">*</span></label>
          <input class="input" id="email" name="email" type="email" autocomplete="email" required>
        </div>
        <div class="field">
          <label for="password">Password <span class="req">*</span></label>
          <input class="input" id="password" name="password" type="password"
            autocomplete="${mode === 'register' ? 'new-password' : 'current-password'}" required
            ${mode === 'register' ? 'minlength="8"' : ''}>
          ${mode === 'register' ? '<p class="form-note">At least 8 characters.</p>' : ''}
        </div>
        <div id="auth-alert" hidden></div>
        <button class="btn btn--block" type="submit">${mode === 'register' ? 'Create account' : 'Sign in'}</button>
      </form>
      <p class="form-note" style="margin-top:.75rem">
        You can browse and check out as a guest at any time — an account simply keeps your order history and addresses together.
      </p>
    </div>
  </div>`;
}

function accountShell(orders, addresses, recent) {
  return `
  <div class="container section" style="padding-top:1rem">
    <div class="split-layout">
      <nav class="account-nav" aria-label="Account sections">
        ${TABS.map(
          ([id, label]) =>
            `<button type="button" data-tab="${id}" aria-current="${tab === id}">${label}</button>`
        ).join('')}
        <button type="button" data-signout>Sign out</button>
      </nav>
      <div id="account-panel"></div>
    </div>
  </div>`.replace(
    '<div id="account-panel"></div>',
    `<div id="account-panel">${panelHtml(orders, addresses, recent)}</div>`
  );
}

function panelHtml(orders, addresses, recent) {
  const user = session.user;
  if (tab === 'profile') {
    return `
    <div class="stack">
      <section class="card">
        <h2 style="font-size:var(--step-2)">Your profile</h2>
        <form id="profile-form">
          <div class="field">
            <label for="p-name">Full name</label>
            <input class="input" id="p-name" name="name" value="${escapeHtml(user.name)}">
          </div>
          <div class="field">
            <label for="p-phone">Phone</label>
            <input class="input" id="p-phone" name="phone" value="${escapeHtml(user.phone || '')}">
          </div>
          <div class="field">
            <label for="p-email">Email</label>
            <input class="input" id="p-email" value="${escapeHtml(user.email)}" disabled>
            <p class="form-note">Email addresses are fixed in this demo so orders stay linked to your history.</p>
          </div>
          <button class="btn" type="submit">Save changes</button>
        </form>
      </section>
      <section class="card">
        <h2 style="font-size:var(--step-2)">Change password</h2>
        <form id="password-form">
          <div class="field">
            <label for="current">Current password</label>
            <input class="input" id="current" name="currentPassword" type="password" autocomplete="current-password" required>
          </div>
          <div class="field">
            <label for="next">New password</label>
            <input class="input" id="next" name="newPassword" type="password" autocomplete="new-password" required minlength="8">
          </div>
          <button class="btn btn--ghost" type="submit">Update password</button>
        </form>
      </section>
      ${
        session.isAdmin()
          ? `<section class="card"><h2 style="font-size:var(--step-2)">Administrator</h2>
              <p class="muted">You have administrator access to the store dashboard.</p>
              <a class="btn" href="/admin">Open admin dashboard</a></section>`
          : ''
      }
    </div>`;
  }

  if (tab === 'orders') {
    return orders.length
      ? `<div class="stack">
          <div class="stat-grid">
            <div class="stat"><span>Orders</span><strong>${orders.length}</strong></div>
            <div class="stat"><span>Total spent</span><strong>${money(
              orders.reduce((sum, o) => sum + o.total, 0)
            )}</strong></div>
          </div>
          ${orders
            .map(
              (order) => `
            <section class="card">
              <div style="display:flex;flex-wrap:wrap;gap:.75rem;justify-content:space-between;align-items:center">
                <div>
                  <h3 style="margin:0;font-size:var(--step-1)">${escapeHtml(order.number)}</h3>
                  <p class="muted" style="margin:.15rem 0 0">${formatDate(order.createdAt)} &middot; ${order.items.length} item${
                    order.items.length === 1 ? '' : 's'
                  } &middot; ${money(order.total)}</p>
                </div>
                <span class="status status--${escapeHtml(order.status)}">${escapeHtml(order.status)}</span>
              </div>
              <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.75rem">
                <a class="btn btn--sm" href="/order?number=${encodeURIComponent(order.number)}&email=${encodeURIComponent(
                  order.email
                )}">View details</a>
                <button class="btn btn--ghost btn--sm" type="button" data-reorder="${
                  encodeURIComponent(JSON.stringify(order.items.map((i) => ({ slug: i.slug, variant: i.variant, quantity: i.quantity }))))
                }">Add items to bag</button>
              </div>
            </section>`
            )
            .join('')}
        </div>`
      : emptyState({
          icon: 'emptyBag',
          title: 'No orders yet',
          text: 'When you place an order it will appear here with its status and details.',
          actionHtml: '<a class="btn" href="/shop">Start shopping</a>',
        });
  }

  if (tab === 'addresses') {
    return `
    <div class="stack">
      <section class="card">
        <h2 style="font-size:var(--step-2)">Saved addresses</h2>
        ${
          addresses.length
            ? addresses
                .map(
                  (address) => `
              <div class="line-item" style="grid-template-columns:minmax(0,1fr) auto">
                <div>
                  <p class="line-item__title">${escapeHtml(address.label || 'Address')}${address.is_default ? ' <span class="badge">Default</span>' : ''}</p>
                  <p class="line-item__meta">
                    ${escapeHtml(address.full_name)}<br>
                    ${escapeHtml(address.line1)}${address.line2 ? `, ${escapeHtml(address.line2)}` : ''}<br>
                    ${escapeHtml(address.city)}${address.state ? `, ${escapeHtml(address.state)}` : ''} ${escapeHtml(address.postal_code)}<br>
                    ${escapeHtml(address.country)}
                  </p>
                </div>
                <button class="btn--quiet" type="button" data-delete-address="${address.id}"
                  style="border:none;background:none;cursor:pointer;color:var(--muted);font-size:.8rem">Delete</button>
              </div>`
                )
                .join('')
            : '<p class="muted">No saved addresses yet — add one and it will pre-fill your next checkout.</p>'
        }
      </section>
      <section class="card">
        <h2 style="font-size:var(--step-2)">Add an address</h2>
        <form id="address-form">
          <div class="form-row">
            <div class="field"><label for="a-label">Label</label><input class="input" id="a-label" name="label" placeholder="Home"></div>
            <div class="field"><label for="a-fullName">Full name <span class="req">*</span></label><input class="input" id="a-fullName" name="fullName" required></div>
            <div class="field"><label for="a-phone">Phone</label><input class="input" id="a-phone" name="phone"></div>
          </div>
          <div class="field"><label for="a-line1">Address <span class="req">*</span></label><input class="input" id="a-line1" name="line1" required></div>
          <div class="field"><label for="a-line2">Apartment, suite</label><input class="input" id="a-line2" name="line2"></div>
          <div class="form-row">
            <div class="field"><label for="a-city">City <span class="req">*</span></label><input class="input" id="a-city" name="city" required></div>
            <div class="field"><label for="a-state">State or region</label><input class="input" id="a-state" name="state"></div>
            <div class="field"><label for="a-postalCode">Postal code <span class="req">*</span></label><input class="input" id="a-postalCode" name="postalCode" required></div>
            <div class="field"><label for="a-country">Country <span class="req">*</span></label><input class="input" id="a-country" name="country" required value="United States"></div>
          </div>
          <label class="checkbox" style="margin-bottom:.75rem"><input type="checkbox" name="isDefault" checked><span>Make this my default address</span></label>
          <button class="btn" type="submit">Save address</button>
        </form>
      </section>
    </div>`;
  }

  const savedCount = wishlist.count();
  return `
  <div class="stack">
    <section class="card">
      <div class="section-head" style="margin-bottom:.5rem">
        <h2 style="font-size:var(--step-2)">Wishlist</h2>
        <a class="section-link" href="/wishlist">Open wishlist ${icons.arrowRight}</a>
      </div>
      <p class="muted">${savedCount ? `${savedCount} saved item${savedCount === 1 ? '' : 's'} in this browser.` : 'Nothing saved yet — tap the heart on any product.'}</p>
    </section>
    <section class="card">
      <h2 style="font-size:var(--step-2)">Recently viewed</h2>
      ${
        recent.length
          ? `<ul style="list-style:none;display:grid;gap:.6rem">
              ${recent
                .map(
                  (item) => `<li><a href="/product?slug=${encodeURIComponent(item.slug)}">${escapeHtml(item.name)}</a>
                    <span class="muted"> · ${money(item.price)}</span></li>`
                )
                .join('')}
            </ul>`
          : '<p class="muted">Products you open will be listed here.</p>'
      }
    </section>
  </div>`;
}

async function render() {
  await session.load(true);
  if (!session.user) {
    root.innerHTML = authHtml();
    bindAuth();
    return;
  }
  const [orders, addresses, recent] = await Promise.all([
    api.get('/api/orders').catch(() => []),
    api.get('/api/addresses').catch(() => []),
    recentlyViewed.products().catch(() => []),
  ]);
  root.innerHTML = accountShell(orders, addresses, recent);
  bindAccount(orders);
}

function bindAuth() {
  document.querySelectorAll('[data-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      mode = button.dataset.mode;
      history.replaceState({}, '', `/account${mode === 'register' ? '?mode=register' : ''}`);
      render();
    });
  });

  const form = document.getElementById('auth-form');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const alertBox = document.getElementById('auth-alert');
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      if (mode === 'register') {
        await session.register({
          name: form.name.value.trim(),
          email: form.email.value.trim(),
          password: form.password.value,
        });
        toast('Welcome to Aurora Skincare.');
      } else {
        await session.login(form.email.value.trim(), form.password.value);
        toast('Signed in.');
      }
      tab = 'profile';
      history.replaceState({}, '', '/account');
      await render();
    } catch (err) {
      alertBox.hidden = false;
      alertBox.innerHTML = `<div class="alert alert--error" role="alert">${escapeHtml(err.message)}</div>`;
    } finally {
      button.disabled = false;
    }
  });
}

function bindAccount(orders) {
  document.querySelectorAll('[data-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      tab = button.dataset.tab;
      history.replaceState({}, '', `/account?tab=${tab}`);
      render();
    });
  });

  document.querySelector('[data-signout]')?.addEventListener('click', async () => {
    await session.logout();
    toast('Signed out.');
    render();
  });

  document.getElementById('profile-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const result = await api.patch('/api/auth/profile', {
        name: event.target.name.value.trim(),
        phone: event.target.phone.value.trim(),
      });
      session.user = result.user;
      toast('Profile updated.');
    } catch (err) {
      toast(err.message, 'error');
    }
  });

  document.getElementById('password-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      await api.post('/api/auth/password', {
        currentPassword: event.target.currentPassword.value,
        newPassword: event.target.newPassword.value,
      });
      event.target.reset();
      toast('Password updated.');
    } catch (err) {
      toast(err.message, 'error');
    }
  });

  document.getElementById('address-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.target;
    try {
      await api.post('/api/addresses', {
        label: form.label.value.trim(),
        fullName: form.fullName.value.trim(),
        phone: form.phone.value.trim(),
        line1: form.line1.value.trim(),
        line2: form.line2.value.trim(),
        city: form.city.value.trim(),
        state: form.state.value.trim(),
        postalCode: form.postalCode.value.trim(),
        country: form.country.value.trim(),
        isDefault: form.isDefault.checked,
      });
      toast('Address saved.');
      render();
    } catch (err) {
      toast(err.message, 'error');
    }
  });

  document.querySelectorAll('[data-delete-address]').forEach((button) => {
    button.addEventListener('click', async () => {
      await api.del(`/api/addresses/${button.dataset.deleteAddress}`);
      toast('Address removed.');
      render();
    });
  });

  document.querySelectorAll('[data-reorder]').forEach((button) => {
    button.addEventListener('click', async () => {
      const items = JSON.parse(decodeURIComponent(button.dataset.reorder));
      let added = 0;
      for (const item of items) {
        try {
          const { product } = await api.get(`/api/products/${encodeURIComponent(item.slug)}`);
          const variant = product.variants?.find((v) => v.label === item.variant) || product.variants?.[0];
          cart.add(
            {
              ...product,
              price: variant ? variant.price : product.price,
              stock: variant ? variant.stock : product.stock,
            },
            { variant: variant?.label || '', quantity: item.quantity }
          );
          added += 1;
        } catch {
          /* product may no longer exist */
        }
      }
      toast(added ? `${added} item${added === 1 ? '' : 's'} added to your bag.` : 'Those items are no longer available.', added ? 'success' : 'error');
    });
  });
}

await render();
