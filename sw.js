/* ============================================================
   Service worker de Bóveda — deja la app utilizable sin internet
   después de la primera carga. No cachea nada de tus contraseñas:
   esas viven en localStorage, que el navegador ya conserva solo.
   ============================================================ */
const CACHE = 'boveda-v1.4';
const APP_SHELL = [
  './', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png',
  './vendor/fonts/fonts.css',
  './vendor/fonts/geist-latin-wght-normal.woff2', './vendor/fonts/geist-latin-ext-wght-normal.woff2',
  './vendor/fonts/geist-mono-latin-wght-normal.woff2', './vendor/fonts/geist-mono-latin-ext-wght-normal.woff2',
  './vendor/phosphor/regular/style.css', './vendor/phosphor/regular/Phosphor.woff2',
  './vendor/phosphor/fill/style.css', './vendor/phosphor/fill/Phosphor-Fill.woff2',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  if (url.origin === self.location.origin) {
    // archivos de la app: red primero (así llegan las versiones nuevas) y,
    // sin internet, la copia guardada
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // cualquier otra cosa externa: red primero, y si no
  // hay red, lo que se haya guardado de una visita anterior
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
