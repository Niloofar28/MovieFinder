/**
 * Order confirmation / order detail page.
 * Guests reach it with their order number and the email used at checkout;
 * signed-in customers see their own orders without re-entering an email.
 */

import { api, escapeHtml } from '../api.js';
import { money, session } from '../store.js';
import { breadcrumbs, emptyState, icons, mountShell, setPageMeta, toast } from '../ui.js';

await mountShell('/account');
const root = document.getElementById('order-root');
document.getElementById('order-breadcrumbs').innerHTML = breadcrumbs([
  { label: 'Account', href: '/account' },
  { label: 'Order' },
]);

const params = new URLSearchParams(location.search);
let number = params.get('number') || '';
let email = params.get('email') || '';
const isNew = params.get('new') === '1';

setPageMeta({
  title: number ? `Order ${number} — Aurora Skincare` : 'Track your order — Aurora Skincare',
  description: 'View your Aurora Skincare order details, items and current status.',
  path: '/order',
});

const STATUS_FLOW = ['pending', 'processing', 'shipped', 'delivered'];

function statusTimeline(status) {
  const index = STATUS_FLOW.indexOf(status);
  return `
  <ol style="list-style:none;display:grid;gap:.5rem;margin:1rem 0 0">
    ${STATUS_FLOW.map(
      (step, i) => `
      <li style="display:flex;gap:.6rem;align-items:center;color:${i <= index ? 'var(--ink)' : 'var(--muted)'}">
        <span aria-hidden="true" style="width:22px;height:22px;border-radius:50%;display:grid;place-items:center;
          background:${i <= index ? 'var(--purple-600)' : 'var(--blush-200)'};color:${i <= index ? '#fff' : 'inherit'}">
          ${i <= index ? icons.check : ''}
        </span>
        <span style="text-transform:capitalize">${step}</span>
      </li>`
    ).join('')}
  </ol>`;
}

function orderHtml(order) {
  return `
  <div class="container section" style="padding-top:1.5rem">
    ${
      isNew
        ? `<div class="alert alert--success" role="status">
            <strong>Thank you — your order is confirmed.</strong>
            <p style="margin:.35rem 0 0">A confirmation was recorded for ${escapeHtml(order.email)}. No payment was taken: this store runs a labelled demo checkout.</p>
          </div>`
        : ''
    }
    <div class="section-head" style="align-items:flex-start">
      <div>
        <h1 style="font-size:var(--step-3)">Order ${escapeHtml(order.number)}</h1>
        <p class="muted">Placed ${escapeHtml(order.createdAt)} &middot; ${order.items.length} item${order.items.length === 1 ? '' : 's'}</p>
      </div>
      <span class="status status--${escapeHtml(order.status)}">${escapeHtml(order.status)}</span>
    </div>

    <div class="stack">
      <section class="card" aria-labelledby="order-items">
        <h2 id="order-items" style="font-size:var(--step-2)">Items</h2>
        ${order.items
          .map(
            (item) => `
          <div class="line-item">
            <div class="line-item__media"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy"></div>
            <div>
              <p class="line-item__title"><a href="/product?slug=${encodeURIComponent(item.slug)}">${escapeHtml(item.name)}</a></p>
              ${item.variant ? `<p class="line-item__meta">${escapeHtml(item.variant)}</p>` : ''}
              <p class="line-item__meta">${money(item.unitPrice)} × ${item.quantity}</p>
            </div>
            <span class="line-item__price">${money(item.lineTotal)}</span>
          </div>`
          )
          .join('')}
        <div class="summary" style="margin-top:1rem">
          <div class="summary__row"><span>Subtotal</span><span>${money(order.subtotal)}</span></div>
          ${order.discount ? `<div class="summary__row"><span>Discount ${escapeHtml(order.couponCode)}</span><span>-${money(order.discount)}</span></div>` : ''}
          <div class="summary__row"><span>Shipping (${escapeHtml(order.deliveryLabel)})</span><span>${order.shipping === 0 ? 'Free' : money(order.shipping)}</span></div>
          <div class="summary__row summary__row--total"><span>Total</span><span>${money(order.total)}</span></div>
        </div>
      </section>

      <div class="card-grid">
        <section class="card">
          <h2 style="font-size:var(--step-1)">Delivery address</h2>
          <p class="muted" style="margin:0">
            ${escapeHtml(order.fullName)}<br>
            ${escapeHtml(order.address.line1)}${order.address.line2 ? `<br>${escapeHtml(order.address.line2)}` : ''}<br>
            ${escapeHtml(order.address.city)}${order.address.state ? `, ${escapeHtml(order.address.state)}` : ''} ${escapeHtml(order.address.postalCode)}<br>
            ${escapeHtml(order.address.country)}<br>
            ${order.phone ? escapeHtml(order.phone) : ''}
          </p>
        </section>
        <section class="card">
          <h2 style="font-size:var(--step-1)">Payment</h2>
          <p class="muted" style="margin:0">
            ${order.paymentMethod === 'demo_on_delivery' ? 'Pay on delivery (test mode)' : 'Demo card (test mode)'}<br>
            Status: ${escapeHtml(order.paymentStatus.replace(/_/g, ' '))}<br>
            No card details were requested or stored.
          </p>
        </section>
        <section class="card">
          <h2 style="font-size:var(--step-1)">Status</h2>
          ${statusTimeline(order.status)}
        </section>
      </div>

      ${order.notes ? `<section class="card"><h2 style="font-size:var(--step-1)">Order notes</h2><p class="muted" style="margin:0">${escapeHtml(order.notes)}</p></section>` : ''}

      <div style="display:flex;gap:.6rem;flex-wrap:wrap">
        <a class="btn" href="/shop">Continue shopping</a>
        <a class="btn btn--ghost" href="/account?tab=orders">View my orders</a>
        <button class="btn btn--ghost" type="button" data-copy-order="${escapeHtml(order.number)}">Copy order number</button>
      </div>
    </div>
  </div>`;
}

