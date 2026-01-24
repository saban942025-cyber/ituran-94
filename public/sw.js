self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  // מאפשר לאפליקציה לעבוד גם בחיבור איטי
  event.respondWith(fetch(event.request));
});
