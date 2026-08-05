"use client";

import { useEffect, useRef, useState } from "react";
import {
  TrainFront,
  ShoppingBag,
  GraduationCap,
  Stethoscope,
  Plane,
  Waves,
  type LucideIcon,
} from "lucide-react";
import type { NearestPoi } from "@/lib/investmentScore";

const CATEGORY_ICON: Record<string, LucideIcon> = {
  metro: TrainFront,
  malls: ShoppingBag,
  schools: GraduationCap,
  hospitals: Stethoscope,
  airports: Plane,
  beaches: Waves,
};

// Bar fill is inverse-distance, not a real percentage of anything -- purely
// a visual proximity cue (closer reads fuller). Clamped so even a very
// close point doesn't look identical to one 400m away, and a very far one
// still shows a sliver rather than nothing.
const BAR_MIN_KM = 0.3;
const BAR_MAX_KM = 8;

function barPercent(distanceKm: number) {
  const clamped = Math.min(BAR_MAX_KM, Math.max(BAR_MIN_KM, distanceKm));
  const t = (clamped - BAR_MIN_KM) / (BAR_MAX_KM - BAR_MIN_KM);
  return Math.round((1 - t) * 85 + 10); // 10-95% range, never fully empty/full
}

function DistanceRow({ poi, delayMs }: { poi: NearestPoi; delayMs: number }) {
  const [revealed, setRevealed] = useState(false);
  const [displayKm, setDisplayKm] = useState(0);
  const Icon = CATEGORY_ICON[poi.categoryKey] ?? TrainFront;

  useEffect(() => {
    const revealTimer = setTimeout(() => setRevealed(true), delayMs);
    return () => clearTimeout(revealTimer);
  }, [delayMs]);

  useEffect(() => {
    if (!revealed) return;
    const durationMs = 700;
    const start = performance.now();
    let frame: number;
    function tick(now: number) {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayKm(poi.distanceKm * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [revealed, poi.distanceKm]);

  return (
    <div
      className="transition-all duration-500"
      style={{ opacity: revealed ? 1 : 0, transform: revealed ? "translateX(0)" : "translateX(-8px)" }}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2">
          <Icon className="h-3.5 w-3.5 shrink-0 text-gold-400" />
          <span className="min-w-0">
            <span className="block truncate text-xs font-medium text-ink-100">{poi.name}</span>
            <span className="block text-[10px] text-ink-500">{poi.categoryLabel}</span>
          </span>
        </span>
        <span className="shrink-0 text-xs font-semibold tabular-nums text-gold-400">
          {displayKm.toFixed(1)} km
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-navy-800">
        <div
          className="h-full rounded-full bg-gold-500 transition-all duration-700 ease-out"
          style={{ width: revealed ? `${barPercent(poi.distanceKm)}%` : "0%" }}
        />
      </div>
    </div>
  );
}

export function NearbyDistances({ items }: { items: NearestPoi[] }) {
  // Re-plays the reveal animation each time this scrolls into view, not
  // just once on page load -- the section is a fair way down the page.
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (items.length === 0) return null;

  return (
    <div ref={containerRef} className="space-y-3">
      {inView &&
        items.map((poi, i) => (
          <DistanceRow key={poi.categoryKey} poi={poi} delayMs={i * 120} />
        ))}
    </div>
  );
}
