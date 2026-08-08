// A simple Service Worker to satisfy Chrome's PWA install requirement
self.addEventListener('install', (e) => {
    console.log('[Service Worker] Installed');
});

self.addEventListener('activate', (e) => {
    console.log('[Service Worker] Activated');
});

self.addEventListener('fetch', (e) => {
    // This allows the app to work normally while connected to the internet
    e.respondWith(fetch(e.request).catch(() => console.log("Network error.")));
});
