const CACHE = 'shiftpulse-v2';

const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/manifest.json',
  '/assets/icons/icon-192.svg',
  '/assets/icons/icon-512.svg',
  '/js/app.js',
  '/js/shared/eventBus.js',
  '/js/shared/dom.js',
  '/js/shared/config.js',
  '/js/shared/router.js',
  '/js/infrastructure/storage/localStore.js',
  '/js/infrastructure/storage/eventStore.js',
  '/js/infrastructure/notifications/notifier.js',
  '/js/infrastructure/geolocation/browserGeo.js',
  '/js/infrastructure/i18n/index.js',
  '/js/infrastructure/auth/index.js',
  '/js/infrastructure/auth/anon.js',
  '/js/core/clock.js',
  '/js/core/geofence.js',
  '/js/core/shifts.js',
  '/js/core/time.js',
  '/js/application/clockService.js',
  '/js/application/attendanceService.js',
  '/js/application/settingsService.js',
  '/js/features/navigation/index.js',
  '/js/features/navigation/controller.js',
  '/js/features/navigation/view.js',
  '/js/features/theme/index.js',
  '/js/features/theme/controller.js',
  '/js/features/theme/view.js',
  '/js/features/locale/index.js',
  '/js/features/locale/controller.js',
  '/js/features/locale/view.js',
  '/js/features/clock/index.js',
  '/js/features/clock/controller.js',
  '/js/features/clock/view.js',
  '/js/features/quickLog/index.js',
  '/js/features/quickLog/controller.js',
  '/js/features/quickLog/view.js',
  '/js/features/dashboard/index.js',
  '/js/features/dashboard/controller.js',
  '/js/features/dashboard/view.js',
  '/js/features/settings/index.js',
  '/js/features/settings/controller.js',
  '/js/features/settings/view.js',
  '/js/features/logs/index.js',
  '/js/features/logs/controller.js',
  '/js/features/logs/view.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
