/**
 * Full bag page — quantity controls, promo codes, shipping estimate and totals.
 * The server re-validates stock, prices and the coupon when the order is placed.
 */

import { api, escapeHtml } from '../api.js';
import { cart, getContent, money } from '../store.js';
import { breadcrumbs, emptyState, icons, mountShell, setPageMeta, toast } from '../ui.js';

const { content } = await mountShell('/cart');
const root = document.getElementById('cart-root');
document.getElementById('cart-breadcrumbs').innerHTML = breadcrumbs([{ label: 'Shopping bag' }]);

const COUPON_KEY = 'aurora.coupon';
const shippingMethods = content.shippingMethods || [];
const standard = shippingMethods.find((m) => m.code === 'standard') || { price: 6.99, freeOver: 50, name: 'Standard delivery', eta: '' };

let coupon = null;
try {
  coupon = JSON.parse(sessionStorage.getItem(COUPON_KEY) || 'null');
} catch {
  coupon = null;
}

const saveCoupon = (value) => {
  coupon = value;
  if (value) sessionStorage.setItem(COUPON_KEY, JSON.stringify(value));
  else sessionStorage.removeItem(COUPON_KEY);
};

setPageMeta({
  title: 'Your Shopping Bag — Aurora Skincare',
  description: 'Review the items in your bag, apply a promo code and continue to checkout.',
  path: '/cart',
});

function totals() {
  const subtotal = cart.subtotal();
  const discount = coupon ? Number(coupon.discount) || 0 : 0;
  const freeByThreshold = subtotal - discount >= (standard.freeOver || 0);
  const shipping = coupon && coupon.freeShipping ? 0 : freeByThreshold ? 0 : standard.price;
  return { subtotal, discount, shipping, total: Math.round((subtotal - discount + shipping) * 100) / 100 };
}

function summaryHtml() {
  const t = totals();
  return `
  <aside class="summary" aria-label="Order summary">
    <h3>Order summary</h3>
    <div class="summary__row"><span>Subtotal</span><span>${money(t.subtotal)}</span></div>
    ${
      coupon
        ? `<div class="summary__row"><span>Promo code <strong>${escapeHtml(coupon.code)}</strong>
            <button type="button" class="btn--quiet" data-remove-coupon style="border:none;background:none;cursor:pointer;color:var(--muted);font-size:.75rem">remove</button></span>
            <span>-${money(t.discount)}</span></div>`
        : ''
    }
    <div class="summary__row">
      <span>Shipping (${escapeHtml(standard.name)})</span>
      <span>${t.shipping === 0 ? 'Free' : money(t.shipping)}</span>
    </div>
    <div class="summary__row summary__row--total"><span>Total</span><span>${money(t.total)}</span></div>
    <form data-coupon-form style="margin-top:1rem">
      <label class="field-label" for="coupon-input">Promo code</label>
      <div class="range-row">
        <input class="input" id="coupon-input" name="code" placeholder="e.g. AURORA10" autocomplete="off">
        <button class="btn btn--sm" type="submit">Apply</button>
      </div>
      <p class="form-note" data-coupon-status role="status"></p>
    </form>
    <div class="stack" style="margin-top:1rem">
      <a class="btn btn--block" href="/checkout">Proceed to checkout</a>
      <a class="btn btn--ghost btn--block" href="/shop">Continue shopping</a>
    </div>
    <p class="form-note" style="margin-top:.75rem">${escapeHtml(
      (content.footer && content.footer.paymentNote) || ''
    )}</p>
  </aside>`;
}

