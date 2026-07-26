// Minimal service worker: no caching (listings/prices change constantly, so
// a stale-while-revalidate cache would risk showing outdated data). Its only
// job is to exist — Safari/iOS and some install heuristics look for an
// active service worker as a PWA signal — and to take control immediately
// so it's active the moment it's registered.
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // Intentionally not calling event.respondWith — every request falls
  // through to the network exactly as if there were no service worker.
});
