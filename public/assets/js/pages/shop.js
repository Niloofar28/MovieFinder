/**
 * Shop / catalog page — search, filters, sorting, grid & list views,
 * pagination and an accessible empty state. All filter state lives in the URL
 * so results can be linked and shared.
 */

import { api, escapeHtml, query } from '../api.js';
import { recentlyViewed } from '../store.js';
import {
  breadcrumbs,
  emptyState,
  icons,
  mountShell,
  productCard,
  setPageMeta,
  skeletonCards,
} from '../ui.js';

const { content, categories } = await mountShell('/shop');

const params = new URLSearchParams(location.search);
const list = (key) => (params.get(key) ? params.get(key).split(',').filter(Boolean) : []);

const state = {
  q: params.get('q') || '',
  category: list('category'),
  brand: list('brand'),
  minPrice: params.get('minPrice') || '',
  maxPrice: params.get('maxPrice') || '',
  rating: params.get('rating') || '',
  availability: params.get('availability') || '',
  sale: params.get('sale') || '',
  new: params.get('new') || '',
  sort: params.get('sort') || 'featured',
  page: Number(params.get('page')) || 1,
  view: params.get('view') || 'grid',
};

const grid = document.getElementById('product-grid');
const paginationEl = document.getElementById('pagination');
const toolbarCount = document.getElementById('toolbar-count');
const activeFiltersEl = document.getElementById('active-filters');
const sortSelect = document.getElementById('sort-select');
const filterPanel = document.getElementById('filter-panel');
const mobileFilterButton = document.getElementById('open-filters');

function toQuery() {
  return {
    q: state.q,
    category: state.category,
    brand: state.brand,
    minPrice: state.minPrice,
    maxPrice: state.maxPrice,
    rating: state.rating,
    availability: state.availability,
    sale: state.sale,
    new: state.new,
    sort: state.sort,
    page: state.page,
    perPage: state.view === 'list' ? 8 : 12,
  };
}

function syncUrl() {
  const next = new URLSearchParams();
  Object.entries(state).forEach(([key, value]) => {
    if (!value) return;
    if (key === 'sort' && value === 'featured') return;
    if (key === 'page' && value === 1) return;
    if (key === 'view' && value === 'grid') return;
    next.set(key, Array.isArray(value) ? value.join(',') : value);
  });
  history.replaceState({}, '', `/shop${next.toString() ? `?${next}` : ''}`);
}

/* ------------------------------------------------------------------ filters */

function checkboxGroup(title, name, options, selected) {
  if (!options.length) return '';
  return `
  <div class="filter-group">
    <h3 id="filter-${name}">${title}</h3>
    <ul class="filter-list" role="group" aria-labelledby="filter-${name}">
      ${options
        .map(
          (option) => `
        <li>
          <label class="checkbox">
            <input type="checkbox" name="${name}" value="${escapeHtml(option.value)}"
              ${selected.includes(option.value) ? 'checked' : ''}>
            <span>${escapeHtml(option.label)} <span class="muted">(${option.count})</span></span>
          </label>
        </li>`
        )
        .join('')}
    </ul>
  </div>`;
}

