"use client";

import { clsx } from "clsx";
import {
  Building,
  Cross,
  Palmtree,
  Plane,
  Route,
  School,
  ShoppingBag,
  TrainFront,
  Trees,
} from "lucide-react";

export const amenityLayers = [
  { key: "metro", label: "Metro Lines", icon: TrainFront },
  { key: "highways", label: "Major Highways", icon: Route },
  { key: "schools", label: "Schools", icon: School },
  { key: "hospitals", label: "Hospitals", icon: Cross },
  { key: "malls", label: "Malls", icon: ShoppingBag },
  { key: "airports", label: "Airports", icon: Plane },
  { key: "beaches", label: "Beaches", icon: Palmtree },
  { key: "golf", label: "Golf Courses", icon: Building },
  { key: "parks", label: "Parks", icon: Trees },
];

export function MapAmenityBar({
  active,
  onToggle,
}: {
  active: string[];
  onToggle: (key: string) => void;
}) {
  return (
    // Same p-1 container + single-line icon-only button height as the
    // Map/Satellite toggle it always shares a row with -- kept compact at
    // every breakpoint (not just mobile) since the map panel itself can be
    // narrow even on desktop once the filters+list+map 3-column layout
    // kicks in, so "small enough to always fit beside Map/Satellite" beats
    // "roomy at desktop widths but has to stack/overlap sometimes".
    <div className="inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-navy-700 bg-navy-900/90 p-1 backdrop-blur">
      {amenityLayers.map((a) => {
        const isActive = active.includes(a.key);
        return (
          <button
            key={a.key}
            onClick={() => onToggle(a.key)}
            title={a.label}
            className={clsx(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
              isActive
                ? "bg-gold-500/15 text-gold-400"
                : "text-ink-400 hover:bg-navy-800 hover:text-ink-100"
            )}
          >
            <a.icon className="h-3.5 w-3.5 shrink-0" />
          </button>
        );
      })}
    </div>
  );
}
