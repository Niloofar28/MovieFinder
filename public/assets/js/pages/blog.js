/**
 * Beauty journal — featured article, category filter, search and article cards.
 */

import { api, escapeHtml, query } from '../api.js';
import { formatDate } from '../store.js';
import { breadcrumbs, emptyState, icons, mountShell, setPageMeta, skeletonCards, toast } from '../ui.js';

await mountShell('/blog');
const root = document.getElementById('blog-root');
document.getElementById('blog-breadcrumbs').innerHTML = breadcrumbs([{ label: 'Blog' }]);

setPageMeta({
  title: 'Beauty Journal — Aurora Skincare',
  description:
    'Skincare routines, ingredient explainers and makeup guides from the Aurora Skincare editorial team.',
  path: '/blog',
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Aurora Skincare Journal',
    url: `${location.origin}/blog`,
  },
});

const state = {
  q: new URLSearchParams(location.search).get('q') || '',
  category: new URLSearchParams(location.search).get('category') || '',
};

function articleCard(post) {
  return `
  <article class="article-card">
    <a class="article-card__media" href="/article?slug=${encodeURIComponent(post.slug)}" aria-label="${escapeHtml(post.title)}">
      <img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.title)}" loading="lazy" decoding="async" width="1200" height="760">
    </a>
    <div class="article-card__body">
      <span class="badge">${escapeHtml(post.category || 'Guides')}</span>
      <h3><a href="/article?slug=${encodeURIComponent(post.slug)}">${escapeHtml(post.title)}</a></h3>
      <p>${escapeHtml(post.excerpt)}</p>
      <span class="article-meta">
        <span>${escapeHtml(post.author || 'Aurora Editorial')}</span>
        <span>${formatDate(post.publishedAt)}</span>
        <span>${post.readingTime} min read</span>
      </span>
    </div>
  </article>`;
}

async function render() {
  root.innerHTML = `<div class="container section"><div class="product-grid product-grid--three">${skeletonCards(3)}</div></div>`;
  let data;
  try {
    data = await api.get(`/api/blog${query(state)}`);
  } catch (err) {
    root.innerHTML = `<div class="container section">${emptyState({
      title: 'We could not load the journal',
      text: err.message,
    })}</div>`;
    return;
  }

  const featured = data.posts.find((post) => post.featured);
  const rest = data.posts.filter((post) => post !== featured);

  root.innerHTML = `
  <div class="container section" style="padding-top:1rem">
    <div class="toolbar">
      <form id="blog-search" style="display:flex;gap:.5rem;flex:1;max-width:420px" role="search">
        <label class="sr-only" for="blog-q">Search articles</label>
        <input class="input" id="blog-q" name="q" type="search" placeholder="Search articles" value="${escapeHtml(state.q)}">
        <button class="btn btn--sm" type="submit">Search</button>
      </form>
      <div class="toolbar__controls">
        <button type="button" class="chip" data-category="" style="cursor:pointer" aria-pressed="${!state.category}">All</button>
        ${data.categories
          .map(
            (category) =>
              `<button type="button" class="chip" data-category="${escapeHtml(category)}" style="cursor:pointer"
                aria-pressed="${state.category === category}">${escapeHtml(category)}</button>`
          )
          .join('')}
      </div>
    </div>

    ${featured ? `<div class="featured-article" style="margin-bottom:2rem">
        <a class="featured-article__media" href="/article?slug=${encodeURIComponent(featured.slug)}">
          <img src="${escapeHtml(featured.image)}" alt="${escapeHtml(featured.title)}" loading="lazy" decoding="async">
        </a>
        <div class="featured-article__body">
          <span class="badge">${escapeHtml(featured.category || 'Featured')}</span>
          <h2 style="font-size:var(--step-3);margin-top:.5rem">
            <a href="/article?slug=${encodeURIComponent(featured.slug)}">${escapeHtml(featured.title)}</a>
          </h2>
          <p class="muted">${escapeHtml(featured.excerpt)}</p>
          <span class="article-meta">
            <span>${escapeHtml(featured.author || 'Aurora Editorial')}</span>
            <span>${formatDate(featured.publishedAt)}</span>
            <span>${featured.readingTime} min read</span>
          </span>
          <p style="margin-top:1rem"><a class="btn" href="/article?slug=${encodeURIComponent(featured.slug)}">Read the article ${icons.arrowRight}</a></p>
        </div>
      </div>` : ''}

    ${
      rest.length
        ? `<div class="product-grid product-grid--three">${rest.map(articleCard).join('')}</div>`
        : featured
          ? ''
          : emptyState({
              icon: 'search',
              title: 'No articles match that search',
              text: 'Try a different keyword or choose another category.',
              actionHtml: '<button class="btn" type="button" data-reset>Show all articles</button>',
            })
    }
  </div>`;

  root.querySelector('#blog-search').addEventListener('submit', (event) => {
    event.preventDefault();
    state.q = event.target.q.value.trim();
    sync();
    render();
  });
  root.querySelectorAll('[data-category]').forEach((button) => {
    button.addEventListener('click', () => {
      state.category = button.dataset.category;
      sync();
      render();
    });
  });
  root.querySelector('[data-reset]')?.addEventListener('click', () => {
    state.q = '';
    state.category = '';
    sync();
    render();
  });
}

function sync() {
  const next = new URLSearchParams();
  if (state.q) next.set('q', state.q);
  if (state.category) next.set('category', state.category);
  history.replaceState({}, '', `/blog${next.toString() ? `?${next}` : ''}`);
}

await render();
