/**
 * Journal article page — table of contents, article body, related products and
 * related articles.
 */

import { api, escapeHtml } from '../api.js';
import { formatDate } from '../store.js';
import {
  breadcrumbs,
  emptyState,
  icons,
  mountShell,
  productCard,
  setPageMeta,
} from '../ui.js';

await mountShell('/blog');
const root = document.getElementById('article-root');
const slug = new URLSearchParams(location.search).get('slug');

if (!slug) {
  root.innerHTML = `<div class="container section">${emptyState({
    icon: 'info',
    title: 'Article not found',
    text: 'That link is missing an article name.',
    actionHtml: '<a class="btn" href="/blog">Back to the journal</a>',
  })}</div>`;
} else {
  let data;
  try {
    data = await api.get(`/api/blog/${encodeURIComponent(slug)}`);
  } catch (err) {
    root.innerHTML = `<div class="container section">${emptyState({
      icon: 'info',
      title: 'We could not find that article',
      text: err.message,
      actionHtml: '<a class="btn" href="/blog">Back to the journal</a>',
    })}</div>`;
    throw new Error('done');
  }

  const { post, relatedProducts, relatedPosts } = data;

  root.innerHTML = `
  <div class="container" style="padding-top:1rem">
    ${breadcrumbs([{ label: 'Blog', href: '/blog' }, { label: post.title }])}
  </div>
  <article class="container section" style="padding-top:1rem;max-width:900px">
    <span class="badge">${escapeHtml(post.category || 'Guides')}</span>
    <h1 style="font-size:var(--step-4);margin-top:.6rem">${escapeHtml(post.title)}</h1>
    <p class="article-meta" style="margin-bottom:1.25rem">
      <span>By ${escapeHtml(post.author || 'Aurora Editorial')}</span>
      <span>${formatDate(post.publishedAt)}</span>
      <span>${post.readingTime} min read</span>
    </p>
    <img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.title)}" width="1200" height="760"
      style="border-radius:var(--radius-md);margin-bottom:1.5rem" fetchpriority="high" decoding="async">
    <div class="toc" id="article-toc" hidden>
      <h2>In this article</h2>
      <ol></ol>
    </div>
    <div class="prose" id="article-body">${post.body}</div>
    <p class="form-note" style="margin-top:1.5rem">
      Beauty content on this site is general cosmetic information, not medical advice. Patch-test new products and
      speak to a dermatologist about persistent skin concerns.
    </p>
  </article>

  ${
    relatedProducts.length
      ? `<section class="section section--soft">
          <div class="container">
            <div class="section-head"><h2>Products in this article</h2>
              <a class="section-link" href="/shop">Shop all ${icons.arrowRight}</a></div>
            <div class="product-grid product-grid--four">${relatedProducts
              .slice(0, 4)
              .map((product) => productCard(product))
              .join('')}</div>
          </div>
        </section>`
      : ''
  }

  ${
    relatedPosts.length
      ? `<section class="section">
          <div class="container">
            <div class="section-head"><h2>More from the journal</h2>
              <a class="section-link" href="/blog">All articles ${icons.arrowRight}</a></div>
            <div class="product-grid product-grid--three">
              ${relatedPosts
                .map(
                  (related) => `
                <article class="article-card">
                  <a class="article-card__media" href="/article?slug=${encodeURIComponent(related.slug)}">
                    <img src="${escapeHtml(related.image)}" alt="${escapeHtml(related.title)}" loading="lazy">
                  </a>
                  <div class="article-card__body">
                    <span class="badge">${escapeHtml(related.category || 'Guides')}</span>
                    <h3><a href="/article?slug=${encodeURIComponent(related.slug)}">${escapeHtml(related.title)}</a></h3>
                    <span class="article-meta"><span>${related.readingTime} min read</span></span>
                  </div>
                </article>`
                )
                .join('')}
            </div>
          </div>
        </section>`
      : ''
  }`;

  document.getElementById('article-breadcrumbs-placeholder')?.remove();

  // Table of contents from the article's own h2 headings.
  const headings = [...document.querySelectorAll('#article-body h2')];
  if (headings.length > 2) {
    const toc = document.getElementById('article-toc');
    const list = toc.querySelector('ol');
    headings.forEach((heading, index) => {
      if (!heading.id) heading.id = `section-${index + 1}`;
      const item = document.createElement('li');
      item.innerHTML = `<a href="#${heading.id}">${escapeHtml(heading.textContent)}</a>`;
      list.appendChild(item);
    });
    toc.hidden = false;
  }

  setPageMeta({
    title: `${post.title} — Aurora Skincare Journal`,
    description: post.excerpt,
    path: `/article?slug=${post.slug}`,
    image: post.image,
    type: 'article',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.excerpt,
      image: [new URL(post.image, location.origin).href],
      author: { '@type': 'Person', name: post.author || 'Aurora Editorial' },
      publisher: { '@type': 'Organization', name: 'Aurora Skincare' },
      datePublished: post.publishedAt,
      mainEntityOfPage: new URL(`/article?slug=${post.slug}`, location.origin).href,
    },
  });
}