function filtersHtml(facets) {
  const categoryOptions = facets.categories.map((c) => ({
    value: c.value,
    count: c.count,
    label: categories.find((cat) => cat.slug === c.value)?.name || c.value.replace(/-/g, ' '),
  }));
  const brandOptions = facets.brands.map((b) => ({
    value: b.value,
    count: b.count,
    label: b.value.replace(/-/g, ' '),
  }));
  const ratingThresholds = [4.5, 4, 3.5, 3];
  const ratingOptions = ratingThresholds.map((value) => ({
    value: String(value),
    label: `${value} and up`,
    count: facets.ratings.filter((r) => Number(r.value) >= value).reduce((sum, r) => sum + r.count, 0),
  }));

  return `
  <div class="filters__inner">
    <div class="filter-group">
      <h3>Price range</h3>
      <div class="range-row">
        <label class="sr-only" for="${'price-min'}">Minimum price</label>
        <input class="input" id="price-min" type="number" min="0" step="1" placeholder="Min" value="${escapeHtml(state.minPrice)}">
        <span aria-hidden="true">–</span>
        <label class="sr-only" for="price-max">Maximum price</label>
        <input class="input" id="price-max" type="number" min="0" step="1" placeholder="Max" value="${escapeHtml(state.maxPrice)}">
      </div>
      <div class="range-row" style="margin-top:.5rem">
        <button type="button" class="btn btn--sm" data-apply-price>Apply price</button>
        <span class="form-note">${facets.price.min.toFixed(0)}–${facets.price.max.toFixed(0)} USD</span>
      </div>
    </div>
    ${checkboxGroup('Category', 'category', categoryOptions, state.category)}
    ${checkboxGroup('Brand', 'brand', brandOptions, state.brand)}
    ${checkboxGroup('Rating', 'rating', ratingOptions, state.rating ? [state.rating] : [])}
    <div class="filter-group">
      <h3>Availability</h3>
      <ul class="filter-list">
        <li>
          <label class="checkbox">
            <input type="checkbox" name="availability" value="in-stock" ${state.availability === 'in-stock' ? 'checked' : ''}>
            <span>In stock only</span>
          </label>
        </li>
        <li>
          <label class="checkbox">
            <input type="checkbox" name="sale" value="1" ${state.sale === '1' ? 'checked' : ''}>
            <span>On sale</span>
          </label>
        </li>
        <li>
          <label class="checkbox">
            <input type="checkbox" name="new" value="1" ${state.new === '1' ? 'checked' : ''}>
            <span>New arrivals</span>
          </label>
        </li>
      </ul>
    </div>
    <button type="button" class="btn btn--ghost btn--block" data-clear-filters>Clear all filters</button>
  </div>`;
}

function renderFilterMounts(facets) {
  const html = filtersHtml(facets);
  document.querySelectorAll('[data-filters-mount]').forEach((mount) => {
    mount.innerHTML = html;
    mount.querySelectorAll('input[type="checkbox"]').forEach((input) => {
      input.addEventListener('change', () => {
        const name = input.name;
        if (name === 'availability' || name === 'sale' || name === 'new') {
          state[name] = input.checked ? input.value : '';
        } else if (name === 'rating') {
          state.rating = input.checked ? input.value : '';
        } else {
          const set = new Set(state[name]);
          if (input.checked) set.add(input.value);
          else set.delete(input.value);
          state[name] = [...set];
        }
        state.page = 1;
        syncUrl();
        load();
      });
    });
    mount.querySelector('[data-apply-price]')?.addEventListener('click', () => {
      state.minPrice = mount.querySelector('#price-min').value;
      state.maxPrice = mount.querySelector('#price-max').value;
      state.page = 1;
      syncUrl();
      load();
    });
    mount.querySelector('[data-clear-filters]')?.addEventListener('click', clearFilters);
  });
}

function clearFilters() {
  Object.assign(state, {
    q: '',
    category: [],
    brand: [],
    minPrice: '',
    maxPrice: '',
    rating: '',
    availability: '',
    sale: '',
    new: '',
    page: 1,
  });
  const searchInput = document.getElementById('shop-search');
  if (searchInput) searchInput.value = '';
  syncUrl();
  load();
}

/* ---------------------------------------------------------------- rendering */

