const CACHE_NAME = "taller-lyl-v1";
const urlsToCache = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js"
];

// Instalar el motor y guardar los archivos básicos
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Interceptar las peticiones para que cargue rapidísimo
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
