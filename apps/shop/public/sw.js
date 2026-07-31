/**
 * Jeepo PWA service worker — static caching + Web Push notifications.
 * Never caches API / HTML navigations (avoids stale listings & auth bugs).
 */
const CACHE_VERSION = 'jeepo-static-v2';
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

  if (isApiRequest(url) || url.origin !== self.location.origin) {
    return;
  }

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

self.addEventListener('push', (event) => {
  const fallback = { title: 'جیپو', body: 'پیام جدید', url: '/' };
  let payload = fallback;

  try {
    if (event.data) {
      payload = { ...fallback, ...event.data.json() };
    }
  } catch {
    payload = fallback;
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      dir: 'rtl',
      lang: 'fa',
      tag: payload.tag || 'jeepo',
      data: { url: payload.url || '/' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';
  const absoluteUrl = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          return client.focus().then((focused) => {
            if ('navigate' in focused) {
              return focused.navigate(absoluteUrl);
            }
          });
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(absoluteUrl);
      }
    }),
  );
});
