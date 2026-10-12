# AURORA SKINCARE — beauty & skincare storefront

A complete, responsive e-commerce storefront for the fictional brand **Aurora Skincare**: a
static multi-page front end served by a small Express API with a SQLite database.

* **Front end** — plain HTML, CSS and ES modules (no build step). Pages are driven by a shared
  shell (`public/assets/js/ui.js`) and one module per page under `public/assets/js/pages/`.
* **Back end** — `server/` with Express, `better-sqlite3` and a JSON API (`/api/...`).
* **Design tokens** — every colour, type step and spacing value lives in
  `public/assets/css/theme.css`; components and layout live in `public/assets/css/site.css`.

## What the store does

| Area | Status |
| --- | --- |
| Home, shop, category directory, brand directory | Working, data-driven |
| Product detail with gallery, variants, tabs, related products | Working |
| Bag + slide-out drawer, quantities, promo codes, free-shipping progress | Working, persisted in the browser |
| Wishlist and recently viewed | Working, persisted in the browser |
| Checkout with validation, delivery options, order creation | Working demo checkout (see below) |
| Order confirmation and order tracking by number + email | Working |
| Accounts: register, sign in, profile, password, addresses, order history | Working |
| Admin dashboard: products, categories, orders, customers, journal, subscribers, messages, site content | Working, role-protected |
| Beauty journal (blog) with search, categories, table of contents | Working |
| Newsletter sign-up and contact form | Saved to the database |

### Honest limitations (by design)

* **No payment provider is connected.** Checkout is clearly labelled as a demo/test flow, no card
  details are collected and no payment is taken. Orders are still stored with server-validated
  prices and stock so the flow can later be wired to a real provider.
* **Product ratings and rating counts are sample catalog data** for a fictional brand. They are
  labelled as demonstration values on the product page and in the admin area; they are **not**
  verified customer reviews and are not emitted as structured-data ratings.
* **Social destinations, contact details and policy pages are placeholders** until real values are
  entered in the admin area (`Site content`). Sample contact details are labelled as such.
* **Header, footer and catalog content are rendered in the browser** from the API. Core metadata
  (unique titles, descriptions, canonical, Open Graph, Product/Article/Breadcrumb JSON-LD, alt
  text, semantic headings) is implemented per page, but prerendered HTML for crawlers is not — see
  *Deployment* below.
* Images are curated, licence-free stock photography (Pexels) resized and converted to WebP into
  `public/assets/img/`. Replace them with real product photography before launch.

## Running locally

```bash
npm install
npm start          # http://localhost:3000
npm run dev        # same, with --watch (used by the Base44 compose setup)
```

The SQLite database is created on first boot and seeded with the demo catalog, categories, brands,
journal posts, promotional codes and editable site content. Seeding uses `INSERT OR IGNORE`, so
anything you change in the admin dashboard survives a restart.

### Environment variables

| Name | Purpose |
| --- | --- |
| `PORT`, `HOST` | Where the server listens (default `3000` / `0.0.0.0`) |
| `DATABASE_PATH` | SQLite file location (default `data/aurora.db`) |
| `SESSION_SECRET` | HMAC key that signs the session cookie — **replace before deploying** |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Bootstrap administrator, created once on first boot |
| `COOKIE_SECURE` | Set to `1` when the app is served over HTTPS directly |
| `UPLOAD_DIR` | Where admin image uploads are written (default `public/uploads`) |
| `BASE44_PREVIEW_MODE` | Set to `1` by the Base44 sandbox only (see below) |

Promotional codes available in the demo catalog: `AURORA10` (10% off), `WELCOME15` (15% off over
$40), `GLOW20` (20% off over $80), `FREESHIP` (free standard shipping over $30).

## Base44 sandbox environment

`docker-compose.base44.yml` runs the app from the cloned source with dependencies installed from
`package-lock.json` at container start, a named volume for `node_modules`, a named volume for the
SQLite database, and host port 3000 exposed for the preview.

**Sandbox overrides and why they exist**

1. **Live reload** (`server/server.js`) — when `BASE44_PREVIEW_MODE === '1'` (or `NODE_ENV` is not
   `production`) the server injects a small `EventSource('/__reload')` snippet into HTML responses
   and watches `public/` and `server/` for changes. *With the flag unset and `NODE_ENV=production`
   the injection and watcher do not run and pages are served by the normal static handler.*
2. **Cookie security** — the sandbox preview arrives over an HTTPS proxy in front of plain HTTP, so
   `COOKIE_SECURE` defaults to `0`. *Set `COOKIE_SECURE=1` (and nothing else changes) to mark the
   session cookie `Secure` when the app itself terminates TLS.*
3. **No host/origin allowlists were widened.** The Express server does not check `Host` or `Origin`,
   so the rotating sandbox host and the preview origin both work unchanged, and no application
   behaviour is gated on the preview flag beyond the reload helper above.

The compose file reads `./.env.base44-defaults` first and `/run/base44/app.env` last, so
platform-managed values always beat the placeholders committed with the repository.

## Deployment

There is no publishing pipeline in this repository. A deployment needs:

1. A host with Node 20+ (or the provided compose file plus a reverse proxy for TLS).
2. `SESSION_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` and `COOKIE_SECURE=1` set as real values.
3. A persistent volume for the SQLite file (or a swap to Postgres for multi-instance hosting).
4. If search-engine indexing of catalog content matters, add server-side rendering or prerendering
   of the shop/product/article routes — the current pages are client-rendered from the API.

## Repository layout

```
public/                 storefront (HTML pages, CSS, ES modules, images)
  assets/css/theme.css  design tokens
  assets/css/site.css   components, sections, responsive rules
  assets/js/api.js      fetch helpers
  assets/js/store.js    bag, wishlist, recently viewed, session
  assets/js/ui.js       shared shell + reusable components
  assets/js/pages/      one module per page
server/                 Express app, JSON API, SQLite layer
  seed/                 catalog, journal and editable site content
docker-compose.base44.yml  sandbox/dev environment
```
