const CACHE_PREFIX = 'MonsterMixv2-';
const CACHE_NAME = `${CACHE_PREFIX}v12`; // bump this and the asset query versions together

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css?v=12',
  './script.js?v=12',
  './pricing.js?v=12',
  './price-image.js?v=12',
  './install.js?v=12',
  './brand-wordmark.jpeg',
  './manifest.json?v=12',
  './icon-192-beta.png',
  './icon-512-beta.png'
];

// Install event: cache essential files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(
      ASSETS_TO_CACHE.map(url => new Request(new URL(url, self.registration.scope), { cache: 'reload' }))
    ))
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
      return response || fetch(event.request).catch(async (error) => {
        if (event.request.mode === 'navigate') {
          const page = await cache.match(new URL('./index.html', self.registration.scope));
          if (page) return page;
        }
        throw error;
      });
    })
  );
});
