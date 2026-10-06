# Project notes

## What this is
A static Persian (fa/rtl) movie browser built on vanilla HTML, CSS and browser
ES modules. There is **no build step, no bundler, no backend and no database**.
The pages at the repo root call The Movie Database (TMDb) API straight from the
browser, so the "app" only needs a static file server.

## Running it
```bash
docker compose -f docker-compose.base44.yml up -d --build
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/
```
nginx serves the bind-mounted working tree, so source edits are picked up on a
plain browser refresh — there is no watch process and no `reload_preview` needed
unless the compose file itself changes.

## Non-obvious layout facts
Every page at the repo root depends on three paths that are not obvious from the
HTML alone:
- `js/*.js` — the ES modules listed via `<script type="module">` in each page.
- `css/style.css` — all styling.
- `components/header.html` and `components/footer.html` — fetched at runtime by
  `loadCommonComponents()` in `js/utils.js` and injected into the empty
  `<header class="main-header">` / `<footer class="main-footer">` placeholders.
  A page renders with an empty header/footer if this path is wrong.

Historically these files were stored as `style.css`, `header.html`,
`footer.html` at the repo root, and the `js/` modules were only on the `js`
branch, while the HTML already referenced `css/`, `js/` and `components/`. The
files have been placed where the markup expects them; keep them there.

## External service / key
`js/api.js` contains a hardcoded TMDb API key (`TMDB_API_KEY`) and calls
`https://api.themoviedb.org/3` directly from the browser (TMDb sends permissive
CORS headers). Because requests originate in the visitor's browser, the machine
viewing the preview must be able to reach `api.themoviedb.org` and
`image.tmdb.org` — a network/geo block there shows up as the app's error banner,
not as a server failure. Rotating that key would require editing `js/api.js`.

## Missing assets (never committed to git)
These paths are referenced but do not exist in any branch, so they 404:
- `images/film.jpg` — hero background (`.hero-section` in `css/style.css`).
  Without it the hero heading is white text on the page background.
- `images/blue_short.svg` — header logo.
- `imges/placeholder.jpg`, `imges/placeholder-actor.jpg` — fallback posters.

They are cosmetic only; the app functions without them. `docker-compose.base44.yml`
does not mount `images/` or `imges/` yet — add the mounts if those folders are
ever added to the repo.

## Verifying a change
The app is data-driven from TMDb, so a healthy page shows a populated movie grid
(in Persian) rather than an error banner. Check the browser console for
`❌`-prefixed errors — the code logs its failures to the console.
