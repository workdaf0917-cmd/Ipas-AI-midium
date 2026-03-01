// Service Worker for iPAS AI Quiz App - Offline Support
const CACHE_NAME = 'ipas-ai-quiz-v1';
const urlsToCache = [
  './exam_offline.html',
  './manifest.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache opened');
        return cache.addAll(urlsToCache);
      })
      .catch((err) => {
        console.log('Cache failed:', err);
      })
  );
  // Force activation
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control immediately
  self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        return fetch(event.request)
          .then((response) => {
            // Don't cache if not a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            // Clone the response
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            return response;
          })
          .catch(() => {
            // Return offline fallback if available
            console.log('Fetch failed, serving from cache or offline');
          });
      })
  );
});

// Background sync for data persistence (if needed later)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-quiz-data') {
    event.waitUntil(syncQuizData());
  }
});

// Push notification support (optional)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : '測驗提醒',
    icon: './icon-192.png',
    badge: './icon-72.png',
    vibrate: [100, 50, 100],
    data: {
      url: './exam_offline.html'
    }
  };
  event.waitUntil(
    self.registration.showNotification('iPAS AI考古題', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
