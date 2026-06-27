// ════════════════════════════════════════════════════════
// Service Worker — caches all game assets for offline play
// and PWA installability. Bump CACHE_NAME on every release
// to force clients to pick up new files.
// ════════════════════════════════════════════════════════

const CACHE_NAME = 'baldys-escape-v1';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/constants.js',
  './js/rng.js',
  './js/audio.js',
  './js/player.js',
  './js/obstacles.js',
  './js/levelgen.js',
  './js/particles.js',
  './js/renderer.js',
  './js/save.js',
  './js/engine.js',
  './js/ui.js',
  './js/main.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-192-maskable.png',
  './icons/icon-512-maskable.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Cache-first for game assets, falling back to network, then caching the response.
// Google Fonts (cross-origin) are left to the network/browser cache — not intercepted.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return; // let cross-origin (fonts) pass through normally

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => cached);
    })
  );
});
