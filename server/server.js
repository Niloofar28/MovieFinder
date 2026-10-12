'use strict';
/**
 * AURORA SKINCARE — application server.
 *
 * Serves the static storefront, the JSON API and (outside production) a small
 * live-reload channel so edits appear in the preview without a rebuild.
 */

const express = require('express');
const fs = require('fs');
const path = require('path');

const { router: api, attachUser } = require('./api');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const DEV = process.env.NODE_ENV !== 'production' || process.env.BASE44_PREVIEW_MODE === '1';

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(attachUser);
app.use('/api', api);
app.use('/uploads', express.static(path.join(PUBLIC_DIR, 'uploads'), { maxAge: DEV ? 0 : '7d' }));
app.use('/assets', express.static(path.join(PUBLIC_DIR, 'assets'), { maxAge: DEV ? 0 : '7d' }));

/* ------------------------------------------------------------- live reload */

const reloadClients = new Set();

if (DEV) {
  app.get('/__reload', (req, res) => {
    res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    res.flushHeaders?.();
    res.write('retry: 1500\n\n');
    reloadClients.add(res);
    req.on('close', () => reloadClients.delete(res));
  });

  const broadcast = () => reloadClients.forEach((client) => client.write('data: reload\n\n'));
  const watchTargets = [PUBLIC_DIR, path.join(__dirname)];
  watchTargets.forEach((target) => {
    try {
      fs.watch(target, { recursive: true }, (_event, filename) => {
        if (!filename) return;
        if (/\.(html|css|js|svg|webp|json)$/i.test(filename) && !filename.includes('uploads')) broadcast();
      });
    } catch (err) {
      console.warn(`[server] file watching unavailable for ${target}: ${err.message}`);
    }
  });

  const RELOAD_SNIPPET = `<script>(function(){try{var s=new EventSource('/__reload');s.onmessage=function(){location.reload();};}catch(e){}})();</script>`;
  const withReload = (html) => (html.includes('</body>') ? html.replace('</body>', `${RELOAD_SNIPPET}</body>`) : html + RELOAD_SNIPPET);

  // Read HTML from disk each request so edits are always visible in development.
  app.use((req, res, next) => {
    if (req.method !== 'GET' || path.extname(req.path)) return next();
    const clean = req.path === '/' ? 'index' : req.path.replace(/^\/+|\/+$/g, '');
    if (!/^[a-z0-9-]+$/.test(clean)) return next();
    const file = path.join(PUBLIC_DIR, `${clean}.html`);
    if (!fs.existsSync(file)) return next();
    const html = withReload(fs.readFileSync(file, 'utf8'));
    res.set('Content-Type', 'text/html; charset=utf-8').send(html);
  });
}

/* ------------------------------------------------------- static storefront */

app.use(express.static(PUBLIC_DIR, { extensions: ['html'], index: 'index.html' }));

app.use((req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Unknown endpoint.' });
  const notFound = path.join(PUBLIC_DIR, '404.html');
  if (fs.existsSync(notFound)) return res.status(404).sendFile(notFound);
  res.status(404).send('Not found');
});

app.use((err, _req, res, _next) => {
  console.error('[server] unhandled error', err);
  res.status(500).json({ error: 'Unexpected server error.' });
});

const server = app.listen(PORT, HOST, () => {
  console.log(`[server] Aurora Skincare running on http://${HOST}:${PORT} (dev=${DEV})`);
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT', () => server.close(() => process.exit(0)));