function lineHtml(line) {
  return `
  <div class="line-item" data-line="${escapeHtml(line.slug)}" data-variant="${escapeHtml(line.variant || '')}">
    <div class="line-item__media">
      <a href="/product?slug=${encodeURIComponent(line.slug)}"><img src="${escapeHtml(line.image)}" alt="${escapeHtml(line.name)}" loading="lazy"></a>
    </div>
    <div>
      <p class="line-item__title"><a href="/product?slug=${encodeURIComponent(line.slug)}">${escapeHtml(line.name)}</a></p>
      ${line.variant ? `<p class="line-item__meta">${escapeHtml(line.variant)}</p>` : ''}
      <p class="line-item__meta">${money(line.price)} each &middot; ${line.stock} in stock</p>
      <div class="qty" role="group" aria-label="Quantity for ${escapeHtml(line.name)}">
        <button type="button" data-step="-1" aria-label="Decrease quantity">&minus;</button>
        <input type="number" min="1" max="${line.stock || 99}" value="${line.quantity}" data-qty aria-label="Quantity">
        <button type="button" data-step="1" aria-label="Increase quantity">+</button>
      </div>
    </div>
    <div style="text-align:right;display:grid;gap:.5rem;justify-items:end">
      <span class="line-item__price">${money(line.price * line.quantity)}</span>
      <button type="button" data-remove class="btn--quiet" style="border:none;background:none;cursor:pointer;color:var(--muted);font-size:.78rem">Remove</button>
    </div>
  </div>`;
}

function render() {
  const lines = cart.lines();
  if (!lines.length) {
    root.innerHTML = `
      <div class="container section">
        ${emptyState({
          icon: 'emptyBag',
          title: 'Your bag is empty',
          text: 'Add a serum, a lipstick or a scent — everything you pick shows up here.',
          actionHtml: '<a class="btn" href="/shop">Shop all products</a>',
        })}
      </div>`;
    return;
  }

  root.innerHTML = `
  <div class="container section" style="padding-top:1rem">
    <div class="shop-layout" style="grid-template-columns:minmax(0,1fr) 340px">
      <div>
        <div class="section-head"><h2>${cart.count()} item${cart.count() === 1 ? '' : 's'} in your bag</h2></div>
        <div>${lines.map(lineHtml).join('')}</div>
      </div>
      ${summaryHtml()}
    </div>
  </div>`;

  bind();
}

function bind() {
  root.addEventListener('click', (event) => {
    const lineEl = event.target.closest('[data-line]');
    const step = event.target.closest('[data-step]');
    const remove = event.target.closest('[data-remove]');
    if (event.target.closest('[data-remove-coupon]')) {
      saveCoupon(null);
      toast('Promo code removed.');
      render();
      return;
    }
    if (!lineEl) return;
    const slug = lineEl.dataset.line;
    const variant = lineEl.dataset.variant;
    const line = cart.lines().find((l) => l.slug === slug && (l.variant || '') === variant);
    if (!line) return;
    if (step) {
      cart.setQuantity(slug, variant, line.quantity + Number(step.dataset.step));
      render();
    } else if (remove) {
      cart.remove(slug, variant);
      toast('Removed from your bag.');
      render();
    }
  });
  root.addEventListener('change', (event) => {
    const input = event.target.closest('[data-qty]');
    if (!input) return;
    const lineEl = input.closest('[data-line]');
    cart.setQuantity(lineEl.dataset.line, lineEl.dataset.variant, input.value);
    render();
  });
  root.addEventListener('submit', async (event) => {
    const form = event.target.closest('[data-coupon-form]');
    if (!form) return;
    event.preventDefault();
    const code = form.querySelector('input').value.trim();
    const status = form.querySelector('[data-coupon-status]');
    if (!code) {
      status.textContent = 'Enter a promo code first.';
      status.style.color = 'var(--danger)';
      return;
    }
    const button = form.querySelector('button');
    button.disabled = true;
    try {
      const result = await api.post('/api/coupons/validate', { code, subtotal: cart.subtotal(), shipping: 'standard' });
      saveCoupon(result);
      toast(`Promo code ${result.code} applied.`);
      render();
    } catch (err) {
      status.textContent = err.message;
      status.style.color = 'var(--danger)';
    } finally {
      button.disabled = false;
    }
  });
}

render();

/* Re-check prices and stock against the live catalog before showing totals. */
try {
  await cart.refresh();
  render();
} catch {
  /* offline: keep the locally stored bag visible */
}
