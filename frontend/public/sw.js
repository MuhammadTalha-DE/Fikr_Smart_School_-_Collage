const CACHE_VERSION = 'fikr-school-v1';
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.webmanifest',
  '/logo.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

const isSameOrigin = (url) => url.origin === self.location.origin;
const isApiRequest = (url) => url.pathname.startsWith('/api/');
const isNavigationRequest = (request) => request.mode === 'navigate';

const putInCache = async (cacheName, request, response) => {
  if (!response || response.status === 206 || response.type === 'opaque') return;

  const cache = await caches.open(cacheName);
  await cache.put(request, response.clone());
};

const networkFirstNavigation = async (request) => {
  try {
    const response = await fetch(request);
    await putInCache(RUNTIME_CACHE, request, response);
    return response;
  } catch {
    const cachedResponse = await caches.match(request);
    return cachedResponse || caches.match('/offline.html');
  }
};

const staleWhileRevalidate = async (request) => {
  const cachedResponse = await caches.match(request);
  const networkResponsePromise = fetch(request)
    .then(async (response) => {
      await putInCache(RUNTIME_CACHE, request, response);
      return response;
    })
    .catch(() => null);

  return cachedResponse || networkResponsePromise || caches.match('/offline.html');
};

const offlineApiResponse = () => new Response(
  JSON.stringify({
    message: 'You are offline. Please reconnect and try again.',
    offline: true,
  }),
  {
    status: 503,
    headers: { 'Content-Type': 'application/json' },
  }
);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => ![APP_SHELL_CACHE, RUNTIME_CACHE].includes(key))
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || !isSameOrigin(url)) {
    return;
  }

  if (isApiRequest(url)) {
    event.respondWith(fetch(request).catch(offlineApiResponse));
    return;
  }

  if (isNavigationRequest(request)) {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
