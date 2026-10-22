// Escape the Police: Cyber Pursuit - Service Worker
// Version: 2.5.0
// High-Performance Asset Caching for Offline PWA & Android TWA / APK Wrapper

const CACHE_NAME = 'escape-police-v2.5.0';

// Core static assets to precache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/cyber_pursuit_logo.jpg',
  '/cyberpunk_lobby_bg.jpg',
  '/assets/garage_cyber_hangar.jpg',
  '/assets/cyberpunk_police_roadblock.jpg',
  '/assets/police_busted_bg.jpg',
  '/maps/kota.jpg',
  '/maps/hutan.jpg',
  '/maps/salju.jpg',
  '/maps/padang_pasir.jpg',
  '/maps/pegunungan.jpg',
  '/difficulties/santai.jpg',
  '/difficulties/normal.jpg',
  '/difficulties/sulit.jpg',
  '/difficulties/maxxx.jpg'
];

// Install Event: Precaches core game assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use map with catch so missing optional files don't fail the whole service worker install
      return Promise.allSettled(
        PRECACHE_ASSETS.map((asset) =>
          cache.add(asset).catch((err) => {
            console.warn(`[SW] Precache non-critical notice for ${asset}:`, err.message);
          })
        )
      );
    })
  );
});

// Activate Event: Purges stale cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((staleName) => {
            console.log(`[SW] Purging outdated cache: ${staleName}`);
            return caches.delete(staleName);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event Strategy:
// - Navigation requests (HTML): Network-first with Cache fallback
// - Static assets (JS, CSS, Images, Audio, Fonts): Cache-first with Network background sync
// - API and WebSocket requests (/api/*, socket.io): Pass through network
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Bypass non-GET requests and WebSocket / Socket.io / API endpoints
  if (
    request.method !== 'GET' ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/socket.io/') ||
    url.protocol.startsWith('ws')
  ) {
    return;
  }

  // 1. Navigation requests (Page reloads, deep links) -> Network-First
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          return caches.match('/');
        })
    );
    return;
  }

  // 2. Static Assets (Scripts, Styles, Images, Fonts, Audio) -> Cache-First with Stale-While-Revalidate
  const isStaticAsset =
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/maps/') ||
    url.pathname.startsWith('/difficulties/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.woff2');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Default fallback
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
