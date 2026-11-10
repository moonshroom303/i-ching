#!/usr/bin/env node
// Packs the app into ONE self-contained HTML file (fonts, data and scripts inlined).
// Handy for hosting on any static web space or for opening directly in a browser.
// Usage: node scripts/build-web.mjs   → dist-web/wandlungen.html
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const appDir = path.join(root, 'app');
const read = (p) => fs.readFileSync(path.join(appDir, p), 'utf8');
const b64 = (p) => fs.readFileSync(path.join(appDir, p)).toString('base64');

let html = read('index.html');

// The inline build cannot keep the strict script-src policy of the desktop app.
html = html.replace(/\s*<meta http-equiv="Content-Security-Policy"[^>]*>/, '');

// No manifest or service worker in the single-file build.
html = html.replace(/\s*<link rel="(manifest|apple-touch-icon)" href="[^"]+">/g, '');
html = html.replace('<body>', '<body>\n  <script>window.WANDLUNGEN_SINGLE_FILE = true;</script>');

html = html.replace(/<link rel="icon" href="([^"]+)" type="image\/svg\+xml">/, (_m, href) =>
  `<link rel="icon" href="data:image/svg+xml;base64,${b64(href)}" type="image/svg+xml">`);

html = html.replace(/<link rel="stylesheet" href="([^"]+)">/, (_m, href) => {
  const cssDir = path.dirname(href);
  const css = read(href).replace(/url\('([^']+\.woff)'\)/g, (_u, font) =>
    `url('data:font/woff;base64,${b64(path.join(cssDir, font))}')`);
  return `<style>\n${css}\n</style>`;
});

html = html.replace(/<script src="([^"]+)"><\/script>/g, (_m, src) =>
  `<script>\n${read(src).replace(/<\/script/gi, '<\\/script')}\n</script>`);

const outDir = path.join(root, 'dist-web');
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, 'wandlungen.html');
fs.writeFileSync(out, html);
console.log(`wrote ${path.relative(root, out)} (${(html.length / 1024 / 1024).toFixed(2)} MB)`);
