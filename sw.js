// MỖI LẦN PHÁT HÀNH: đổi số v... bên dưới để máy người chơi tự cập nhật và tự tải lại.
const CACHE_NAME = 'co-tuong-up-network-first-v4';
const EXTERNAL = [
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Noto+Serif:wght@700;900&family=Be+Vietnam+Pro:wght@600;700;800;900&display=swap'
];
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => Promise.all([
      cache.addAll(ASSETS),
      ...EXTERNAL.map((u) => fetch(u, { mode: 'no-cors' }).then((r) => cache.put(u, r)).catch(() => {}))
    ]))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Chiến lược Network-First: Có mạng là kéo bản mới nhất từ web và lưu đè vào Local Cache. Mất mạng mới dùng bản Local.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request, new URL(event.request.url).origin === self.location.origin ? { cache: 'no-cache' } : undefined) // luôn hỏi lại máy chủ, không dùng bản trong cache HTTP của trình duyệt
      .then((networkResponse) => {
        if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque') && event.request.url.startsWith('http')) {
          const cloned = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request, { ignoreSearch: true }))
  );
});
