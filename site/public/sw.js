const CACHE = 'color-meaning-lens-v1';
const SHELL = ['/', '/privacy/', '/terms/', '/assets/inspection-proof-420.avif', '/assets/inspection-proof-720.avif', '/assets/inspection-proof-720.webp', '/assets/inspection-proof.webp'];
self.addEventListener('install', (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', (event) => { if (event.request.method !== 'GET' || new URL(event.request.url).origin !== location.origin) return; event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => { const copy = response.clone(); caches.open(CACHE).then((cache) => cache.put(event.request, copy)); return response; }))); });