function activeChips() {
  const chips = [];
  if (state.q) chips.push({ label: `“${state.q}”`, clear: () => (state.q = '') });
  state.category.forEach((slug) =>
    chips.push({
      label: categories.find((c) => c.slug === slug)?.name || slug,
      clear: () => (state.category = state.category.filter((c) => c !== slug)),
    })
  );
  state.brand.forEach((slug) =>
    chips.push({ label: slug.replace(/-/g, ' '), clear: () => (state.brand = state.brand.filter((b) => b !== slug)) })
  );
  if (state.rating) chips.push({ label: `${state.rating}+ rating`, clear: () => (state.rating = '') });
  if (state.minPrice || state.maxPrice)
    chips.push({
      label: `$${state.minPrice || 0} – $${state.maxPrice || 'any'}`,
      clear: () => {
        state.minPrice = '';
        state.maxPrice = '';
      },
    });
  if (state.availability) chips.push({ label: 'In stock only', clear: () => (state.availability = '') });
  if (state.sale) chips.push({ label: 'On sale', clear: () => (state.sale = '') });
  if (state.new) chips.push({ label: 'New arrivals', clear: () => (state.new = '') });

  activeFiltersEl.innerHTML = chips.length
    ? chips
        .map(
          (chip, index) =>
            `<span class="chip">${escapeHtml(chip.label)}<button type="button" data-chip="${index}" aria-label="Remove filter ${escapeHtml(chip.label)}">&times;</button></span>`
        )
        .join('') +
      '<button type="button" class="btn--quiet" data-clear-filters style="border:none;background:none;cursor:pointer;color:var(--purple-600);font-size:.82rem">Clear all</button>'
    : '';

  activeFiltersEl.querySelectorAll('[data-chip]').forEach((button) => {
    button.addEventListener('click', () => {
      chips[Number(button.dataset.chip)].clear();
      state.page = 1;
      syncUrl();
      load();
    });
  });
  activeFiltersEl.querySelector('[data-clear-filters]')?.addEventListener('click', clearFilters);
}

