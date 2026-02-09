const CACHE_NAME = 'catatan-v2';
const ASSETS = [
  '/',
  'index.html',
  'manifest.json'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache dibuka');
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Aktifkan Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Menghapus cache lama:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event dengan strategi cache-first
self.addEventListener('fetch', (event) => {
  // Skip untuk request non-GET
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Jika ditemukan di cache, kembalikan
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Jika tidak, fetch dari network
        return fetch(event.request)
          .then(networkResponse => {
            // Jangan cache jika bukan respons yang valid
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            
            // Clone respons untuk disimpan di cache
            const responseToCache = networkResponse.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return networkResponse;
          })
          .catch(() => {
            // Fallback jika offline dan tidak ada di cache
            if (event.request.url.includes('.html')) {
              return caches.match('index.html');
            }
          });
      })
  );
});
