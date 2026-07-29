"use client";

import { useEffect, useState } from "react";
import { Building2, Share2, Copy, Mail, Check, QrCode } from "lucide-react";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/client";
import { getMapboxStaticImageUrl } from "@/lib/mapboxStaticImage";

export interface ShareCardData {
  imageUrl?: string | null;
  logoUrl?: string | null;
  developerName?: string;
  communityName?: string;
  priceLabel?: string;
  lat?: number | null;
  lng?: number | null;
}

export function ShareButton({
  targetType,
  targetId,
  title,
  path,
  compact = false,
  card,
}: {
  targetType: "project" | "developer";
  targetId: string;
  title: string;
  /** Explicit path to share (e.g. a specific project card in a list, which
   * may not be the page currently being viewed). Resolved against
   * window.location.origin client-side to avoid an SSR/hydration mismatch.
   * Defaults to the current page's URL, correct for detail pages. */
  path?: string;
  /** Icon-only trigger sized for a card, instead of the labeled button. */
  compact?: boolean;
  /** Project Card fields for the rich in-app share preview (spec: Share
   * Feature -- Project Card/Mapbox Map Card/Image/Logo/Name/Developer/
   * Community/Starting Price). Omit for non-project shares (e.g. developer
   * pages), which fall back to the plain link list. */
  card?: ShareCardData;
}) {
  const [open, setOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    const directUrl = path ? new URL(path, window.location.origin).toString() : window.location.href;
    setShareUrl(directUrl);

    // Only logged-in staff get a trackable link — everyone else (including
    // guests) shares the direct page URL. Reads their own session, not the
    // dpm_ref cookie (that's for the visitor side of a share, not this one).
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("staff_id").eq("id", user.id).single();
      if (!profile?.staff_id) return;

      const res = await fetch("/api/staff/shared-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId }),
      });
      if (res.ok) {
        const data = await res.json();
        setShareUrl(`${window.location.origin}/s/${data.shareCode}`);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      // Fallback for contexts where the async Clipboard API is blocked
      // (older browsers, some restricted embeds) — the deprecated
      // execCommand path still works broadly as a last resort.
      const input = document.createElement("textarea");
      input.value = shareUrl;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.focus();
      input.select();
      try {
        document.execCommand("copy");
      } catch {
        // Nothing more we can do — the user can still select the link manually.
      }
      document.body.removeChild(input);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);
  const mapImageUrl =
    card?.lat != null && card?.lng != null
      ? getMapboxStaticImageUrl(card.lat, card.lng, { width: 400, height: 150 })
      : null;

  const links = [
    { label: "WhatsApp", href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}` },
    { label: "Telegram", href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}` },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
    { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` },
    { label: "X", href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}` },
  ];

  async function handleToggleQr() {
    if (!showQr && !qrDataUrl && shareUrl) {
      try {
        const dataUrl = await QRCode.toDataURL(shareUrl, {
          width: 176,
          margin: 1,
          color: { dark: "#0a0f1e", light: "#ffffff" },
        });
        setQrDataUrl(dataUrl);
      } catch {
        // Non-critical — the rest of the share menu still works without a QR.
      }
    }
    setShowQr((v) => !v);
  }

  // On devices with the OS share sheet (mostly mobile), tapping the trigger
  // goes straight there instead of opening the custom dropdown -- that sheet
  // already surfaces WhatsApp/Mail/etc. natively. Desktop browsers without
  // navigator.share fall back to the dropdown below.
  async function handleTriggerClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url: shareUrl });
        return;
      } catch {
        // User cancelled the native sheet, or it failed -- fall through to
        // the dropdown so they still have a way to share.
      }
    }
    setOpen((o) => !o);
  }

  return (
    <div className="relative">
      <button
        onClick={handleTriggerClick}
        title="Share"
        className={
          compact
            ? "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-500 hover:text-gold-400"
            : "flex items-center gap-2 rounded-lg border border-navy-600 px-3 py-2 text-sm font-medium text-ink-300 hover:text-ink-100"
        }
      >
        <Share2 className="h-4 w-4" />
        {!compact && "Share"}
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={
            card ? "absolute right-0 top-full z-20 mt-2 w-72 rounded-xl border border-navy-700 bg-navy-900 p-2 shadow-2xl" : "absolute right-0 top-full z-20 mt-2 w-56 rounded-xl border border-navy-700 bg-navy-900 p-2 shadow-2xl"
          }
        >
          {card && (
            <div className="mb-2 overflow-hidden rounded-lg border border-navy-700 bg-navy-850">
              <div className="relative h-28 w-full bg-navy-800">
                {card.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={card.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Building2 className="h-8 w-8 text-ink-600" />
                  </div>
                )}
                {card.logoUrl && (
                  <div className="absolute bottom-1.5 left-1.5 flex h-8 w-8 items-center justify-center overflow-hidden rounded-md border border-navy-700 bg-white/95 p-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={card.logoUrl} alt="" className="h-full w-full object-contain" />
                  </div>
                )}
              </div>
              {mapImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mapImageUrl} alt="" className="h-16 w-full object-cover" />
              )}
              <div className="p-2.5">
                <p className="truncate text-sm font-semibold text-ink-100">{title}</p>
                <p className="truncate text-xs text-ink-500">
                  {[card.developerName, card.communityName].filter(Boolean).join(" · ")}
                </p>
                {card.priceLabel && (
                  <p className="mt-1 text-xs font-semibold text-gold-400">From {card.priceLabel}</p>
                )}
              </div>
            </div>
          )}
          <button
            onClick={handleCopy}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink-300 hover:bg-navy-800 hover:text-ink-100"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy Link"}
          </button>
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink-300 hover:bg-navy-800 hover:text-ink-100"
            >
              {l.label}
            </a>
          ))}
          <a
            href={`mailto:?subject=${encodedTitle}&body=${encodedUrl}`}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink-300 hover:bg-navy-800 hover:text-ink-100"
          >
            <Mail className="h-4 w-4" /> Email
          </a>
          <button
            onClick={handleToggleQr}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink-300 hover:bg-navy-800 hover:text-ink-100"
          >
            <QrCode className="h-4 w-4" /> {showQr ? "Hide QR Code" : "Show QR Code"}
          </button>
          {showQr && (
            <div className="flex justify-center p-2">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt="QR code for this share link" className="h-44 w-44 rounded-lg" />
              ) : (
                <div className="flex h-44 w-44 items-center justify-center text-xs text-ink-500">Generating…</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
