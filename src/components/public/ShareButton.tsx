"use client";

import { useEffect, useState } from "react";
import { Share2, Copy, Mail, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function ShareButton({
  targetType,
  targetId,
  title,
}: {
  targetType: "project" | "developer";
  targetId: string;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const directUrl = window.location.href;
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

  const links = [
    { label: "WhatsApp", href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}` },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
    { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` },
    { label: "X", href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}` },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg border border-navy-600 px-3 py-2 text-sm font-medium text-ink-300 hover:text-ink-100"
      >
        <Share2 className="h-4 w-4" /> Share
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-xl border border-navy-700 bg-navy-900 p-2 shadow-2xl">
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
        </div>
      )}
    </div>
  );
}
