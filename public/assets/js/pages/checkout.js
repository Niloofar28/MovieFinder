/**
 * Checkout — validated form, delivery and payment selection, live summary and
 * order creation. The server recalculates every price, stock check and total,
 * and no card details are ever collected (demo checkout is clearly labelled).
 */

import { api, escapeHtml } from '../api.js';
import { cart, getContent, money, session } from '../store.js';
import { breadcrumbs, emptyState, icons, mountShell, setPageMeta, toast } from '../ui.js';

const { content } = await mountShell('/checkout');
const root = document.getElementById('checkout-root');
document.getElementById('checkout-breadcrumbs').innerHTML = breadcrumbs([
  { label: 'Shopping bag', href: '/cart' },
  { label: 'Checkout' },
]);

const COUPON_KEY = 'aurora.coupon';
const shippingMethods = content.shippingMethods || [];
let coupon = null;
try {
  coupon = JSON.parse(sessionStorage.getItem(COUPON_KEY) || 'null');
} catch {
  coupon = null;
}

let deliveryCode = 'standard';
let paymentCode = 'demo_card';
let submitting = false;

setPageMeta({
  title: 'Checkout — Aurora Skincare',
  description: 'Complete your Aurora Skincare order. Demo checkout: no real payment is taken.',
  path: '/checkout',
});

const methodFor = (code) => shippingMethods.find((m) => m.code === code) || shippingMethods[0] || { price: 0 };

function totals() {
  const subtotal = cart.subtotal();
  const discount = coupon ? Number(coupon.discount) || 0 : 0;
  const method = methodFor(deliveryCode);
  const freeByThreshold = method.freeOver != null && subtotal - discount >= method.freeOver;
  const shipping = coupon && coupon.freeShipping ? 0 : freeByThreshold ? 0 : method.price;
  return { subtotal, discount, shipping, total: Math.round((subtotal - discount + shipping) * 100) / 100 };
}

