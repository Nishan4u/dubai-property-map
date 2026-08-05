"use client";

import { clsx } from "clsx";
import { Circle, LocateFixed, PenTool, X } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import type { GeoSearchRegion } from "@/lib/geoSearch";

export function MapSearchTools({
  mode,
  region,
  radiusKm,
  drawPointCount,
  onNearMe,
  onStartRadius,
  onStartDraw,
  onFinishDraw,
  onClear,
  onRadiusChange,
}: {
  mode: "idle" | "radius-pick" | "drawing";
  region: GeoSearchRegion | null;
  radiusKm: number;
  drawPointCount: number;
  onNearMe: () => void;
  onStartRadius: () => void;
  onStartDraw: () => void;
  onFinishDraw: () => void;
  onClear: () => void;
  onRadiusChange: (km: number) => void;
}) {
  const hasRegion = region !== null;

  return (
    <div className="inline-flex max-w-full flex-col gap-1.5">
      <div className="inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-navy-700 bg-navy-900/90 p-1 backdrop-blur">
        <Tooltip label="Search near me">
          <button
            onClick={onNearMe}
            aria-label="Search near me"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-navy-800 hover:text-ink-100"
          >
            <LocateFixed className="h-3.5 w-3.5 shrink-0" />
          </button>
        </Tooltip>
        <Tooltip label={mode === "radius-pick" ? "Click the map to set the search center" : "Radius search"}>
          <button
            onClick={onStartRadius}
            aria-label="Radius search"
            className={clsx(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
              mode === "radius-pick" || region?.type === "radius"
                ? "bg-gold-500/15 text-gold-400"
                : "text-ink-400 hover:bg-navy-800 hover:text-ink-100"
            )}
          >
            <Circle className="h-3.5 w-3.5 shrink-0" />
          </button>
        </Tooltip>
        <Tooltip label={mode === "drawing" ? "Click the map to add points" : "Draw a search area"}>
          <button
            onClick={onStartDraw}
            aria-label="Draw a search area"
            className={clsx(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
              mode === "drawing" || region?.type === "polygon"
                ? "bg-gold-500/15 text-gold-400"
                : "text-ink-400 hover:bg-navy-800 hover:text-ink-100"
            )}
          >
            <PenTool className="h-3.5 w-3.5 shrink-0" />
          </button>
        </Tooltip>
        {(hasRegion || mode !== "idle") && (
          <Tooltip label="Clear search area">
            <button
              onClick={onClear}
              aria-label="Clear search area"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-navy-800 hover:text-ink-100"
            >
              <X className="h-3.5 w-3.5 shrink-0" />
            </button>
          </Tooltip>
        )}
      </div>

      {region?.type === "radius" && (
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
      )}

      {mode === "drawing" && (
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
      )}
    </div>
  );
}
