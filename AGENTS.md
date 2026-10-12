# Working notes — AURORA SKINCARE

Only the non-obvious things. Setup details live in `README.md`, run configuration in
`docker-compose.base44.yml` and `.base44/environment.json`.

## Run it

`docker compose -f docker-compose.base44.yml up -d --build` → storefront + JSON API on
<http://localhost:3000>. Health: `GET /api/health`. Dependencies install from the lockfile at
container start; SQLite lives on the `aurora_data` volume.

## Gotchas

- **The storefront is multi-document, not an SPA.** Every page is its own `.html` file with its own
  entry module under `public/assets/js/pages/`; `/shop`, `/checkout`, `/admin` … are served by
  `express.static(..., { extensions: ['html'] })`. There is no client-side router, so a
  pushState-style navigation does **not** load another page — links and verification need a real
  document load per page.
- **`body { overflow-x: hidden }` hides horizontal overflow**, so an over-wide row is clipped
  instead of scrollable. When checking layout, compare `documentElement.scrollWidth` with
  `clientWidth` rather than looking for a scrollbar. The header row must fit inside the
  `.container` side padding at 375px (its controls shrink at ≤640px, and the wordmark drops to
  "AURORA" at ≤640px via `.brand-tail`).
- The header is sticky and gains `backdrop-filter` when scrolled, which makes it a containing block
  for `position: fixed` descendants. Overlays (cart drawer, search panel, off-canvas menu) are
  therefore mounted on `document.body`, never inside the header.
- Bootstrap administrator comes from the env: `ADMIN_EMAIL` / `ADMIN_PASSWORD` (dev default
  `admin@auroraskincare.example` / `aurora-admin-demo` in `.env.base44-defaults`). Admin UI at
  `/admin`; every `/api/admin/*` route re-checks the role server-side, so the page shows its login
  form to anyone else. `SESSION_SECRET` is required at boot, `ADMIN_PASSWORD` is not.
- **Orders cannot be deleted** through the API or the admin UI — only their status can change
  (`PATCH /api/admin/orders/:id`). Never place a throwaway order you are not willing to leave
  behind: it will stay visible in the admin dashboard.

## Quick manual check

`curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/health` → `200`, then load `/`,
`/shop` (filter + sort), `/checkout` (bag → order → `/order?number=…`) and `/admin` (sign in).