async function render() {
  const lines = cart.lines();
  if (!lines.length) {
    root.innerHTML = `<div class="container section">${emptyState({
      icon: 'emptyBag',
      title: 'Nothing to check out yet',
      text: 'Your bag is empty — add a product and come back to complete your order.',
      actionHtml: '<a class="btn" href="/shop">Shop all products</a>',
    })}</div>`;
    return;
  }

  const user = session.user;
  const addresses = user ? await api.get('/api/addresses').catch(() => []) : [];
  const defaultAddress = addresses[0] || null;
  const t = totals();

  root.innerHTML = `
  <div class="container section" style="padding-top:1rem">
    <div class="shop-layout" style="grid-template-columns:minmax(0,1fr) 360px">
      <form id="checkout-form" novalidate>
        <section class="card stack" aria-labelledby="contact-heading">
          <h2 id="contact-heading" style="font-size:var(--step-2)">1. Contact information</h2>
          <div class="form-row">
            <div class="field">
              <label for="fullName">Full name <span class="req">*</span></label>
              <input class="input" id="fullName" name="fullName" autocomplete="name" required value="${escapeHtml(user?.name || '')}">
              <p class="field-error" data-error-for="fullName" hidden></p>
            </div>
            <div class="field">
              <label for="email">Email <span class="req">*</span></label>
              <input class="input" id="email" name="email" type="email" autocomplete="email" required value="${escapeHtml(user?.email || '')}">
              <p class="field-error" data-error-for="email" hidden></p>
            </div>
            <div class="field">
              <label for="phone">Phone number</label>
              <input class="input" id="phone" name="phone" autocomplete="tel" value="${escapeHtml(user?.phone || '')}">
            </div>
          </div>
          ${
            user
              ? `<p class="form-note">Signed in as ${escapeHtml(user.email)} — this order will appear in your account.</p>`
              : `<p class="form-note">Checking out as a guest. <a href="/account?mode=register">Create an account</a> to keep your order history.</p>`
          }
        </section>

        <section class="card stack" aria-labelledby="shipping-heading" style="margin-top:1.25rem">
          <h2 id="shipping-heading" style="font-size:var(--step-2)">2. Shipping address</h2>
          ${
            addresses.length
              ? `<div class="field">
                  <label for="savedAddress">Use a saved address</label>
                  <select class="select" id="savedAddress">
                    <option value="">Enter a new address</option>
                    ${addresses
                      .map(
                        (a) =>
                          `<option value="${a.id}" ${a === defaultAddress ? 'selected' : ''}>${escapeHtml(
                            `${a.full_name}, ${a.line1}, ${a.city}`
                          )}</option>`
                      )
                      .join('')}
                  </select>
                </div>`
              : ''
          }
          <div class="field">
            <label for="line1">Address <span class="req">*</span></label>
            <input class="input" id="line1" name="line1" autocomplete="address-line1" required value="${escapeHtml(defaultAddress?.line1 || '')}">
            <p class="field-error" data-error-for="line1" hidden></p>
          </div>
          <div class="field">
            <label for="line2">Apartment, suite (optional)</label>
            <input class="input" id="line2" name="line2" autocomplete="address-line2" value="${escapeHtml(defaultAddress?.line2 || '')}">
          </div>
          <div class="form-row">
            <div class="field">
              <label for="city">City <span class="req">*</span></label>
              <input class="input" id="city" name="city" autocomplete="address-level2" required value="${escapeHtml(defaultAddress?.city || '')}">
              <p class="field-error" data-error-for="city" hidden></p>
            </div>
            <div class="field">
              <label for="state">State or region</label>
              <input class="input" id="state" name="state" autocomplete="address-level1" value="${escapeHtml(defaultAddress?.state || '')}">
            </div>
            <div class="field">
              <label for="postalCode">Postal code <span class="req">*</span></label>
              <input class="input" id="postalCode" name="postalCode" autocomplete="postal-code" required value="${escapeHtml(defaultAddress?.postal_code || '')}">
              <p class="field-error" data-error-for="postalCode" hidden></p>
            </div>
            <div class="field">
              <label for="country">Country <span class="req">*</span></label>
              <input class="input" id="country" name="country" autocomplete="country-name" required value="${escapeHtml(defaultAddress?.country || 'United States')}">
              <p class="field-error" data-error-for="country" hidden></p>
            </div>
          </div>
        </section>

        <section class="card stack" aria-labelledby="delivery-heading" style="margin-top:1.25rem">
          <h2 id="delivery-heading" style="font-size:var(--step-2)">3. Delivery method</h2>
          <div class="stack" role="radiogroup" aria-label="Delivery method">
            ${shippingMethods
              .map(
                (method) => `
              <label class="checkbox" style="align-items:center">
                <input type="radio" name="deliveryMethod" value="${method.code}" ${method.code === deliveryCode ? 'checked' : ''}>
                <span>
                  <strong>${escapeHtml(method.name)}</strong> — ${escapeHtml(method.eta)}<br>
                  <span class="muted">${method.freeOver != null ? `Free over ${money(method.freeOver)} · ` : ''}${money(method.price)}</span>
                </span>
              </label>`
              )
              .join('')}
          </div>
        </section>

        <section class="card stack" aria-labelledby="payment-heading" style="margin-top:1.25rem">
          <h2 id="payment-heading" style="font-size:var(--step-2)">4. Payment method</h2>
          <div class="alert" role="note">
            ${icons.info} <strong>Demo checkout.</strong> No payment provider is connected, so no card details are collected or stored and no payment is taken.
          </div>
          <div class="stack" role="radiogroup" aria-label="Payment method">
            <label class="checkbox" style="align-items:center">
              <input type="radio" name="paymentMethod" value="demo_card" checked>
              <span><strong>Demo card (test mode)</strong><br><span class="muted">Simulates a successful payment without any card data.</span></span>
            </label>
            <label class="checkbox" style="align-items:center">
              <input type="radio" name="paymentMethod" value="demo_on_delivery">
              <span><strong>Pay on delivery (test mode)</strong><br><span class="muted">Order is recorded as awaiting payment.</span></span>
            </label>
          </div>
        </section>

        <section class="card stack" aria-labelledby="notes-heading" style="margin-top:1.25rem">
          <h2 id="notes-heading" style="font-size:var(--step-2)">5. Order notes (optional)</h2>
          <div class="field">
            <label for="notes">Anything we should know?</label>
            <textarea class="textarea" id="notes" name="notes" placeholder="Delivery instructions, gift note…"></textarea>
          </div>
        </section>

        <div id="checkout-alert" hidden></div>
      </form>

      <aside class="summary" aria-label="Order summary">
        <h3>Order summary</h3>
        ${lines
          .map(
            (line) => `
          <div class="summary__row">
            <span>${escapeHtml(line.name)}${line.variant ? ` <span class="muted">· ${escapeHtml(line.variant)}</span>` : ''} × ${line.quantity}</span>
            <span>${money(line.price * line.quantity)}</span>
          </div>`
          )
          .join('')}
        <div class="summary__row" style="border-top:1px solid var(--border);margin-top:.5rem;padding-top:.6rem">
          <span>Subtotal</span><span>${money(t.subtotal)}</span>
        </div>
        ${
          coupon
            ? `<div class="summary__row"><span>Promo ${escapeHtml(coupon.code)}</span><span>-${money(t.discount)}</span></div>`
            : ''
        }
        <div class="summary__row"><span>Shipping</span><span>${t.shipping === 0 ? 'Free' : money(t.shipping)}</span></div>
        <div class="summary__row summary__row--total"><span>Total</span><span>${money(t.total)}</span></div>
        <div class="stack" style="margin-top:1rem">
          <button class="btn btn--block" type="submit" form="checkout-form" id="place-order">Place order</button>
          <a class="btn btn--ghost btn--block" href="/cart">Back to bag</a>
        </div>
        <p class="form-note" style="margin-top:.75rem">Totals are recalculated on the server when your order is placed, including stock and promo checks.</p>
      </aside>
    </div>
  </div>`;

  bindCheckout();
}

