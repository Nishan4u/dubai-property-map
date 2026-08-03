"use client";

import { useEffect, useRef, useState } from "react";
import type { getProjectEngagementPointsAdmin } from "@/lib/supabase/queries";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

type EngagementPoint = Awaited<ReturnType<typeof getProjectEngagementPointsAdmin>>[number];

// Standalone, minimal Mapbox instance -- deliberately not reusing
// DubaiMap.tsx, which carries many unrelated layers/controls/features
// this admin-only view has no need for. Mirrors DubaiMap.tsx's own
// init idiom (dynamic import, same token env var, same dark style) so
// the two stay consistent without sharing code that doesn't apply here.
export function AdminEngagementHeatmap({ points }: { points: EngagementPoint[] }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    if (!MAPBOX_TOKEN || !mapContainer.current) return;
    let cancelled = false;
    let map: import("mapbox-gl").Map | null = null;

    import("mapbox-gl").then((mapboxgl) => {
      if (cancelled || !mapContainer.current) return;
      mapboxgl.default.accessToken = MAPBOX_TOKEN;
      map = new mapboxgl.default.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [55.24, 25.15],
        zoom: 9.5,
        attributionControl: false,
      });

      map.on("load", () => {
        if (cancelled || !map) return;
        map.addSource("engagement", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: points.map((p) => ({
              type: "Feature" as const,
              properties: { weight: p.weight },
              geometry: { type: "Point" as const, coordinates: [p.lng, p.lat] },
            })),
          },
        });
        map.addLayer({
          id: "engagement-heat",
          type: "heatmap",
          source: "engagement",
          paint: {
            "heatmap-weight": ["interpolate", ["linear"], ["get", "weight"], 0, 0, 500, 1],
            "heatmap-intensity": 1,
            "heatmap-radius": 30,
            "heatmap-opacity": 0.8,
            "heatmap-color": [
              "interpolate",
              ["linear"],
              ["heatmap-density"],
              0, "rgba(0,0,0,0)",
              0.2, "#1e3a5f",
              0.4, "#3d6ea5",
              0.6, "#e3ab3d",
              0.8, "#f0c869",
              1, "#fff4d6",
            ],
          },
        });
        queueMicrotask(() => setBooted(true));
      });
    });

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [points]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex h-80 items-center justify-center rounded-xl border border-navy-700 bg-navy-850 text-sm text-ink-500">
        Live map requires Mapbox to be configured.
      </div>
    );
  }

  return (
    <div className="relative h-80 overflow-hidden rounded-xl border border-navy-700">
      <div ref={mapContainer} className="h-full w-full" />
      {!booted && (
        <div className="absolute inset-0 flex items-center justify-center bg-navy-900 text-sm text-ink-500">
          Loading map…
        </div>
      )}
    </div>
  );
}
