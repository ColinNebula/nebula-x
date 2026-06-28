// Nebula X Service Worker - PWA Support
const CACHE_NAME = 'nebula-x-v1';
const GAME_CACHE = 'nebula-x-game-v1';
const BASE_PATH = new URL('.', self.location.href).pathname;

const withBase = (path) => `${BASE_PATH}${path.replace(/^\//, '')}`;

// Critical assets to cache immediately
const CORE_ASSETS = [
  withBase('/'),
  withBase('/index.html'),
  withBase('/manifest.json'),
  withBase('/nebula-x-logo.png'),
  withBase('/favicon.ico')
];

// Game assets to cache on first use (lazy cache)
const GAME_ASSETS = [
  withBase('/explosions.png'),
  withBase('/explosion2.png'),
  withBase('/nebulax-bg.png'),
  withBase('/game_physics.wasm'),
  withBase('/game_physics.js')
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching core assets');
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch((err) => console.error('Service Worker: Cache failed', err))
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            if (cache !== CACHE_NAME && cache !== GAME_CACHE) {
              console.log('Service Worker: Clearing old cache', cache);
              return caches.delete(cache);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - network first for HTML, cache first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Network first for HTML (always get latest game code)
  if (request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Cache first for game assets (faster loading)
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then((response) => {
            // Cache game assets for offline play
            if (request.method === 'GET' && response.status === 200) {
              const responseClone = response.clone();
              const cacheKey = GAME_ASSETS.some(asset => request.url.includes(asset))
                ? GAME_CACHE
                : CACHE_NAME;

              caches.open(cacheKey).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          });
      })
      .catch(() => {
        // Offline fallback for images
        if (request.destination === 'image') {
          return caches.match(withBase('/nebula-x-logo.png'));
        }
      })
  );
});

// Handle messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => caches.delete(cache))
        );
      })
    );
  }
});
