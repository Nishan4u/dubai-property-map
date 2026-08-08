"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Download, X } from "lucide-react";

const STORAGE_KEY = "dpm_install_prompt_dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallAppPrompt() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [showIosTip, setShowIosTip] = useState(false);

  useEffect(() => {
    // Never on the Developer Embeddable Map Widget -- that route renders
    // inside an <iframe> on someone else's website, where a
    // "install this app" prompt would be a broken, out-of-place intrusion.
    // Never on a shared, branded agent presentation either -- that page is
    // meant to read as the agent's own material, not ours.
    if (pathname?.startsWith("/embed") || pathname?.startsWith("/present")) return;

    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      return;
    }

    // Already installed/running standalone — nothing to prompt for.
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    // Covers installs triggered from the browser's own UI (e.g. the address
    // bar install icon) rather than our button — without this, a regular
    // browser tab has no way to know the app is already installed and would
    // keep showing the prompt.
    const onAppInstalled = () => dismiss();
    window.addEventListener("appinstalled", onAppInstalled);

    // Show shortly after load rather than instantly, so it doesn't compete
    // with the initial page render.
    const timer = setTimeout(() => setVisible(true), 1500);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
      clearTimeout(timer);
    };
    // Only ever needs to read pathname once on mount, matching this
    // effect's existing mount-once contract (empty deps) everywhere else.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function dismiss() {
    setVisible(false);
    setShowIosTip(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Private browsing etc. — worst case the popup reappears next visit.
    }
  }

  async function handleInstallClick() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      dismiss();
      return;
    }
    // No native install prompt available (e.g. iOS Safari) — show the
    // manual "Add to Home Screen" steps instead of a dead button.
    setShowIosTip(true);
  }

  if (!visible) return null;

  return (
    // pointer-events-none on the outer box + pointer-events-auto on just
    // the visible card: without this, the box's own transparent
    // padding area (the gap between "bottom-0" and the card, sized by
    // pb-40/pb-28) still intercepts taps meant for whatever is
    // genuinely underneath it -- e.g. the map's zoom/layer controls on
    // the homepage, which sit in exactly that band on mobile.
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-40 lg:justify-end lg:px-6 lg:pb-28">
      <div className="pointer-events-auto w-full max-w-sm rounded-xl border border-navy-700 bg-navy-900 p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <Image
            src="/icons/icon-192.png"
            alt="Dubai Property Map"
            width={44}
            height={44}
            className="h-11 w-11 shrink-0 rounded-xl"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink-100">
              Install Dubai Property Map
            </p>
            <p className="mt-0.5 text-xs text-ink-400">
              {showIosTip
                ? 'Tap the Share icon, then "Add to Home Screen" for the full-screen app experience.'
                : "Add it to your home screen for a faster, full-screen experience."}
            </p>
          </div>
          <button
            onClick={dismiss}
            aria-label="Close"
            className="shrink-0 text-ink-500 hover:text-ink-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {!showIosTip && (
          <button
            onClick={handleInstallClick}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-gold-500 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400"
          >
            <Download className="h-4 w-4" />
            Install App
          </button>
        )}
      </div>
    </div>
  );
}
