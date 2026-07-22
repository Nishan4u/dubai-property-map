"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { clsx } from "clsx";
import {
  Compass,
  Layers,
  Minus,
  Plus,
  Star,
  X,
} from "lucide-react";
import type { Community, Project } from "@/types";
import { formatAed, getDeveloper } from "@/data/mock";
import { ProjectThumb } from "@/components/ui/ProjectThumb";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export function DubaiMap({
  communities,
  projects,
  selectedCommunityId,
  onSelectCommunity,
}: {
  communities: Community[];
  projects: Project[];
  selectedCommunityId: string | null;
  onSelectCommunity: (id: string | null) => void;
}) {
  const [zoom, setZoom] = useState(1);
  const [satellite, setSatellite] = useState(false);
  const [useLiveMap, setUseLiveMap] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("mapbox-gl").Map | null>(null);

  const countByCommunity = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of projects) {
      map.set(p.communityId, (map.get(p.communityId) ?? 0) + 1);
    }
    return map;
  }, [projects]);

  const visibleCommunities = communities.filter(
    (c) => (countByCommunity.get(c.id) ?? 0) > 0
  );

  const selectedCommunity = communities.find(
    (c) => c.id === selectedCommunityId
  );
  const topProjectInCommunity = selectedCommunity
    ? projects.find((p) => p.communityId === selectedCommunity.id)
    : undefined;

  // Attempt to boot a real Mapbox GL map when a token is provided.
  useEffect(() => {
    if (!MAPBOX_TOKEN || !mapContainer.current) return;
    let cancelled = false;

    import("mapbox-gl").then((mapboxgl) => {
      if (cancelled || !mapContainer.current) return;
      mapboxgl.default.accessToken = MAPBOX_TOKEN;
      const map = new mapboxgl.default.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [55.24, 25.15],
        zoom: 10.2,
        attributionControl: false,
      });
      mapRef.current = map;
      setUseLiveMap(true);

      communities.forEach((c) => {
        const el = document.createElement("div");
        el.style.cursor = "pointer";
        el.innerHTML = `<div style="width:36px;height:36px;border-radius:9999px;background:${c.pinColor};display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:700;border:2px solid rgba(255,255,255,0.35);">${
          countByCommunity.get(c.id) ?? 0
        }</div>`;
        el.addEventListener("click", () => onSelectCommunity(c.id));
        new mapboxgl.default.Marker({ element: el })
          .setLngLat([c.lng, c.lat])
          .addTo(map);
      });
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Base layer */}
      {!useLiveMap && (
        <div
          className={clsx(
            "absolute inset-0 transition-all duration-300",
            satellite
              ? "bg-[radial-gradient(circle_at_30%_20%,#2b2416,#141008_60%,#0a0805)]"
              : "bg-[radial-gradient(circle_at_25%_15%,#0f2035,#0a1526_55%,#070d18)]"
          )}
        >
          <svg
            className="absolute inset-0 h-full w-full opacity-[0.12]"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <path
              d="M0 40 Q 20 30 35 42 T 60 38 Q 75 30 100 45"
              stroke="#8b96b5"
              strokeWidth="0.3"
              fill="none"
            />
            <path
              d="M0 60 Q 25 55 45 65 T 100 58"
              stroke="#8b96b5"
              strokeWidth="0.3"
              fill="none"
            />
            {Array.from({ length: 10 }).map((_, i) => (
              <line
                key={`v${i}`}
                x1={i * 10}
                y1="0"
                x2={i * 10}
                y2="100"
                stroke="#8b96b5"
                strokeWidth="0.15"
              />
            ))}
            {Array.from({ length: 10 }).map((_, i) => (
              <line
                key={`h${i}`}
                x1="0"
                y1={i * 10}
                x2="100"
                y2={i * 10}
                stroke="#8b96b5"
                strokeWidth="0.15"
              />
            ))}
          </svg>
        </div>
      )}

      <div ref={mapContainer} className="absolute inset-0" />

      {/* Pins (fallback view) */}
      {!useLiveMap && (
        <div
          className="absolute inset-0 origin-center transition-transform duration-300"
          style={{ transform: `scale(${zoom})` }}
        >
          {visibleCommunities.map((c) => (
            <button
              key={c.id}
              onClick={() =>
                onSelectCommunity(selectedCommunityId === c.id ? null : c.id)
              }
              className="group absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
              style={{ left: `${c.xPct}%`, top: `${c.yPct}%` }}
            >
              <span
                className={clsx(
                  "flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-bold text-white shadow-lg transition-transform group-hover:scale-110",
                  selectedCommunityId === c.id
                    ? "border-gold-400 ring-2 ring-gold-400/50"
                    : "border-white/30"
                )}
                style={{ background: c.pinColor }}
              >
                {countByCommunity.get(c.id) ?? 0}
              </span>
              <span className="whitespace-nowrap rounded bg-navy-950/80 px-1.5 py-0.5 text-[10px] font-medium text-ink-200 opacity-0 transition-opacity group-hover:opacity-100">
                {c.name}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Zoom / map controls */}
      <div className="absolute left-4 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-1 rounded-xl border border-navy-700 bg-navy-900/90 p-1 backdrop-blur">
        <button
          onClick={() => setZoom((z) => Math.min(2, z + 0.2))}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-300 hover:bg-navy-800 hover:text-ink-100"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-300 hover:bg-navy-800 hover:text-ink-100"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          onClick={() => setZoom(1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-300 hover:bg-navy-800 hover:text-ink-100"
        >
          <Compass className="h-4 w-4" />
        </button>
        <button className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-300 hover:bg-navy-800 hover:text-ink-100">
          <Layers className="h-4 w-4" />
        </button>
      </div>

      {/* Map / Satellite toggle */}
      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1 rounded-xl border border-navy-700 bg-navy-900/90 p-1 backdrop-blur">
        <button
          onClick={() => setSatellite(false)}
          className={clsx(
            "rounded-lg px-3 py-1.5 text-xs font-medium",
            !satellite ? "bg-gold-500 text-navy-950" : "text-ink-300"
          )}
        >
          Map
        </button>
        <button
          onClick={() => setSatellite(true)}
          className={clsx(
            "rounded-lg px-3 py-1.5 text-xs font-medium",
            satellite ? "bg-gold-500 text-navy-950" : "text-ink-300"
          )}
        >
          Satellite
        </button>
      </div>

      {/* Pin click popup */}
      {selectedCommunity && topProjectInCommunity && (
        <div className="absolute bottom-20 left-1/2 z-20 w-80 -translate-x-1/2 overflow-hidden rounded-xl border border-navy-700 bg-navy-900 shadow-2xl sm:left-24 sm:translate-x-0">
          <div className="relative">
            <ProjectThumb
              gradient={topProjectInCommunity.gradient}
              className="h-28 w-full"
            />
            <button
              onClick={() => onSelectCommunity(null)}
              className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-navy-950/70 text-ink-300 hover:text-ink-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="p-3">
            <p className="text-xs font-medium text-gold-400">
              {selectedCommunity.name} · {countByCommunity.get(selectedCommunity.id)}{" "}
              projects
            </p>
            <h4 className="mt-0.5 text-sm font-semibold text-ink-100">
              {topProjectInCommunity.name}
            </h4>
            <p className="text-xs text-ink-500">
              by {getDeveloper(topProjectInCommunity.developerId)?.name}
            </p>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="font-semibold text-ink-100">
                {formatAed(topProjectInCommunity.priceFromAed)}
              </span>
              <span className="flex items-center gap-1 text-ink-400">
                <Star className="h-3 w-3 fill-gold-400 text-gold-400" />
                {topProjectInCommunity.rating || "New"}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link
                href={`/projects/${topProjectInCommunity.slug}`}
                className="rounded-lg bg-gold-500 py-1.5 text-center text-xs font-semibold text-navy-950 hover:bg-gold-400"
              >
                View Project
              </Link>
              <Link
                href={`/communities/${selectedCommunity.slug}`}
                className="rounded-lg border border-navy-600 py-1.5 text-center text-xs font-medium text-ink-300 hover:text-ink-100"
              >
                See Community
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
