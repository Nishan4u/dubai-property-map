"use client";

import { clsx } from "clsx";
import {
  Building2,
  Crown,
  Gem,
  LayoutGrid,
  TrendingUp,
  Waves,
} from "lucide-react";
import type { ProjectTag } from "@/types";

const chips: { label: string; value: ProjectTag | "all"; icon: React.ElementType }[] = [
  { label: "All", value: "all", icon: LayoutGrid },
  { label: "New Launches", value: "new-launch", icon: Building2 },
  { label: "Luxury", value: "luxury", icon: Crown },
  { label: "Waterfront", value: "waterfront", icon: Waves },
  { label: "Villas", value: "villas", icon: Building2 },
  { label: "Under 1M", value: "under-1m", icon: Gem },
  { label: "High ROI", value: "high-roi", icon: TrendingUp },
];

export function MapFilterChips({
  active,
  onChange,
}: {
  active: ProjectTag | "all";
  onChange: (v: ProjectTag | "all") => void;
}) {
  return (
    // Same p-1 container + icon-only sizing as MapAmenityBar at every
    // breakpoint (not just mobile/tablet) -- this sits in a reserved strip
    // (left-4 right-56) next to the Featured Project card, and "lg:" is a
    // viewport-width media query, not a container-width one, so on desktop
    // widths where the 3-column filters+list+map layout leaves the map
    // panel itself narrow, revealing labels at lg: overflowed past the
    // reserved strip and got clipped under the featured card. Icon-only
    // always fits; its own overflow-x-auto is the fallback if it still
    // doesn't.
    <div className="inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-navy-700 bg-navy-900/90 p-1 backdrop-blur">
      {chips.map((chip) => (
        <button
          key={chip.value}
          onClick={() => onChange(chip.value)}
          title={chip.label}
          className={clsx(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
            active === chip.value
              ? "bg-gold-500 text-navy-950"
              : "text-ink-300 hover:bg-navy-800 hover:text-ink-100"
          )}
        >
          <chip.icon className="h-3.5 w-3.5 shrink-0" />
        </button>
      ))}
    </div>
  );
}
