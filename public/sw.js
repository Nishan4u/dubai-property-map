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

// Web Push: display a real system notification for whatever payload
// src/lib/webPush.ts sent. Falls back to a generic message if the push
// event carries no data (some browsers deliver an empty push as a
// "wake up and check" signal).
self.addEventListener("push", (event) => {
  let payload = { title: "Dubai Property Map", body: "You have a new update." };
  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      payload.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: payload.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url === url && "focus" in client) return client.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