function lookupForm(message = '') {
  return `
  <div class="container section" style="padding-top:1.5rem;max-width:640px">
    <h1 style="font-size:var(--step-3)">Track your order</h1>
    <p class="muted">Enter your order number and the email address used at checkout.</p>
    ${message ? `<div class="alert alert--error" role="alert">${escapeHtml(message)}</div>` : ''}
    <form id="track-form" class="card">
      <div class="field">
        <label for="track-number">Order number <span class="req">*</span></label>
        <input class="input" id="track-number" name="number" required value="${escapeHtml(number)}" placeholder="AUR-20260101-AB12">
      </div>
      <div class="field">
        <label for="track-email">Email used at checkout <span class="req">*</span></label>
        <input class="input" id="track-email" name="email" type="email" required value="${escapeHtml(email)}">
      </div>
      <button class="btn" type="submit">Find my order</button>
    </form>
  </div>`;
}

function bindCopy() {
  document.querySelectorAll('[data-copy-order]').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.copyOrder);
        toast('Order number copied.');
      } catch {
        toast('Copy is unavailable in this browser.', 'error');
      }
    });
  });
}

async function loadOrder() {
  if (!number) {
    root.innerHTML = lookupForm();
    bindLookup();
    return;
  }
  try {
    const data = await api.get(
      `/api/orders/track/${encodeURIComponent(number)}${email ? `?email=${encodeURIComponent(email)}` : ''}`
    );
    root.innerHTML = orderHtml(data.order);
    bindCopy();
  } catch (err) {
    if (err.status === 403) {
      root.innerHTML = lookupForm('Please confirm the email address used for this order.');
      bindLookup();
      return;
    }
    root.innerHTML = `<div class="container section">${emptyState({
      icon: 'info',
      title: 'We could not find that order',
      text: err.message,
      actionHtml: '<a class="btn" href="/shop">Back to shop</a>',
    })}</div>`;
  }
}

function bindLookup() {
  const form = document.getElementById('track-form');
  if (!form) return;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    number = form.number.value.trim().toUpperCase();
    email = form.email.value.trim();
    history.replaceState({}, '', `/order?number=${encodeURIComponent(number)}&email=${encodeURIComponent(email)}`);
    loadOrder();
  });
}

await session.load().catch(() => null);
await loadOrder();
