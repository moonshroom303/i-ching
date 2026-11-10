/* Wandlungen – service worker: makes the web version work offline once it has been opened.
 * Only used when the app is served over https (GitHub Pages or any web space).
 * SPDX-License-Identifier: MIT */
'use strict';

const CACHE = 'wandlungen-1.0.0';
const FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './js/core.js',
  './js/i18n.js',
  './js/about.js',
  './js/app.js',
  './data/common.js',
  './data/de.js',
  './data/en.js',
  './fonts/Alegreya-VF.woff',
  './fonts/Alegreya-Italic-VF.woff',
  './fonts/AlegreyaSans-Regular.woff',
  './fonts/AlegreyaSans-Medium.woff',
  './fonts/AlegreyaSans-Bold.woff',
  './img/icon.svg',
  './img/icon-192.png',
  './img/icon-512.png',
  './img/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('wandlungen-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Answer from the cache at once and refresh the cache in the background,
// so a new version arrives on the next start while the app always works offline.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const hit = await cache.match(req, { ignoreSearch: true });
      const refresh = fetch(req)
        .then((res) => { if (res && res.ok) cache.put(req, res.clone()); return res; })
        .catch(() => null);
      if (hit) {
        event.waitUntil(refresh);
        return hit;
      }
      return (await refresh) || (await cache.match('./index.html'));
    })
  );
});
