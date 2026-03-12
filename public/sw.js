// Self-destructing Service Worker to fix aggressive caching issues
// This immediately purges old caches and grabs the latest files from the network.

self.addEventListener('install', (e) => {
    // Force the new service worker to activate immediately
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    // Delete all existing caches when activated
    e.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    return caches.delete(cacheName);
                })
            );
        }).then(() => {
            // Take control of all clients immediately
            self.clients.claim();
        })
    );
});

self.addEventListener('fetch', (e) => {
    // Bypass service worker cache completely, fetch from network
    e.respondWith(fetch(e.request));
});
