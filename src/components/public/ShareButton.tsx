"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Share2, Copy, Mail, Check, QrCode, Scale } from "lucide-react";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/client";

export function ShareButton({
  targetType,
  targetId,
  title,
  path,
  compact = false,
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
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  // compact's default (open upward, away from this same card's own content
  // below) flips to downward when there isn't actually room above -- e.g.
  // the first card in a list, near the top of the screen -- so the menu
  // never gets cut off against the top of the viewport.
  const [openUpward, setOpenUpward] = useState(compact);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

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

  async function handleCopy(e: React.MouseEvent) {
    // This button has no default action of its own, so an unprevented click
    // bubbles up looking for one -- when this menu is nested inside a card's
    // wrapping <Link> (e.g. ProjectCard), that ancestor's navigation would
    // otherwise fire instead of just copying and closing the menu.
    e.preventDefault();
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
    // Brief pause so the "Copied!" confirmation is actually seen before the
    // menu closes itself, rather than vanishing the instant it appears.
    setTimeout(() => {
      setCopied(false);
      setOpen(false);
    }, 900);
  }

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);
  const projectSlug = targetType === "project" ? path?.replace(/^\/projects\//, "") : undefined;

  const links = [
    { label: "WhatsApp", href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}` },
    { label: "Telegram", href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}` },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
    { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` },
    { label: "X", href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}` },
  ];

  async function handleToggleQr(e: React.MouseEvent) {
    // Same nested-in-a-card-Link concern as handleCopy above.
    e.preventDefault();
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

  // Previously tried navigator.share() first and fell back to this dropdown
  // -- but that API is also available on desktop Safari/Chrome (not just
  // mobile), so it could open the OS share sheet *and* this dropdown at
  // once depending on timing. Always using the same in-app menu everywhere
  // is simpler, consistent across devices, and is what actually lets us
  // offer Compare/auto-close/etc. below.
  function handleTriggerClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (compact) {
      // ~320px covers the menu's full option list without the QR code
      // panel -- good enough for a yes/no fit check, no need to measure
      // the actual (not-yet-rendered) menu.
      const MENU_HEIGHT_ESTIMATE = 320;
      const spaceAbove = e.currentTarget.getBoundingClientRect().top;
      setOpenUpward(spaceAbove >= MENU_HEIGHT_ESTIMATE);
    }
    setOpen((o) => !o);
  }

  return (
    <div className="relative" ref={wrapperRef}>
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
            // compact is used inside small cards (project list rows, the map
            // popup) where the trigger sits near the top -- opening downward
            // there covers the rest of that same card's own content (price,
            // View Project button, etc.), so it prefers opening upward. But
            // for a card near the very top of the screen (openUpward is
            // computed per-click in handleTriggerClick), there isn't room
            // above either, so it falls back to downward there instead of
            // getting cut off against the top of the viewport.
            openUpward
              ? "absolute bottom-full right-0 z-20 mb-2 w-56 rounded-xl border border-navy-700 bg-navy-900 p-2 shadow-2xl"
              : "absolute right-0 top-full z-20 mt-2 w-56 rounded-xl border border-navy-700 bg-navy-900 p-2 shadow-2xl"
          }
        >
          <button
            onClick={handleCopy}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink-300 hover:bg-navy-800 hover:text-ink-100"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy Link"}
          </button>
          {projectSlug && (
            <button
              onClick={(e) => {
                // A <Link> here would be an <a> nested inside this card's own
                // wrapping <Link> (e.g. ProjectCard) -- invalid HTML that
                // React flags as a hydration error. Navigate imperatively
                // instead, same fix as handleCopy/handleToggleQr above.
                e.preventDefault();
                setOpen(false);
                router.push(`/compare?add=${projectSlug}`);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink-300 hover:bg-navy-800 hover:text-ink-100"
            >
              <Scale className="h-4 w-4" /> Compare
            </button>
          )}
          {links.map((l) => (
            // A plain <a target="_blank"> here would also be an <a> nested
            // inside the card's own wrapping <Link> -- same invalid-HTML
            // hydration error as Compare above, so this opens imperatively.
            <button
              key={l.label}
              onClick={(e) => {
                e.preventDefault();
                window.open(l.href, "_blank", "noopener,noreferrer");
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink-300 hover:bg-navy-800 hover:text-ink-100"
            >
              {l.label}
            </button>
          ))}
          <button
            onClick={(e) => {
              e.preventDefault();
              window.location.href = `mailto:?subject=${encodedTitle}&body=${encodedUrl}`;
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink-300 hover:bg-navy-800 hover:text-ink-100"
          >
            <Mail className="h-4 w-4" /> Email
          </button>
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
