"use client";

import { clsx } from "clsx";

// The trigger icons (Near Me / Radius / Draw / Clear) live in DubaiMap.tsx's
// own zoom/rotate control stack now, so they visually read as one toolbar.
// This is just the contextual follow-up UI that only makes sense once one
// of those tools is actually active -- the radius slider, or the
// in-progress draw's point count + Finish button -- rendered as a small
// panel next to that stack.
export function MapSearchContextPanel({
  mode,
  isRadiusActive,
  radiusKm,
  drawPointCount,
  onFinishDraw,
  onRadiusChange,
}: {
  mode: "idle" | "radius-pick" | "drawing";
  isRadiusActive: boolean;
  radiusKm: number;
  drawPointCount: number;
  onFinishDraw: () => void;
  onRadiusChange: (km: number) => void;
}) {
  if (isRadiusActive) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-navy-700 bg-navy-900/90 px-3 py-2 backdrop-blur">
        <input
          type="range"
          min={1}
          max={20}
          step={1}
          value={radiusKm}
          onChange={(e) => onRadiusChange(Number(e.target.value))}
          className="h-1 w-24 accent-gold-500 sm:w-32"
        />
        <span className="whitespace-nowrap text-xs font-medium text-ink-200">{radiusKm} km radius</span>
      </div>
    );
  }

  if (mode === "drawing") {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-navy-700 bg-navy-900/90 px-3 py-2 backdrop-blur">
        <span className="whitespace-nowrap text-xs text-ink-300">
          Click the map to add points ({drawPointCount})
        </span>
        <button
          onClick={onFinishDraw}
          disabled={drawPointCount < 3}
          className={clsx(
            "shrink-0 rounded-md px-2 py-1 text-xs font-semibold transition-colors",
            drawPointCount < 3
              ? "cursor-not-allowed bg-navy-800 text-ink-500"
              : "bg-gold-500 text-navy-950 hover:bg-gold-400"
          )}
        >
          Finish
        </button>
      </div>
    );
  }

  return null;
}
