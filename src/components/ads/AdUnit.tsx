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

function pushAd() {
  try {
    const w = window as unknown as { adsbygoogle?: unknown[] };
    (w.adsbygoogle = w.adsbygoogle || []).push({});
  } catch {
    // AdSense script not loaded (unconfigured publisher id, blocked by an
    // ad/tracker blocker, etc.) -- the <ins> just stays empty, never a
    // console-breaking throw.
  }
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
    if (format === "horizontal") {
      // Two real ad units at this one placement, not one: on a narrow
      // phone screen there's no room for a genuinely wide/short banner, so
      // Google's full-width-responsive engine substitutes a near-square
      // unit instead (measured live: 375x375 on a 375px-wide screen --
      // effectively the entire visible page, since it ignores the
      // "horizontal" hint once the container is that narrow). Rather than
      // fight that, this renders a real fixed 320x50 banner below the `sm`
      // breakpoint and the existing full-width-responsive banner from `sm`
      // up -- same ad-slot ID for both, CSS (not JS) decides which one is
      // actually in the layout at a given width, which is Google's own
      // documented pattern for "different ad sizes per screen width."
      pushAd();
      pushAd();
    } else {
      pushAd();
    }
  }, [format]);

  if (format === "horizontal") {
    return (
      <div className={className}>
        <p className="mb-1 text-center text-[10px] uppercase tracking-wide text-ink-600">
          Advertisement
        </p>
        <div className="flex justify-center sm:hidden">
          <ins
            className="adsbygoogle"
            style={{ display: "inline-block", width: 320, height: 50 }}
            data-ad-client={AD_CLIENT}
            data-ad-slot={slot}
          />
        </div>
        <div className="hidden sm:block">
          <ins
            className="adsbygoogle"
            style={{ display: "block" }}
            data-ad-client={AD_CLIENT}
            data-ad-slot={slot}
            data-ad-format="horizontal"
            data-full-width-responsive="true"
          />
        </div>
      </div>
    );
  }

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
