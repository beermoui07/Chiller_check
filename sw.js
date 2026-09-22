const CACHE = 'chiller-v2-1';
const FILES = [
  './index.html',
  './manifest.json',
  './icon.svg',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      // Cache each file individually so one failed fetch (e.g. offline font)
      // doesn't abort caching of the rest (addAll fails all-or-nothing)
      Promise.all(FILES.map(url => cache.add(url).catch(() => {})))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        // Runtime-cache same-origin GET requests we haven't pre-cached
        if (e.request.method === 'GET' && resp && resp.status === 200) {
          const copy = resp.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, copy)).catch(() => {});
        }
        return resp;
      }).catch(() => cached);
    })
  );
});
