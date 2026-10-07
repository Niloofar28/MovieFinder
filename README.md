# Horizon Properties

A marketing site for a fictional prime-residential brokerage: 12 listings, a
filterable portfolio, property detail pages with an image viewer, an advisor
team, and working enquiry forms.

## What this is

A static multi-page site — HTML, CSS and native browser ES modules. There is **no
build step, no bundler, no framework and no backend**. `public/` is the entire
publishable site; everything above it in the repo is documentation and sandbox
config.

```
public/
  index.html          Home
  properties.html     Search + filter listing
  property.html       Detail page (?id=<property-id>)
  about.html  services.html  team.html  contact.html
  css/                base (tokens/reset) · layout · components · pages
  js/
    data/properties.js   All content: company, services, advisors, listings
    lib/                 utils · icons · favorites · validate
    components/          header · footer · property-card · carousel ·
                         gallery · modal · enquiry · reveal · toast
    pages/               home · properties · property · services · team · contact
    main.js              Header, footer and shared behaviour on every page
  images/             Photography
  fonts/              Self-hosted Inter + Montserrat (woff2)
```

## Running it

```bash
docker compose -f docker-compose.base44.yml up -d --build
open http://localhost:3000/
```

nginx serves `public/` straight from the working tree, so edits appear on a plain
browser refresh — there is no watch process and no `reload_preview` needed unless
the compose file changes.

## Editing content

Everything user-facing lives in `public/js/data/properties.js`:

- `COMPANY` — name, phone, email, address, social links
- `PROPERTIES` — the listings (title, location, price, specs, gallery, agent)
- `AGENTS` — the advisor team, also used for property detail sidebars
- `SERVICES`, `WHY_US`, `STATS` — homepage and services page copy

Adding a listing to `PROPERTIES` automatically adds it to the homepage carousel
(if `featured: true`), the listing page, its filters and the "similar properties"
rail. New advisors in `AGENTS` appear on the team page and in the header of any
property assigned to them.

## Forms and favourites

There is no server, so:

- Property enquiries, viewing requests and contact messages are validated and
  stored in `localStorage` under `horizon:enquiries`.
- Saved properties live in `localStorage` under `horizon:favorites`, surfaced as
  the header counter and the "Saved only" filter.

To make the forms live, replace the `storage.set` calls in
`public/js/components/enquiry.js` and `public/js/pages/contact.js` with a POST,
and swap the `PROPERTIES` import for a fetch.

## Fonts and images

Fonts are self-hosted from `public/fonts/` (no Google Fonts request, which also
keeps typography working on networks where Google is blocked). Photography is
stored in `public/images/` rather than hotlinked, so the site renders offline.

## Verifying a change

Open the page and check the browser console — the app logs no errors when
healthy. Useful checks:

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/properties.html
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/property.html?id=oceanfront-residence
```

A healthy homepage shows the hero image, a populated "Featured Properties"
carousel and four advisor cards.