function fieldError(form, name, message) {
  const field = form.querySelector(`[name="${name}"]`);
  const error = form.querySelector(`[data-error-for="${name}"]`);
  if (field) field.setAttribute('aria-invalid', message ? 'true' : 'false');
  if (error) {
    error.textContent = message || '';
    error.hidden = !message;
  }
}

function bindCheckout() {
  const form = document.getElementById('checkout-form');

  form.querySelectorAll('input[name="deliveryMethod"]').forEach((input) => {
    input.addEventListener('change', () => {
      deliveryCode = input.value;
      render();
    });
  });
  form.querySelectorAll('input[name="paymentMethod"]').forEach((input) => {
    input.addEventListener('change', () => {
      paymentCode = input.value;
    });
  });

  const savedSelect = document.getElementById('savedAddress');
  savedSelect?.addEventListener('change', async () => {
    if (!savedSelect.value) return;
    const addresses = await api.get('/api/addresses').catch(() => []);
    const address = addresses.find((a) => String(a.id) === savedSelect.value);
    if (!address) return;
    form.fullName.value = address.full_name || form.fullName.value;
    form.line1.value = address.line1 || '';
    form.line2.value = address.line2 || '';
    form.city.value = address.city || '';
    form.state.value = address.state || '';
    form.postalCode.value = address.postal_code || '';
    form.country.value = address.country || '';
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submitting) return;

    const required = {
      fullName: 'Please enter your full name.',
      email: 'Please enter your email address.',
      line1: 'Please enter your address.',
      city: 'Please enter your city.',
      postalCode: 'Please enter your postal code.',
      country: 'Please enter your country.',
    };
    let firstInvalid = null;
    Object.entries(required).forEach(([name, message]) => {
      const value = String(form[name].value || '').trim();
      let error = value ? '' : message;
      if (!error && name === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
        error = 'Please enter a valid email address.';
      fieldError(form, name, error);
      if (error && !firstInvalid) firstInvalid = form[name];
    });
    if (firstInvalid) {
      firstInvalid.focus();
      toast('Please complete the highlighted fields.', 'error');
      return;
    }

    const lines = cart.lines();
    const payload = {
      items: lines.map((line) => ({ slug: line.slug, variant: line.variant, quantity: line.quantity })),
      customer: {
        fullName: form.fullName.value.trim(),
        email: form.email.value.trim(),
        phone: form.phone.value.trim(),
        line1: form.line1.value.trim(),
        line2: form.line2.value.trim(),
        city: form.city.value.trim(),
        state: form.state.value.trim(),
        postalCode: form.postalCode.value.trim(),
        country: form.country.value.trim(),
      },
      deliveryMethod: deliveryCode,
      paymentMethod: paymentCode,
      couponCode: coupon ? coupon.code : '',
      notes: form.notes.value.trim(),
    };

    const button = document.getElementById('place-order');
    const alertBox = document.getElementById('checkout-alert');
    submitting = true;
    button.disabled = true;
    button.textContent = 'Placing your order…';

    try {
      const result = await api.post('/api/orders', payload);
      cart.clear();
      sessionStorage.removeItem(COUPON_KEY);
      // Full navigation to the confirmation route — the last statement of this script.
      location.assign(
        `/order?number=${encodeURIComponent(result.order.number)}&email=${encodeURIComponent(payload.customer.email)}&new=1`
      );
    } catch (err) {
      submitting = false;
      button.disabled = false;
      button.textContent = 'Place order';
      alertBox.hidden = false;
      alertBox.innerHTML = `<div class="alert alert--error" role="alert">
        <strong>${escapeHtml(err.message)}</strong>
        ${(err.details || [])
          .map((detail) => `<p style="margin:.35rem 0 0">${escapeHtml(detail.message)}</p>`)
          .join('')}
      </div>`;
      alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      toast('We could not place this order.', 'error');
    }
  });
}

await cart.refresh().catch(() => null);
await render();