function renderPagination(data) {
  if (data.pages <= 1) {
    paginationEl.innerHTML = '';
    return;
  }
  const pages = new Set([1, data.pages, data.page, data.page - 1, data.page + 1]);
  const ordered = [...pages].filter((p) => p >= 1 && p <= data.pages).sort((a, b) => a - b);
  const buttons = [];
  let last = 0;
  ordered.forEach((page) => {
    if (last && page - last > 1) buttons.push('<span aria-hidden="true">…</span>');
    buttons.push(
      `<button type="button" data-page="${page}" ${page === data.page ? 'aria-current="page"' : ''}>${page}</button>`
    );
    last = page;
  });
  paginationEl.innerHTML = `
    <button type="button" data-page="${data.page - 1}" ${data.page === 1 ? 'disabled' : ''} aria-label="Previous page">
      ${icons.arrowLeft}
    </button>
    ${buttons.join('')}
    <button type="button" data-page="${data.page + 1}" ${data.page === data.pages ? 'disabled' : ''} aria-label="Next page">
      ${icons.arrowRight}
    </button>`;
  paginationEl.querySelectorAll('[data-page]').forEach((button) => {
    button.addEventListener('click', () => {
      state.page = Number(button.dataset.page);
      syncUrl();
      load();
      document.getElementById('shop-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

async function load() {
  grid.className = state.view === 'list' ? 'product-list' : 'product-grid product-grid--four';
  grid.innerHTML = skeletonCards(state.view === 'list' ? 4 : 8);
  toolbarCount.textContent = 'Loading products…';

  let data;
  try {
    data = await api.get(`/api/products${query(toQuery())}`);
  } catch (err) {
    grid.className = 'product-grid product-grid--four';
    grid.innerHTML = emptyState({
      title: 'We could not load the catalog',
      text: err.message,
      actionHtml: '<button class="btn" type="button" data-clear-filters>Reset filters</button>',
    });
    grid.querySelector('[data-clear-filters]')?.addEventListener('click', clearFilters);
    toolbarCount.textContent = '';
    return;
  }

  renderFilterMounts(data.facets);
  activeChips();

  toolbarCount.innerHTML = data.total
    ? `<strong>${data.total}</strong> product${data.total === 1 ? '' : 's'}${state.q ? ` for “${escapeHtml(state.q)}”` : ''}`
    : '';

  if (!data.items.length) {
    grid.className = 'product-grid product-grid--four';
    grid.innerHTML = emptyState({
      icon: 'search',
      title: 'No products match these filters',
      text: 'Try widening your price range, clearing a filter, or searching for something else.',
      actionHtml: '<button class="btn" type="button" data-clear-filters>Clear all filters</button>',
    });
    grid.querySelector('[data-clear-filters]')?.addEventListener('click', clearFilters);
    paginationEl.innerHTML = '';
    return;
  }

  grid.innerHTML = data.items.map((product) => productCard(product)).join('');
  renderPagination(data);

  document.getElementById('shop-heading').textContent = state.q
    ? `Search results for “${state.q}”`
    : state.category.length === 1
      ? categories.find((c) => c.slug === state.category[0])?.name || 'Shop'
      : 'Shop all products';

  const single = state.category.length === 1 ? categories.find((c) => c.slug === state.category[0]) : null;
  document.getElementById('shop-description').textContent =
    single?.description || 'Browse every Aurora Skincare product — filter by category, brand, price and rating.';
}

/* ------------------------------------------------------------------ toolbar */

sortSelect.value = state.sort;
sortSelect.addEventListener('change', () => {
  state.sort = sortSelect.value;
  state.page = 1;
  syncUrl();
  load();
});

document.querySelectorAll('[data-view]').forEach((button) => {
  button.setAttribute('aria-pressed', String(button.dataset.view === state.view));
  button.addEventListener('click', () => {
    state.view = button.dataset.view;
    document.querySelectorAll('[data-view]').forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
    syncUrl();
    load();
  });
});

const shopSearch = document.getElementById('shop-search');
shopSearch.value = state.q;
document.getElementById('shop-search-form').addEventListener('submit', (event) => {
  event.preventDefault();
  state.q = shopSearch.value.trim();
  document.getElementById('search-clear').hidden = !state.q;
  state.page = 1;
  syncUrl();
  load();
});
const searchClear = document.getElementById('search-clear');
searchClear.hidden = !state.q;
searchClear.addEventListener('click', () => {
  shopSearch.value = '';
  state.q = '';
  searchClear.hidden = true;
  state.page = 1;
  syncUrl();
  load();
});

mobileFilterButton?.addEventListener('click', () => {
  filterPanel.classList.add('is-open');
  filterPanel.setAttribute('aria-hidden', 'false');
  document.querySelector('[data-scrim]').classList.add('is-open');
  document.body.style.overflow = 'hidden';
});
filterPanel?.addEventListener('click', (event) => {
  if (event.target.closest('[data-close-filters]')) {
    filterPanel.classList.remove('is-open');
    filterPanel.setAttribute('aria-hidden', 'true');
    document.querySelector('[data-scrim]').classList.remove('is-open');
    document.body.style.overflow = '';
  }
});

/* ------------------------------------------------------------ page framing */

document.getElementById('shop-breadcrumbs').innerHTML = breadcrumbs([{ label: 'Shop' }]);
setPageMeta({
  title: state.q ? `Search: ${state.q} — Aurora Skincare` : 'Shop All Beauty & Skincare — Aurora Skincare',
  description:
    'Filter and sort the full Aurora Skincare catalog by category, brand, price and rating — serums, creams, makeup, fragrance, body care and tools.',
  path: '/shop',
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Shop all products',
    url: `${location.origin}/shop`,
  },
});

await load();

/* -------------------------------------------------------- recently viewed */

const recentSection = document.getElementById('recently-viewed-section');
const recent = await recentlyViewed.products().catch(() => []);
if (recent.length) {
  recentSection.hidden = false;
  document.getElementById('recently-viewed-grid').innerHTML = recent
    .map((product) => productCard(product, { quickAdd: false }))
    .join('');
}
