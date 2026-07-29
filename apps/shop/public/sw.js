/**
 * Jeepo PWA service worker — installability + light static caching only.
 * Never caches API / HTML navigations (avoids stale listings & auth bugs).
 */
const CACHE_VERSION = 'jeepo-static-v1';
const STATIC_CACHE = CACHE_VERSION;

const PRECACHE_URLS = [
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/apple-touch-icon.png',
  '/favicon-32x32.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== STATIC_CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

function isApiRequest(url) {
  return url.pathname.startsWith('/api') || url.hostname.includes('api.');
}

function isStaticAsset(url) {
  if (url.origin !== self.location.origin) return false;
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/fonts/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/favicon.ico' ||
    url.pathname === '/favicon-32x32.png' ||
    url.pathname === '/apple-touch-icon.png' ||
    url.pathname === '/logo.png'
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // Always network for API and cross-origin (payments, Telegram, etc.)
  if (isApiRequest(url) || url.origin !== self.location.origin) {
    return;
  }

  // Navigations: network-only (fresh pages; no offline HTML shell to avoid confusion)
  if (request.mode === 'navigate') {
    return;
  }

  if (!isStaticAsset(url)) {
    return;
  }

  event.respondWith(
    caches.open(STATIC_CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      const networkPromise = fetch(request)
        .then((response) => {
          if (response.ok) {
            void cache.put(request, response.clone());
          }
          return response;
        })
        .catch(() => cached);
      return cached || networkPromise;
    }),
  );
});
