const CACHE_NAME = 'exama-offline-cache-v1';

// Files to cache immediately when the app installs
const INITIAL_CACHE = [
    '/',
    '/index.html'
];

// 1. INSTALL EVENT
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installed');
    
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Caching App Shell');
            return cache.addAll(INITIAL_CACHE);
        })
    );
    // Force the waiting service worker to become the active service worker.
    self.skipWaiting();
});

// 2. ACTIVATE EVENT
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activated');
    
    // Clean up old caches if the CACHE_NAME changes
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Removing old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// 3. FETCH EVENT (The Mixed Logic)
self.addEventListener('fetch', (event) => {
    // We only want to cache GET requests (Ignore Firebase POST/PUT saves)
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // A. If the file is already in the cache, serve it instantly
            if (cachedResponse) {
                return cachedResponse;
            }

            // B. If not in cache, fetch it from the network normally
            return fetch(event.request).then((networkResponse) => {
                // Ensure the response is valid before caching
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
                    return networkResponse;
                }

                // Clone the response because streams can only be read once
                const responseToCache = networkResponse.clone();

                // Save this new file (like Tailwind or a new image) to the cache
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return networkResponse;
            }).catch(() => {
                // C. THIS HAPPENS WHEN OFFLINE (Your original catch logic)
                console.log("[Service Worker] Network error. Serving offline fallback.");
                
                // If the user is trying to navigate to a page while offline, force load the cached index.html
                if (event.request.mode === 'navigate') {
                    return caches.match('/index.html');
                }
            });
        })
    );
});
