"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const STORAGE_KEY = "dpm_push_prompt_dismissed";

// Converts the VAPID public key (base64url) into the Uint8Array shape
// pushManager.subscribe() requires — standard Web Push boilerplate.
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

// Mirrors InstallAppPrompt.tsx's exact dismissible-banner shape (timer
// delay, X dismiss, localStorage-remembered dismissal under its own key
// so it's independent of the install prompt) -- only ever shown to a
// signed-in user (mirrors AuthStatus.tsx's client-side auth-detection
// pattern, since push subscriptions need a real user_id to attach to).
export function PushNotificationPrompt() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    // Never on the Developer Embeddable Map Widget, a shared branded
    // agent presentation, or an agency's white-label storefront -- see
    // InstallAppPrompt's identical guard for why.
    if (pathname?.startsWith("/embed") || pathname?.startsWith("/present") || pathname?.startsWith("/agency-storefront")) return;

    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      return;
    }

    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (Notification.permission === "denied" || Notification.permission === "granted") return;
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return;

    let cancelled = false;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled || !data.user) return;
      const timer = setTimeout(() => setVisible(true), 2500);
      return () => clearTimeout(timer);
    });

    return () => {
      cancelled = true;
    };
    // Only ever needs to read pathname once on mount, matching this
    // effect's existing mount-once contract (empty deps) everywhere else.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Private browsing etc. — worst case the prompt reappears next visit.
    }
  }

  async function handleEnable() {
    setSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        dismiss();
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      });

      const json = subscription.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });
    } catch {
      // Permission dismissed mid-flow, browser quirk, etc. — no harm done,
      // the prompt just won't reappear (matches the dismiss() below).
    }
    dismiss();
    setSubscribing(false);
  }

  if (!visible) return null;

  return (
    // Same pointer-events split as InstallAppPrompt.tsx -- the outer
    // box's transparent area must never swallow taps meant for whatever
    // is genuinely underneath it.
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4 lg:justify-end lg:px-6">
      <div className="pointer-events-auto w-full max-w-sm rounded-xl border border-navy-700 bg-navy-900 p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold-500/15">
            <Bell className="h-5 w-5 text-gold-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink-100">Stay Updated</p>
            <p className="mt-0.5 text-xs text-ink-400">
              Get notified about new listings, price updates and messages — even when the app isn&apos;t open.
            </p>
          </div>
          <button onClick={dismiss} aria-label="Close" className="shrink-0 text-ink-500 hover:text-ink-200">
            <X className="h-4 w-4" />
          </button>
        </div>
        <button
          onClick={handleEnable}
          disabled={subscribing}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-gold-500 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
        >
          <Bell className="h-4 w-4" />
          {subscribing ? "Enabling…" : "Enable Notifications"}
        </button>
      </div>
    </div>
  );
}
