"use client";

import { useState } from "react";
import { clsx } from "clsx";
import {
  Building,
  Cross,
  Landmark,
  Palmtree,
  Plane,
  School,
  ShoppingBag,
  Trees,
} from "lucide-react";

const amenities = [
  { label: "Metro Lines", icon: Landmark },
  { label: "Schools", icon: School },
  { label: "Hospitals", icon: Cross },
  { label: "Malls", icon: ShoppingBag },
  { label: "Airports", icon: Plane },
  { label: "Beaches", icon: Palmtree },
  { label: "Golf Courses", icon: Building },
  { label: "Parks", icon: Trees },
];

export function MapAmenityBar() {
  const [active, setActive] = useState<string[]>([]);

  function toggle(label: string) {
    setActive((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  }

  return (
    <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-navy-700 bg-navy-900/90 px-2 py-2 backdrop-blur">
      {amenities.map((a) => {
        const isActive = active.includes(a.label);
        return (
          <button
            key={a.label}
            onClick={() => toggle(a.label)}
            className={clsx(
              "flex shrink-0 flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-[10px] font-medium transition-colors",
              isActive
                ? "bg-gold-500/15 text-gold-400"
                : "text-ink-400 hover:bg-navy-800 hover:text-ink-100"
            )}
          >
            <a.icon className="h-4 w-4" />
            {a.label}
          </button>
        );
      })}
    </div>
  );
}
