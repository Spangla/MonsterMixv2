const CACHE_PREFIX = 'MonsterMixv2-';
const CACHE_NAME = `${CACHE_PREFIX}v2`; // bump version when updating files

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './pricing.js',
  './manifest.json',
  './icon-192-beta.png',
  './icon-512-beta.png'
];

// Install event: cache essential files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate event: clean up old caches if needed
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch event: serve cached files when offline
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' ||
      !event.request.url.startsWith(self.registration.scope)) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const response = await cache.match(event.request);
      return response || fetch(event.request);
    })
  );
});
