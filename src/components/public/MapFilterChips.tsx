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
    // Same p-1 container + compact button sizing as MapAmenityBar for a
    // consistent design language between the map's top and bottom bars.
    // Icon-only below lg: (this sits in a fairly narrow reserved strip --
    // left-4 right-56 -- that gets tight on mobile/tablet); labels return
    // at lg: and up since this top bar isn't sharing a row with anything
    // else the way the bottom amenity bar is.
    <div className="inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-navy-700 bg-navy-900/90 p-1 backdrop-blur">
      {chips.map((chip) => (
        <button
          key={chip.value}
          onClick={() => onChange(chip.value)}
          title={chip.label}
          className={clsx(
            "flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 text-[11px] font-medium transition-colors lg:px-3",
            active === chip.value
              ? "bg-gold-500 text-navy-950"
              : "text-ink-300 hover:bg-navy-800 hover:text-ink-100"
          )}
        >
          <chip.icon className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden lg:inline">{chip.label}</span>
        </button>
      ))}
    </div>
  );
}
