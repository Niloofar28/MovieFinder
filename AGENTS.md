# Project notes

## What this is
A static multi-page marketing site (vanilla HTML + CSS + native browser ES
modules). **No build step, no bundler, no framework, no backend, no database.**
`public/` is the entire publishable site; nginx serves it straight from the
working tree via `docker-compose.base44.yml`.

## Running it
```bash
docker compose -f docker-compose.base44.yml up -d --build
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/
```
Edits to anything under `public/` appear on a browser refresh — no watcher, no
rebuild, so `reload_preview` is only needed after a compose change.

## Non-obvious structure
- `docker-compose.base44.yml` mounts **only `./public`** into the web root, so
  new top-level pages must live under `public/`.
- `nginx.base44.conf` is mounted over the default server block purely to send
  `Cache-Control: no-cache, must-revalidate`. Without it the browser reuses
  cached modules after an edit, and because the previous project in this repo
  also published `/js/main.js`, a stale copy silently kills the whole page
  (the header and footer render to nothing, with no visible error). If nav or
  footer ever come up empty, suspect a cached module first, then hard-reload.
- Header and footer are **rendered by JavaScript** (`js/components/header.js`,
  `js/components/footer.js`) into `<header data-header>` / `<footer data-footer>`
  placeholders on every page. One navigation source, but it also means a page
  without JS shows no nav — worth knowing before judging a screenshot.
- `js/main.js` must load **before** the page module on every page: it injects the
  header/footer, wires the favourites sync, the reveal observer and back-to-top.
  Page modules then render their own sections and call `initReveal()` again for
  the nodes they add.
- `js/pages/*.js` are self-contained page entry points; each one bails out
  quietly if its page's host element is absent, so importing them elsewhere is
  harmless.
- Filtering state on `properties.html` is mirrored into the query string
  (`?location=Austin%2C+Texas&beds=4`), so a filtered view is shareable and the
  back button works.

## Content lives in one module
`js/data/properties.js` holds `COMPANY`, `PROPERTIES`, `AGENTS`, `SERVICES`,
`WHY_US`, `STATS` plus the `LOCATIONS` / `TYPES` / `PRICE_BANDS` filter
vocabularies derived from the listings. Adding a property there flows through the
carousel, the listing grid, the filters and the "similar properties" rail with no
markup changes.

## Missing / placeholder content
- `COMPANY.social` points at each platform's homepage — replace with the real
  profile URLs before launch.
- Property enquiries, viewing requests and contact messages are validated and
  written to `localStorage` (`horizon:enquiries`) because there is no server.
  Replace the `storage.set` call with a POST to make them live.
- Photography in `public/images/` came from Unsplash and is used under the
  Unsplash licence; swap in real listing photography before launch.

## Verifying a change
The console should be clean. Useful probes:
```bash
curl -s -o /dev/null -w '%{http_code}\n' 'http://localhost:3000/property.html?id=pacific-glass-house'
docker compose -f docker-compose.base44.yml logs --tail=20 web
```
A healthy homepage shows the hero, a populated featured carousel and four advisor
cards. `property.html` without a valid `?id=` falls back to the first listing
rather than erroring.
