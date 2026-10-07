/**
 * Saved-property state.
 *
 * Persisted in localStorage so it survives navigation and reloads. The store
 * emits a "favorites:change" event on window, which is how the header badge and
 * every property card stay in sync without direct coupling.
 */
import { storage } from './utils.js';

const KEY = 'horizon:favorites';

let ids = storage.get(KEY, []);
if (!Array.isArray(ids)) ids = [];

const emit = () => {
  window.dispatchEvent(new CustomEvent('favorites:change', { detail: { ids: [...ids] } }));
};

export const getFavorites = () => [...ids];
export const isFavorite = (id) => ids.includes(id);
export const countFavorites = () => ids.length;

export function toggleFavorite(id) {
  ids = isFavorite(id) ? ids.filter((item) => item !== id) : [...ids, id];
  storage.set(KEY, ids);
  emit();
  return isFavorite(id);
}
