/**
 * Properties listing: search, filters, sorting, saved-only view and paging.
 *
 * Filter state is mirrored into the query string, so a filtered view is
 * shareable and the browser back button behaves.
 */
import { PROPERTIES, LOCATIONS, TYPES, PRICE_BANDS } from '../data/properties.js';
import { propertyCardListHTML } from '../components/property-card.js';
import { initReveal } from '../components/reveal.js';
import { getFavorites, isFavorite } from '../lib/favorites.js';
import { debounce, qs, escapeHtml, plural } from '../lib/utils.js';

const PAGE_SIZE = 6;

const els = {
  form: qs('[data-filters]'),
  search: qs('#filter-search'),
  location: qs('#filter-location'),
  type: qs('#filter-type'),
  price: qs('#filter-price'),
  beds: qs('#filter-beds'),
  baths: qs('#filter-baths'),
  sort: qs('#filter-sort'),
  saved: qs('[data-saved-toggle]'),
  reset: qs('[data-filters-reset]'),
  grid: qs('[data-listing-grid]'),
  count: qs('[data-result-count]'),
  empty: qs('[data-empty-state]'),
  more: qs('[data-load-more]'),
  moreWrap: qs('[data-load-more-wrap]')
};

if (els.grid) {
  /* --- Option lists come from the data, not hardcoded markup ------------- */
  LOCATIONS.forEach((location) =>
    els.location.insertAdjacentHTML('beforeend', `<option value="${escapeHtml(location)}">${escapeHtml(location)}</option>`)
  );
  TYPES.forEach((type) =>
    els.type.insertAdjacentHTML('beforeend', `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`)
  );
  PRICE_BANDS.forEach((band) =>
    els.price.insertAdjacentHTML('beforeend', `<option value="${band.id}">${escapeHtml(band.label)}</option>`)
  );
  [1, 2, 3, 4, 5, 6].forEach((n) =>
    els.beds.insertAdjacentHTML('beforeend', `<option value="${n}">${plural(n, 'bed')}+</option>`)
  );
  [1, 2, 3, 4, 5, 6].forEach((n) =>
    els.baths.insertAdjacentHTML('beforeend', `<option value="${n}">${plural(n, 'bath')}+</option>`)
  );

  let visible = PAGE_SIZE;

  const readState = () => ({
    q: (els.search.value || '').trim().toLowerCase(),
    location: els.location.value,
    type: els.type.value,
    price: els.price.value,
    beds: els.beds.value,
    baths: els.baths.value,
    sort: els.sort.value,
    saved: els.saved.getAttribute('aria-pressed') === 'true'
  });

  const applyState = (state) => {
    els.search.value = state.q || '';
    els.location.value = state.location || '';
    els.type.value = state.type || '';
    els.price.value = state.price || 'any';
    els.beds.value = state.beds || '';
    els.baths.value = state.baths || '';
    els.sort.value = state.sort || 'featured';
    els.saved.setAttribute('aria-pressed', String(!!state.saved));
  };

  const writeUrl = (state) => {
    const params = new URLSearchParams();
    Object.entries(state).forEach(([key, value]) => {
      if (value && value !== 'any' && value !== 'featured') params.set(key, value);
    });
    const query = params.toString();
    window.history.replaceState(null, '', query ? `?${query}` : window.location.pathname);
  };

  const filter = (state) => {
    const band = PRICE_BANDS.find((item) => item.id === state.price) || PRICE_BANDS[0];

    const results = PROPERTIES.filter((property) => {
      if (state.q) {
        const haystack = `${property.title} ${property.location} ${property.type} ${property.tagline}`.toLowerCase();
        if (!haystack.includes(state.q)) return false;
      }
      if (state.location && `${property.city}, ${property.state}` !== state.location) return false;
      if (state.type && property.type !== state.type) return false;
      if (property.price < band.min || property.price > band.max) return false;
      if (state.beds && property.beds < Number(state.beds)) return false;
      if (state.baths && property.baths < Number(state.baths)) return false;
      if (state.saved && !isFavorite(property.id)) return false;
      return true;
    });

    const sorters = {
      featured: (a, b) => Number(b.featured) - Number(a.featured) || a.title.localeCompare(b.title),
      'price-asc': (a, b) => a.price - b.price,
      'price-desc': (a, b) => b.price - a.price,
      'size-desc': (a, b) => b.sqft - a.sqft,
      newest: (a, b) => b.year - a.year
    };
    return results.sort(sorters[state.sort] || sorters.featured);
  };

  const render = () => {
    const state = readState();
    const results = filter(state);
    const shown = results.slice(0, visible);

    els.grid.innerHTML = propertyCardListHTML(shown);
    els.grid.hidden = results.length === 0;
    els.empty.hidden = results.length !== 0;

    els.count.innerHTML = results.length
      ? `Showing <strong>${shown.length}</strong> of <strong>${results.length}</strong> ${
          results.length === 1 ? 'property' : 'properties'
        }`
      : 'No properties match these filters';

    const hasMore = results.length > shown.length;
    els.moreWrap.hidden = !hasMore;

    writeUrl(state);
    initReveal(els.grid);
  };

  const onFilterChange = () => {
    visible = PAGE_SIZE;
    render();
  };

  /* --- Events ------------------------------------------------------------ */
  els.form.addEventListener('submit', (event) => event.preventDefault());
  els.search.addEventListener('input', debounce(onFilterChange, 220));
  [els.location, els.type, els.price, els.beds, els.baths, els.sort].forEach((control) =>
    control.addEventListener('change', onFilterChange)
  );

  els.saved.addEventListener('click', () => {
    const pressed = els.saved.getAttribute('aria-pressed') === 'true';
    els.saved.setAttribute('aria-pressed', String(!pressed));
    onFilterChange();
  });

  els.reset.addEventListener('click', () => {
    applyState({ price: 'any', sort: 'featured', saved: false });
    onFilterChange();
  });

  els.more.addEventListener('click', () => {
    visible += PAGE_SIZE;
    render();
  });

  /* Re-render when a card is saved while the saved-only view is on. */
  window.addEventListener('favorites:change', () => {
    if (els.saved.getAttribute('aria-pressed') === 'true') render();
  });

  /* --- Boot from the query string ---------------------------------------- */
  const params = new URLSearchParams(window.location.search);
  applyState({
    q: params.get('q') || '',
    location: params.get('location') || '',
    type: params.get('type') || '',
    price: params.get('price') || 'any',
    beds: params.get('beds') || '',
    baths: params.get('baths') || '',
    sort: params.get('sort') || 'featured',
    saved: params.get('saved') === '1'
  });

  render();
  initReveal();
}

export const savedCount = () => getFavorites().length;
