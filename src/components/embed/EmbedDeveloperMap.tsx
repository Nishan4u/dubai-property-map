"use client";

import { useEffect, useRef } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import { formatAed } from "@/data/mock";
import type { ProjectPreview } from "@/lib/supabase/queries";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
// Dubai-wide default center/zoom, same fallback used when no pins have
// coordinates -- mirrors DubaiMap.tsx's own default view.
const DUBAI_CENTER: [number, number] = [55.2708, 25.2048];

// Deliberately a standalone, minimal map -- NOT a reduced-props wrapper
// around DubaiMap.tsx, which is a 1000+ line component wired into the
// full site's search tools/heatmaps/fullscreen/saved-views state machine
// and expects the full Project/Community types. This embed only ever
// needs to plot one developer's own pins for a visitor on a third-party
// site, so a small purpose-built component is safer than entangling that
// existing component with an embed-specific code path.
export function EmbedDeveloperMap({ projects }: { projects: ProjectPreview[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const pins = projects.filter(
    (p): p is ProjectPreview & { lat: number; lng: number } => p.lat != null && p.lng != null
  );

  useEffect(() => {
    if (!containerRef.current || !MAPBOX_TOKEN) return;
    let cancelled = false;
    let map: import("mapbox-gl").Map | null = null;

    import("mapbox-gl").then((mapboxgl) => {
      if (cancelled || !containerRef.current) return;
      mapboxgl.default.accessToken = MAPBOX_TOKEN;

      map = new mapboxgl.default.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: pins.length ? [pins[0].lng, pins[0].lat] : DUBAI_CENTER,
        zoom: pins.length ? 11 : 10,
        attributionControl: false,
        cooperativeGestures: true,
      });
      map.addControl(new mapboxgl.default.NavigationControl({ showCompass: false }), "top-right");
      map.addControl(new mapboxgl.default.AttributionControl({ compact: true }));

      const bounds = new mapboxgl.default.LngLatBounds();
      pins.forEach((p) => {
        const el = document.createElement("div");
        el.style.cssText =
          "width:16px;height:16px;border-radius:9999px;background:#f2c665;border:2px solid #0a0f1c;box-shadow:0 1px 4px rgba(0,0,0,0.5);cursor:pointer;";
        el.title = p.name;

        const popupHtml = `
          <div style="font-family:inherit;min-width:180px">
            ${p.cover_image_url ? `<img src="${p.cover_image_url}" alt="" style="width:100%;height:90px;object-fit:cover;border-radius:6px 6px 0 0;display:block" />` : ""}
            <div style="padding:8px 10px">
              <p style="margin:0;font-size:13px;font-weight:600;color:#0a0f1c">${escapeHtml(p.name)}</p>
              <p style="margin:2px 0 6px;font-size:12px;color:#f2a900;font-weight:700">${formatAed(p.price_from_aed)}</p>
              <a href="https://dubaipropertymap.ae/projects/${p.slug}" target="_blank" rel="noopener noreferrer"
                 style="display:inline-block;font-size:12px;font-weight:600;color:#0a0f1c;background:#f2c665;padding:5px 10px;border-radius:6px;text-decoration:none">
                View Project
              </a>
            </div>
          </div>
        `;
        const popup = new mapboxgl.default.Popup({ offset: 14, closeButton: true, maxWidth: "220px" }).setHTML(popupHtml);

        new mapboxgl.default.Marker({ element: el }).setLngLat([p.lng, p.lat]).setPopup(popup).addTo(map!);
        bounds.extend([p.lng, p.lat]);
      });

      if (pins.length > 1) {
        map.fitBounds(bounds, { padding: 48, maxZoom: 14, duration: 0 });
      }
    });

    return () => {
      cancelled = true;
      map?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-navy-900 text-sm text-ink-500">
        Map unavailable.
      </div>
    );
  }

  if (pins.length === 0) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-navy-900 text-center">
        <p className="text-sm font-medium text-ink-300">No properties to display yet.</p>
        <p className="text-xs text-ink-500">Check back soon.</p>
      </div>
    );
  }

  return <div ref={containerRef} className="h-full w-full" />;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
