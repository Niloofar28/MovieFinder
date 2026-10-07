/**
 * Inline SVG icon set.
 *
 * Kept in one place so markup stays free of icon markup soup, and so the site
 * ships no icon-font dependency. All icons inherit `currentColor`.
 */
const svg = (paths, extra = '') =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" ${extra}>${paths}</svg>`;

export const icons = {
  phone: svg('<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.8 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.4 1.8.7 2.8.8a2 2 0 0 1 1.7 2z"/>'),
  mail: svg('<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/>'),
  pin: svg('<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>'),
  clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  arrowRight: svg('<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>'),
  arrowLeft: svg('<path d="M19 12H5"/><path d="m11 18-6-6 6-6"/>'),
  arrowUp: svg('<path d="M12 19V5"/><path d="m6 11 6-6 6 6"/>'),
  chevronLeft: svg('<path d="m15 18-6-6 6-6"/>'),
  chevronRight: svg('<path d="m9 6 6 6-6 6"/>'),
  heart: svg('<path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 1 0-7.1 7.1l8.8 8.8 8.8-8.8a5 5 0 0 0 0-7.1z"/>'),
  bed: svg('<path d="M3 18v-6a2 2 0 0 1 2-2h11a3 3 0 0 1 3 3v5"/><path d="M3 18h18"/><path d="M7 10V7a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v3"/>'),
  bath: svg('<path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3z"/><path d="M6 12V6a2 2 0 0 1 4 0"/><path d="M6 19l-1 2"/><path d="M18 19l1 2"/>'),
  area: svg('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 16V8h8v8"/>'),
  expand: svg('<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M16 3h3a2 2 0 0 1 2 2v3"/><path d="M21 16v3a2 2 0 0 1-2 2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/>'),
  close: svg('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'),
  check: svg('<path d="m20 6-11 11-5-5"/>'),
  calendar: svg('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 11h18"/>'),
  key: svg('<circle cx="8" cy="15" r="4"/><path d="m10.8 12.2 8-8"/><path d="m17 4 3 3"/><path d="m14 7 3 3"/>'),
  search: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  slider: svg('<path d="M4 6h16M7 12h10M10 18h4"/>'),
  building: svg('<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/>'),
  instagram: svg('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/>'),
  facebook: svg('<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v2H7v4h3v8h4v-8h3l1-4h-4V8.5A.5.5 0 0 1 14 8z"/>'),
  linkedin: svg('<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7 10v7"/><path d="M11 17v-4a2 2 0 0 1 4 0v4"/><circle cx="7" cy="7" r="0.6" fill="currentColor"/>'),
  youtube: svg('<rect x="2" y="5" width="20" height="14" rx="4"/><path d="m11 9 4 3-4 3z"/>'),
  star: svg('<path d="m12 3 2.6 5.6 6 .8-4.4 4.2 1.1 6L12 16.9 6.7 19.6l1.1-6L3.4 9.4l6-.8z"/>')
};

/** The brand mark: a minimal horizon / roofline drawn with three rules. */
export const brandMark = `
  <svg class="brand__mark" viewBox="0 0 40 40" fill="none" aria-hidden="true" focusable="false">
    <path class="mark-line" d="M4 30h32" stroke-width="1.6"/>
    <path class="mark-line" d="M7 30 20 9l13 21" stroke-width="2"/>
    <path class="mark-line" d="M13 30V20h14v10" stroke-width="1.4"/>
    <circle class="mark-fill" cx="20" cy="25" r="2"/>
  </svg>`;

export const brand = (extraClass = '') => `
  <a class="brand ${extraClass}" href="index.html" aria-label="Horizon Properties — home">
    ${brandMark}
    <span class="brand__text">
      <span class="brand__name">Horizon Properties</span>
      <span class="brand__sub">Estates</span>
    </span>
  </a>`;
