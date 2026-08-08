"use client";

import { useEffect, useRef } from "react";
import { AD_CLIENT } from "@/lib/adSlots";

interface AdUnitProps {
  slot: string;
  /** "auto" lets Google pick any shape, including a tall rectangle --
   * "horizontal" asks specifically for a short, wide banner shape instead
   * (used for the homepage banner and the projects in-feed slot, both of
   * which sit inside a fixed-height strip rather than open page flow).
   * "fluid" is required for the in-article layout. */
  format?: "auto" | "fluid" | "horizontal";
  /** Set to "in-article" for an in-article unit -- pairs with format="fluid". */
  layout?: "in-article";
  className?: string;
}

// Renders one manual AdSense unit. The site-wide adsbygoogle.js <head>
// script (AnalyticsScripts.tsx) only loads the library -- each individual
// placement still needs its own <ins> tag plus a push({}) call once that
// tag is in the DOM, which is why this is a small client component rather
// than something the server-rendered AnalyticsScripts.tsx could also own.
export function AdUnit({ slot, format = "auto", layout, className }: AdUnitProps) {
  const pushedRef = useRef(false);

  useEffect(() => {
    if (pushedRef.current) return;
    pushedRef.current = true;
    try {
      const w = window as unknown as { adsbygoogle?: unknown[] };
      (w.adsbygoogle = w.adsbygoogle || []).push({});
    } catch {
      // AdSense script not loaded (unconfigured publisher id, blocked by an
      // ad/tracker blocker, etc.) -- the <ins> below just stays empty,
      // never a console-breaking throw.
    }
  }, []);

  return (
    <div className={className}>
      <p className="mb-1 text-center text-[10px] uppercase tracking-wide text-ink-600">
        Advertisement
      </p>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-ad-layout={layout}
        data-full-width-responsive="true"
      />
    </div>
  );
}
