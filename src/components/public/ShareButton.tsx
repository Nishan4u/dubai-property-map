"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  // Computed fresh at click time from the trigger's real on-screen position
  // (see computeMenuPosition) -- fixed-positioned and clamped to the
  // viewport on every side, rather than a CSS `absolute` anchor relative to
  // the trigger's own tiny wrapper. The old approach only checked whether
  // there was room between the trigger and the top of the *viewport*, so it
  // had no way to know other floating chrome (e.g. a featured-project card)
  // occupied that space and would open straight over it. Measuring real
  // available space in each direction and capping maxHeight (scrollable if
  // still short on room) fixes that class of bug on every breakpoint at
  // once instead of special-casing one more layout.
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const wrapperRef = useRef<HTMLDivElement>(null);
  // The menu itself is rendered via a portal straight to document.body (see
  // the return statement) -- once ported out, it's no longer a DOM
  // descendant of wrapperRef, so the outside-click check below needs to
  // treat clicks inside the portaled menu as "inside" too, or every click
  // on a menu item would immediately close the menu before its own onClick
  // ever ran.
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (wrapperRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    // Closes rather than trying to re-track position: a fixed-position menu
    // would otherwise visually detach from its trigger the instant the page
    // (or a scrollable list/card container) scrolls underneath it. `true`
    // for capture so this also fires for scrolling inside a nested
    // container, not just the window/document itself.
    function onScroll() {
      setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("scroll", onScroll, true);
    };
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

  const MENU_WIDTH = 224; // w-56
  const VIEWPORT_MARGIN = 8;

  // Measures the trigger's actual on-screen position and picks whichever
  // direction has more real room, clamped so the menu can never render
  // outside the viewport on any side -- works the same for a button near
  // the top, bottom, or either edge of the screen, on any breakpoint.
  function computeMenuPosition(triggerEl: HTMLElement): React.CSSProperties {
    const rect = triggerEl.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const left = Math.min(
      Math.max(rect.right - MENU_WIDTH, VIEWPORT_MARGIN),
      vw - MENU_WIDTH - VIEWPORT_MARGIN
    );
    const spaceBelow = vh - rect.bottom - VIEWPORT_MARGIN;
    const spaceAbove = rect.top - VIEWPORT_MARGIN;

    if (spaceBelow >= 200 || spaceBelow >= spaceAbove) {
      return {
        position: "fixed",
        left,
        top: rect.bottom + VIEWPORT_MARGIN,
        width: MENU_WIDTH,
        maxHeight: Math.max(spaceBelow, 120),
      };
    }
    return {
      position: "fixed",
      left,
      bottom: vh - rect.top + VIEWPORT_MARGIN,
      width: MENU_WIDTH,
      maxHeight: Math.max(spaceAbove, 120),
    };
  }

  // Previously tried navigator.share() first and fell back to this dropdown
  // -- but that API is also available on desktop Safari/Chrome (not just
  // mobile), so it could open the OS share sheet *and* this dropdown at
  // once depending on timing. Always using the same in-app menu everywhere
  // is simpler, consistent across devices, and is what actually lets us
  // offer Compare/auto-close/etc. below.
  function handleTriggerClick(e: React.MouseEvent<HTMLElement>) {
    e.preventDefault();
    e.stopPropagation();
    setMenuStyle(computeMenuPosition(e.currentTarget));
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

      {open && createPortal(
        <div
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
          style={menuStyle}
          className="z-50 overflow-y-auto rounded-xl border border-navy-700 bg-navy-900 p-2 shadow-2xl"
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
        </div>,
        document.body
      )}
    </div>
  );
}
