const CACHE = 'project-restroom-v1';

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll(['/', '/manifest.json', '/icon.svg'])
    )
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.url.startsWith('https://api.openstreetmap.org')) return;
  if (e.request.url.startsWith('https://nominatim.openstreetmap.org')) return;
  if (e.request.url.startsWith('https://tile.openstreetmap.org')) {
    e.respondWith(
      caches.match(e.request).then((r) => {
        const fetchPromise = fetch(e.request).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then((cache) => cache.put(e.request, clone));
          }
          return res;
        });
        return r || fetchPromise;
      })
    );
    return;
  }
  e.respondWith(
    caches.match(e.request)
      .then((r) => r || fetch(e.request))
      .catch(() => fetch(e.request))
  );
});
