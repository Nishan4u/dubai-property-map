"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Non-fatal — the site still works, it just won't register as a
        // "true" PWA on browsers that check for an active service worker.
      });
    }
  }, []);

  return null;
}
