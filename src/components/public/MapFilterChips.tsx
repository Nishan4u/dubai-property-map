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
    <div className="flex items-center gap-2 overflow-x-auto rounded-xl border border-navy-700 bg-navy-900/90 px-3 py-2 backdrop-blur">
      {chips.map((chip) => (
        <button
          key={chip.value}
          onClick={() => onChange(chip.value)}
          className={clsx(
            "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
            active === chip.value
              ? "bg-gold-500 text-navy-950"
              : "text-ink-300 hover:bg-navy-800 hover:text-ink-100"
          )}
        >
          <chip.icon className="h-3.5 w-3.5" />
          {chip.label}
        </button>
      ))}
    </div>
  );
}
