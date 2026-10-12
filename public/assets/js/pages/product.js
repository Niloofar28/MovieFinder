/**
 * Product detail page — gallery, variants, stock-aware quantity, add to bag,
 * buy now, wishlist, tabbed information, related products and recently viewed.
 */

import { api, escapeHtml } from '../api.js';
import { cart, money, recentlyViewed, wishlist } from '../store.js';
import {
  bindProductActions,
  bindTabs,
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

await mountShell('/shop');
const slug = new URLSearchParams(location.search).get('slug');
const root = document.getElementById('product-root');

async function renderProduct() {
  let data;
  try {
    data = await api.get(`/api/products/${encodeURIComponent(slug)}`);
  } catch (err) {
    root.innerHTML = emptyState({
      title: 'We could not find that product',
      text: err.message,
      actionHtml: '<a class="btn" href="/shop">Back to shop</a>',
    });
    return;
  }

  const { product, related } = data;
  recentlyViewed.push(product.slug);

  const selected = { variant: product.variants?.[0]?.label || '', quantity: 1 };

  const currentPrice = () => {
    const variant = product.variants?.find((v) => v.label === selected.variant);
    return variant ? Number(variant.price) : Number(product.price);
  };
  const currentStock = () => {
    const variant = product.variants?.find((v) => v.label === selected.variant);
    return variant ? Number(variant.stock) : Number(product.stock);
  };

  const images = product.images.length ? product.images : ['/assets/img/products/placeholder.svg'];

  root.innerHTML = `
  <div class="container">
    ${breadcrumbs([
      { label: 'Shop', href: '/shop' },
      { label: product.category.replace(/-/g, ' '), href: `/shop?category=${product.category}` },
      { label: product.name },
    ])}
  </div>
  <div class="container section" style="padding-top:1rem" id="product-detail">
    <div class="product-detail">
      <div class="gallery">
        <div class="gallery__main" id="gallery-main" role="button" tabindex="0"
          aria-label="Product image — activate to zoom">
          <img id="gallery-image" src="${escapeHtml(images[0])}" alt="${escapeHtml(product.name)}" width="900" height="900" decoding="async">
        </div>
        <div class="gallery__thumbs" role="group" aria-label="Product images">
          ${images
            .map(
              (image, index) => `
            <button type="button" data-image="${escapeHtml(image)}" aria-current="${index === 0}">
              <img src="${escapeHtml(image)}" alt="${escapeHtml(product.name)} view ${index + 1}" loading="lazy">
            </button>`
            )
            .join('')}
        </div>
      </div>

      <div class="product-info">
        <p class="product-info__brand">${escapeHtml(product.brand.replace(/-/g, ' '))}</p>
        <h1>${escapeHtml(product.name)}</h1>
        <div class="rating-row">
          ${stars(product.rating, product.reviewCount)}
          <a href="#reviews" style="font-size:inherit">Read about reviews</a>
        </div>
        <div class="product-info__price">${priceBlock(product, 'price price--lg')}</div>
        <p>${escapeHtml(product.shortDescription)}</p>

        ${
          product.variants.length
            ? `<div class="variant-group">
                <p class="field-label" id="variant-label">${product.variants.length && product.category === 'makeup' ? 'Shade or size' : 'Size'}</p>
                <div class="variant-options" role="group" aria-labelledby="variant-label">
                  ${product.variants
                    .map(
                      (variant) => `
                    <button type="button" data-variant="${escapeHtml(variant.label)}"
                      aria-pressed="${variant.label === selected.variant}"
                      ${variant.stock <= 0 ? 'disabled' : ''}>
                      ${escapeHtml(variant.label)} — ${money(variant.price)}${variant.stock <= 0 ? ' (sold out)' : ''}
                    </button>`
                    )
                    .join('')}
                </div>
              </div>`
            : ''
        }

        <div class="product-actions">
          <div class="qty" role="group" aria-label="Quantity">
            <button type="button" data-qty="-1" aria-label="Decrease quantity">&minus;</button>
            <input type="number" id="quantity" value="1" min="1" max="${currentStock()}" aria-label="Quantity">
            <button type="button" data-qty="1" aria-label="Increase quantity">+</button>
          </div>
          <button type="button" class="btn" id="add-to-bag" ${currentStock() > 0 ? '' : 'disabled'}>
            ${currentStock() > 0 ? 'Add to Bag' : 'Sold out'}
          </button>
          <button type="button" class="btn btn--ghost" id="buy-now" ${currentStock() > 0 ? '' : 'disabled'}>Buy Now</button>
          <button type="button" class="icon-btn" id="product-wish" aria-pressed="${wishlist.has(product.slug)}"
            aria-label="${wishlist.has(product.slug) ? 'Remove from' : 'Add to'} wishlist">${icons.heart}</button>
        </div>

        <p class="stock-note" id="stock-note">
          ${
            currentStock() > 0
              ? `<strong>In stock</strong> — ${currentStock()} available${
                  currentStock() <= 12 ? ' · low stock' : ''
                }`
              : 'Currently sold out'
          }
          ${product.sku ? ` &middot; SKU ${escapeHtml(product.sku)}` : ''}
        </p>

        <ul class="usp-list">
          <li>${icons.truck}<span>Free standard shipping on orders over $50 · standard $6.99, express $14.99</span></li>
          <li>${icons.refresh}<span>30-day return policy described in our returns information</span></li>
          <li>${icons.lock}<span>No card details are collected — this store runs a labelled demo checkout</span></li>
        </ul>
      </div>
    </div>

    <section class="tabs" data-tabs aria-label="Product information">
      <div class="tabs__list" role="tablist">
        ${[
          ['description', 'Description'],
          ['ingredients', 'Key Ingredients'],
          ['benefits', 'Benefits'],
          ['how', 'How to Use'],
          ['details', 'Product Details'],
          ['reviews', 'Customer Reviews'],
        ]
          .map(
            ([id, label], index) =>
              `<button type="button" role="tab" id="tab-${id}" aria-controls="panel-${id}"
                aria-selected="${index === 0}">${label}</button>`
          )
          .join('')}
      </div>
      <div class="tab-panel" role="tabpanel" id="panel-description" aria-labelledby="tab-description">
        <h3>About this product</h3>
        <p>${escapeHtml(product.description)}</p>
      </div>
      <div class="tab-panel" role="tabpanel" id="panel-ingredients" aria-labelledby="tab-ingredients" hidden>
        <h3>Key ingredients</h3>
        <p>${escapeHtml(product.ingredients || 'Full ingredient information is published on the packaging.')}</p>
        <p class="form-note">Cosmetic product information. Nothing here is medical advice and no treatment outcome is promised.</p>
      </div>
      <div class="tab-panel" role="tabpanel" id="panel-benefits" aria-labelledby="tab-benefits" hidden>
        <h3>Benefits</h3>
        <ul>${product.benefits.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>
      </div>
      <div class="tab-panel" role="tabpanel" id="panel-how" aria-labelledby="tab-how" hidden>
        <h3>How to use</h3>
        <p>${escapeHtml(product.howToUse)}</p>
      </div>
      <div class="tab-panel" role="tabpanel" id="panel-details" aria-labelledby="tab-details" hidden>
        <h3>Product details</h3>
        <ul>
          ${product.details.map((d) => `<li>${escapeHtml(d)}</li>`).join('')}
          <li>Brand: ${escapeHtml(product.brand.replace(/-/g, ' '))}</li>
          <li>Category: ${escapeHtml(product.category.replace(/-/g, ' '))}</li>
          ${product.variants.length ? `<li>Options: ${product.variants.map((v) => escapeHtml(v.label)).join(', ')}</li>` : ''}
        </ul>
      </div>
      <div class="tab-panel" id="panel-reviews" role="tabpanel" aria-labelledby="tab-reviews" hidden>
        <h3 id="reviews">Customer reviews</h3>
        <div class="summary" style="max-width:520px;margin-bottom:1rem">
          <div class="summary__row"><span>Sample rating</span><span>${stars(product.rating, null, { showCount: false })} ${product.rating.toFixed(1)} / 5</span></div>
          <div class="summary__row"><span>Sample rating count</span><span>${product.reviewCount}</span></div>
        </div>
        ${emptyState({
          icon: 'info',
          title: 'Verified reviews appear here once the store is live',
          text: 'This is a demonstration store: the rating and count above are sample data for a fictional brand, not verified customer reviews. Real reviews will be collected from completed orders.',
        })}
      </div>
    </section>

    ${
      related.length
        ? `<section class="section">
            <div class="section-head">
              <h2>You May Also Like</h2>
              <a class="section-link" href="/shop?category=${product.category}">More in ${escapeHtml(
                product.category.replace(/-/g, ' ')
              )} ${icons.arrowRight}</a>
            </div>
            <div class="product-grid product-grid--four">${related
              .slice(0, 4)
              .map((item) => productCard(item))
              .join('')}</div>
          </section>`
        : ''
    }

    <section class="section" id="recently-viewed-section" hidden>
      <div class="section-head"><h2>Recently Viewed</h2></div>
      <div class="product-grid product-grid--four" id="recently-viewed-grid"></div>
    </section>
  </div>`;

  bindTabs(root);

  /* gallery ------------------------------------------------------------- */
  const mainImage = document.getElementById('gallery-image');
  const mainWrap = document.getElementById('gallery-main');
  root.querySelectorAll('[data-image]').forEach((button) => {
    button.addEventListener('click', () => {
      mainImage.src = button.dataset.image;
      root.querySelectorAll('[data-image]').forEach((b) => b.setAttribute('aria-current', String(b === button)));
    });
  });
  const toggleZoom = () => {
    mainWrap.classList.toggle('is-zoomed');
    mainWrap.setAttribute('aria-pressed', String(mainWrap.classList.contains('is-zoomed')));
  };
  mainWrap.addEventListener('click', toggleZoom);
  mainWrap.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleZoom();
    }
  });

  /* variants & quantity -------------------------------------------------- */
  const stockNote = document.getElementById('stock-note');
  const quantityInput = document.getElementById('quantity');
  const addButton = document.getElementById('add-to-bag');
  const buyButton = document.getElementById('buy-now');
  const wishButton = document.getElementById('product-wish');

  const refreshStockUi = () => {
    const stock = currentStock();
    quantityInput.max = Math.max(1, stock);
    if (Number(quantityInput.value) > stock) quantityInput.value = Math.max(1, stock);
    stockNote.innerHTML = `${
      stock > 0 ? `<strong>In stock</strong> — ${stock} available${stock <= 12 ? ' · low stock' : ''}` : 'Currently sold out'
    }${product.sku ? ` &middot; SKU ${escapeHtml(product.sku)}` : ''}`;
    addButton.disabled = stock <= 0;
    buyButton.disabled = stock <= 0;
    addButton.textContent = stock > 0 ? 'Add to Bag' : 'Sold out';
    const priceTarget = document.querySelector('.product-info__price');
    priceTarget.innerHTML = priceBlock({ ...product, price: currentPrice() }, 'price price--lg');
  };

  root.querySelectorAll('[data-variant]').forEach((button) => {
    button.addEventListener('click', () => {
      selected.variant = button.dataset.variant;
      root.querySelectorAll('[data-variant]').forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
      selected.quantity = 1;
      quantityInput.value = 1;
      refreshStockUi();
    });
  });

  root.querySelectorAll('[data-qty]').forEach((button) => {
    button.addEventListener('click', () => {
      const next = Number(quantityInput.value) + Number(button.dataset.qty);
      quantityInput.value = Math.min(Math.max(1, next), currentStock());
    });
  });
  quantityInput.addEventListener('change', () => {
    quantityInput.value = Math.min(Math.max(1, Number(quantityInput.value) || 1), currentStock());
  });

  const addToBag = ({ thenCheckout = false } = {}) => {
    const stock = currentStock();
    const quantity = Math.min(Math.max(1, Number(quantityInput.value) || 1), stock);
    if (stock <= 0) {
      toast('This option is sold out.', 'error');
      return;
    }
    cart.add(
      { ...product, price: currentPrice(), stock },
      { variant: selected.variant, quantity }
    );
    toast(`${product.name} added to your bag.`);
    if (thenCheckout) location.href = '/checkout';
    else openCart();
  };

  addButton.addEventListener('click', () => addToBag());
  buyButton.addEventListener('click', () => addToBag({ thenCheckout: true }));
  wishButton.addEventListener('click', () => {
    const added = wishlist.toggle(product.slug);
    wishButton.setAttribute('aria-pressed', String(added));
    wishButton.setAttribute('aria-label', `${added ? 'Remove from' : 'Add to'} wishlist`);
    toast(added ? 'Saved to your wishlist.' : 'Removed from your wishlist.');
  });

  bindProductActions(root);

  setPageMeta({
    title: `${product.name} — Aurora Skincare`,
    description: `${product.shortDescription} ${money(product.price)}. ${product.category.replace(/-/g, ' ')} from ${
      product.brand.replace(/-/g, ' ')
    }.`,
    path: `/product?slug=${product.slug}`,
    image: images[0],
    type: 'product',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.shortDescription,
      sku: product.sku,
      brand: { '@type': 'Brand', name: product.brand.replace(/-/g, ' ') },
      category: product.category,
      image: images.map((i) => new URL(i, location.origin).href),
      offers: {
        '@type': 'Offer',
        price: product.price.toFixed(2),
        priceCurrency: 'USD',
        availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        url: new URL(`/product?slug=${product.slug}`, location.origin).href,
      },
    },
  });

  const relatedSection = document.getElementById('recently-viewed-section');
  const recent = await recentlyViewed.products(product.slug).catch(() => []);
  if (recent.length) {
    relatedSection.hidden = false;
    document.getElementById('recently-viewed-grid').innerHTML = recent
      .map((item) => productCard(item, { quickAdd: false }))
      .join('');
  }
}

if (!slug) {
  root.innerHTML = emptyState({
    title: 'Product not found',
    text: 'That product link is missing a product name. Browse the catalog instead.',
    actionHtml: '<a class="btn" href="/shop">Shop all products</a>',
  });
} else {
  await renderProduct();
}
