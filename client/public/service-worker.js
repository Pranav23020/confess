const CACHE_NAME = 'confessions-cache-v1';
const OFFLINE_URL = '/offline.html';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/static/js/main.js', // Note: actual paths vary by build
  '/static/css/main.css',
  '/manifest.json',
  '/logo192.png',
  '/logo512.png',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests for simple logic
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Network first, then cache for API calls/navigation
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

/**
 * Background Sync Implementation
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-posts') {
    event.waitUntil(syncConfessions());
  }
});

async function syncConfessions() {
  // Logic to read from IndexedDB and POST to /api/confessions
  // This requires a separate utility or shared logic
  console.log('Background sync triggered: sync-posts');
}
