/**
 * Wishlist page — saved products, move to bag, remove, and recently viewed.
 */

import { api, query } from '../api.js';
import { cart, money, recentlyViewed, wishlist } from '../store.js';
import {
  breadcrumbs,
  emptyState,
  icons,
  mountShell,
  openCart,
  priceBlock,
  productCard,
  setPageMeta,
  stars,
  toast,
} from '../ui.js';

await mountShell('/wishlist');
const root = document.getElementById('wishlist-root');
document.getElementById('wishlist-breadcrumbs').innerHTML = breadcrumbs([{ label: 'Wishlist' }]);

setPageMeta({
  title: 'Your Wishlist — Aurora Skincare',
  description: 'Your saved Aurora Skincare products, ready to move into your bag.',
  path: '/wishlist',
});

async function render() {
  const slugs = wishlist.slugs();
  if (!slugs.length) {
    root.innerHTML = `
    <div class="container section">
      ${emptyState({
        icon: 'emptyHeart',
        title: 'Your wishlist is empty',
        text: 'Tap the heart on any product to save it here for later.',
        actionHtml: '<a class="btn" href="/shop">Browse products</a>',
      })}
    </div>`;
    return;
  }

  const data = await api.get(`/api/products${query({ perPage: 48 })}`);
  const items = slugs
    .map((slug) => data.items.find((item) => item.slug === slug))
    .filter(Boolean);

  root.innerHTML = `
  <div class="container section" style="padding-top:1rem">
    <div class="section-head">
      <div>
        <h2>${items.length} saved item${items.length === 1 ? '' : 's'}</h2>
        <p class="section-sub">Kept in this browser, so your list is waiting when you come back.</p>
      </div>
      <div style="display:flex;gap:.5rem;flex-wrap:wrap">
        <button class="btn btn--sm" type="button" data-move-all ${items.some((i) => i.inStock) ? '' : 'disabled'}>Move all to bag</button>
        <button class="btn btn--ghost btn--sm" type="button" data-clear-wishlist>Clear wishlist</button>
      </div>
    </div>
    <div class="product-grid product-grid--four" id="wishlist-grid">
      ${items.map((item) => productCard(item, { quickAdd: false })).join('')}
    </div>
  </div>`;

  root.querySelectorAll('#wishlist-grid .product-card').forEach((card) => {
    const item = items.find((i) => i.slug === card.dataset.slug);
    const body = card.querySelector('.product-card__body');
    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex;gap:.4rem;flex-wrap:wrap;margin-top:.35rem';
    actions.innerHTML = `
      <button class="btn btn--sm" type="button" data-add="${item.slug}" ${item.inStock ? '' : 'disabled'}>${
        item.inStock ? 'Add to bag' : 'Sold out'
      }</button>
      <button class="btn btn--ghost btn--sm" type="button" data-remove="${item.slug}">Remove</button>`;
    body.appendChild(actions);
  });

  root.addEventListener('click', async (event) => {
    const add = event.target.closest('[data-add]');
    const remove = event.target.closest('[data-remove]');
    const moveAll = event.target.closest('[data-move-all]');
    const clear = event.target.closest('[data-clear-wishlist]');

    if (add) {
      const item = items.find((i) => i.slug === add.dataset.add);
      cart.add(item, { variant: item.variants?.[0]?.label || '', quantity: 1 });
      toast(`${item.name} moved to your bag.`);
      openCart();
    } else if (remove) {
      wishlist.remove(remove.dataset.remove);
      toast('Removed from your wishlist.');
      render();
    } else if (moveAll) {
      items
        .filter((item) => item.inStock)
        .forEach((item) => cart.add(item, { variant: item.variants?.[0]?.label || '', quantity: 1 }));
      toast('Available items moved to your bag.');
      openCart();
    } else if (clear) {
      slugs.forEach((slug) => wishlist.remove(slug));
      toast('Wishlist cleared.');
      render();
    }
  });
}

await render();

const recentSection = document.getElementById('recently-viewed-section');
const recent = await recentlyViewed.products().catch(() => []);
if (recent.length) {
  recentSection.hidden = false;
  document.getElementById('recently-viewed-grid').innerHTML = recent
    .map((item) => productCard(item, { quickAdd: false }))
    .join('');
}
