"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { clsx } from "clsx";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  ChevronLeft,
  ChevronRight,
  Compass,
  Maximize,
  Minimize,
  Minus,
  Plus,
  RotateCcw,
  RotateCw,
  Star,
  X,
} from "lucide-react";
import type { Community, Project } from "@/types";
import type { UpcomingProjectPublicRow } from "@/types/database";
import { formatAed, getDeveloper } from "@/data/mock";
import { poiLayers, metroLines, highwayLines } from "@/data/poi";
import { smoothLine } from "@/lib/smoothLine";
import { trackProjectEvent } from "@/lib/trackEvent";
import { ProjectThumb } from "@/components/ui/ProjectThumb";
import { ShareButton } from "@/components/public/ShareButton";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const POI_SOURCE_ID = "poi-source";
const LINE_SOURCE_ID = "poi-lines-source";

export function DubaiMap({
  communities,
  projects,
  selectedCommunityId,
  onSelectCommunity,
  activeLayers = [],
  sponsoredPinIds = [],
  focusProjectId = null,
  isFullscreen = false,
  onFullscreenToggle,
  upcomingProjects = [],
}: {
  communities: Community[];
  projects: Project[];
  selectedCommunityId: string | null;
  onSelectCommunity: (id: string | null) => void;
  activeLayers?: string[];
  sponsoredPinIds?: string[];
  focusProjectId?: string | null;
  isFullscreen?: boolean;
  onFullscreenToggle?: () => void;
  /** Public "Coming Soon" pins (spec section 13) -- always visible
   * regardless of subscription/gating status, since these are deliberately
   * public teasers with no protected data (just developer name/logo). */
  upcomingProjects?: UpcomingProjectPublicRow[];
}) {
  const [zoom, setZoom] = useState(1);
  const [satellite, setSatellite] = useState(false);
  const [useLiveMap, setUseLiveMap] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const mapRef = useRef<import("mapbox-gl").Map | null>(null);
  const markerElsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const propertyMarkersRef = useRef<import("mapbox-gl").Marker[]>([]);
  const upcomingMarkersRef = useRef<import("mapbox-gl").Marker[]>([]);
  const selectedCommunityIdRef = useRef(selectedCommunityId);
  selectedCommunityIdRef.current = selectedCommunityId;
  const [popupIndex, setPopupIndex] = useState(0);

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
  const communityProjects = useMemo(
    () =>
      selectedCommunity
        ? projects.filter((p) => p.communityId === selectedCommunity.id)
        : [],
    [projects, selectedCommunity]
  );
  const activeProject = communityProjects[popupIndex] ?? communityProjects[0];

  useEffect(() => {
    if (!focusProjectId) {
      setPopupIndex(0);
      return;
    }
    const idx = communityProjects.findIndex((p) => p.id === focusProjectId);
    setPopupIndex(idx >= 0 ? idx : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCommunityId, focusProjectId, communityProjects]);

  // Fly the camera to a project's exact coordinates when it's selected from
  // outside the map (e.g. clicking a card in the list panel), falling back
  // to the community's coordinates if the project has none of its own.
  useEffect(() => {
    if (!useLiveMap || !mapRef.current || !focusProjectId) return;
    const project = projects.find((p) => p.id === focusProjectId);
    if (!project) return;
    const community = communities.find((c) => c.id === project.communityId);
    const lng = project.lng ?? community?.lng;
    const lat = project.lat ?? community?.lat;
    if (lng == null || lat == null) return;
    mapRef.current.flyTo({ center: [lng, lat], zoom: 15, duration: 1200 });
  }, [focusProjectId, projects, communities, useLiveMap]);

  // Attempt to boot a real Mapbox GL map (with 3D buildings) when a token is provided.
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
        zoom: 10.5,
        pitch: 55,
        bearing: -17,
        antialias: true,
        attributionControl: false,
        // Explicit (matches Mapbox defaults) so rotation always works via a
        // trackpad/mouse (right-click-drag or ctrl+drag) and via a two-finger
        // twist on touchscreens, on top of the explicit rotate buttons.
        dragRotate: true,
        touchZoomRotate: true,
        touchPitch: true,
        pitchWithRotate: true,
        // Mapbox's default is 3px -- tight enough that ordinary finger jitter
        // during a tap on a touchscreen gets misread as a drag attempt, which
        // suppresses the click on whatever pin was underneath (markers with
        // no clickTolerance of their own inherit this). 3px matches a mouse;
        // touch needs more slack.
        clickTolerance: 8,
      });
      map.touchZoomRotate.enableRotation();
      mapRef.current = map;
      setUseLiveMap(true);

      map.on("error", (e) => {
        // eslint-disable-next-line no-console
        console.error("[DubaiMap] mapbox error:", e.error);
      });

      // Closes the pin-click popup on any other map click, instead of it
      // sitting open until the user finds the explicit X button.
      //
      // Mapbox tracks mousedown/touchstart+mouseup/touchend across its whole
      // container (not just the canvas) to tell a click from a drag, so a
      // tap on a marker fires both the marker's own click listener AND this
      // map-level "click" straight after, for the same gesture. Each marker
      // is responsible for calling stopPropagation() in its own click
      // handler so this one never sees it (the property/project pins
      // already do this -- see below); this handler assumes that's true and
      // only ever runs for a genuine background/POI-layer click.
      map.on("click", () => {
        if (selectedCommunityIdRef.current) onSelectCommunity(null);
      });

      // Mapbox measures the container at construction time; if flexbox
      // layout hasn't settled yet the canvas can end up sized 0x0 and no
      // tiles ever get requested. Re-measure once mounted and on any
      // subsequent container resize.
      requestAnimationFrame(() => map.resize());
      const resizeObserver = new ResizeObserver(() => map.resize());
      resizeObserver.observe(mapContainer.current);
      resizeObserverRef.current = resizeObserver;

      map.on("style.load", () => {
        if (cancelled) return;

        map.setFog({});

        const layers = map.getStyle()?.layers ?? [];
        const labelLayerId = layers.find(
          (l) => l.type === "symbol" && !!l.layout && "text-field" in l.layout
        )?.id;

        if (!map.getLayer("3d-buildings")) {
          map.addLayer(
            {
              id: "3d-buildings",
              source: "composite",
              "source-layer": "building",
              filter: ["==", "extrude", "true"],
              type: "fill-extrusion",
              minzoom: 13,
              paint: {
                "fill-extrusion-color": "#2c3a5c",
                "fill-extrusion-height": ["get", "height"],
                "fill-extrusion-base": ["get", "min_height"],
                "fill-extrusion-opacity": 0.85,
              },
            },
            labelLayerId
          );
        }

        if (!map.getSource(LINE_SOURCE_ID)) {
          map.addSource(LINE_SOURCE_ID, {
            type: "geojson",
            data: { type: "FeatureCollection", features: [] },
          });
          // Below the POI point layers (added next) so line paths never
          // obscure the station/POI markers sitting on top of them.
          // "poi-lines-hit" is an invisible, much wider copy of the same
          // line underneath -- the visible line is deliberately thin, which
          // makes it a tiny, hard-to-hit target (especially on touch), so
          // clicks/taps are handled against this wide invisible layer
          // instead.
          map.addLayer({
            id: "poi-lines-hit",
            type: "line",
            source: LINE_SOURCE_ID,
            layout: { "line-join": "round", "line-cap": "round" },
            paint: { "line-color": "#000000", "line-width": 20, "line-opacity": 0 },
          });
          map.addLayer({
            id: "poi-lines",
            type: "line",
            source: LINE_SOURCE_ID,
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
              "line-color": ["get", "color"],
              "line-width": 4,
              "line-opacity": 0.9,
            },
          });
          // Line name drawn directly along the path (repeating every
          // ~200px) so it's readable at a glance instead of only on tap.
          map.addLayer({
            id: "poi-line-labels",
            type: "symbol",
            source: LINE_SOURCE_ID,
            layout: {
              "symbol-placement": "line",
              "symbol-spacing": 200,
              "text-field": ["get", "name"],
              "text-size": 11,
              "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
            },
            paint: {
              "text-color": ["get", "color"],
              "text-halo-color": "#0a0f1c",
              "text-halo-width": 1.5,
            },
          });

          const showLinePopup = (
            e: import("mapbox-gl").MapMouseEvent & {
              features?: import("mapbox-gl").MapboxGeoJSONFeature[];
            }
          ) => {
            const feature = e.features?.[0];
            if (!feature) return;
            const name = feature.properties?.name as string;
            new mapboxgl.default.Popup({ closeButton: false, offset: 10, className: "dpm-popup-dark" })
              .setLngLat(e.lngLat)
              .setHTML(`<div style="font-size:12px;font-weight:600;">${name}</div>`)
              .addTo(map);
          };
          map.on("click", "poi-lines-hit", showLinePopup);
          map.on("mouseenter", "poi-lines-hit", () => {
            map.getCanvas().style.cursor = "pointer";
          });
          map.on("mouseleave", "poi-lines-hit", () => {
            map.getCanvas().style.cursor = "";
          });
        }

        if (!map.getSource(POI_SOURCE_ID)) {
          map.addSource(POI_SOURCE_ID, {
            type: "geojson",
            data: { type: "FeatureCollection", features: [] },
          });
          map.addLayer({
            id: "poi-circles",
            type: "circle",
            source: POI_SOURCE_ID,
            paint: {
              "circle-radius": 9,
              "circle-color": ["get", "color"],
              "circle-stroke-width": 1.5,
              "circle-stroke-color": "#0a0f1c",
            },
          });
          // Category icon drawn on top of the circle. Color alone repeats
          // across categories (hospitals and the metro red line are both
          // red, golf and the metro green line are both green), so shape is
          // what actually disambiguates them at a glance.
          map.addLayer({
            id: "poi-icons",
            type: "symbol",
            source: POI_SOURCE_ID,
            layout: {
              "icon-image": ["get", "icon"],
              "icon-size": 0.65,
              "icon-allow-overlap": true,
              "icon-ignore-placement": true,
            },
            paint: {
              "icon-color": "#ffffff",
              "icon-opacity": 0.95,
            },
          });
          map.addLayer({
            id: "poi-labels",
            type: "symbol",
            source: POI_SOURCE_ID,
            minzoom: 12,
            layout: {
              "text-field": ["get", "name"],
              "text-size": 10,
              "text-offset": [0, 1.2],
              "text-anchor": "top",
            },
            paint: {
              "text-color": "#e7ebf3",
              "text-halo-color": "#0a0f1c",
              "text-halo-width": 1,
            },
          });

          const showPoiPopup = (
            e: import("mapbox-gl").MapMouseEvent & {
              features?: import("mapbox-gl").MapboxGeoJSONFeature[];
            }
          ) => {
            const feature = e.features?.[0];
            if (!feature) return;
            const name = feature.properties?.name as string;
            new mapboxgl.default.Popup({ closeButton: false, offset: 10, className: "dpm-popup-dark" })
              .setLngLat(e.lngLat)
              .setHTML(`<div style="font-size:12px;font-weight:600;">${name}</div>`)
              .addTo(map);
          };
          ["poi-circles", "poi-icons"].forEach((layerId) => {
            map.on("click", layerId, showPoiPopup);
            map.on("mouseenter", layerId, () => {
              map.getCanvas().style.cursor = "pointer";
            });
            map.on("mouseleave", layerId, () => {
              map.getCanvas().style.cursor = "";
            });
          });
        }
      });

      communities.forEach((c) => {
        // The visible pin is a 36px circle, just under the ~44px minimum
        // touch target -- on mobile, where several communities can cluster
        // close together, that made it easy to tap the map background
        // instead and get no response. Padding the actual clickable element
        // out to 48px (with the circle centered inside via flex) enlarges
        // the tap target without changing how the pin looks. z-index keeps
        // it tappable even when a "Coming Soon" pin sits at the same spot.
        const el = document.createElement("div");
        el.style.cssText =
          "cursor:pointer;width:48px;height:48px;display:flex;align-items:center;justify-content:center;z-index:5;";
        el.addEventListener("click", (e) => {
          // Without this, the click also bubbles into the map's own
          // click-vs-drag tracking (bound to the whole container, not just
          // the canvas), which fires the "click elsewhere closes the popup"
          // handler below for this same tap right after this one opens it --
          // silently cancelling every tap out. The property/project pins
          // already do this; this cluster pin was the one missing it.
          e.stopPropagation();
          onSelectCommunity(
            selectedCommunityIdRef.current === c.id ? null : c.id
          );
        });
        new mapboxgl.default.Marker({ element: el })
          .setLngLat([c.lng, c.lat])
          .addTo(map);
        markerElsRef.current.set(c.id, el);
      });
    }).catch((err) => {
      // eslint-disable-next-line no-console
      console.error("[DubaiMap] failed to load mapbox-gl:", err);
    });

    return () => {
      cancelled = true;
      resizeObserverRef.current?.disconnect();
      mapRef.current?.remove();
      markerElsRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Marker DOM elements are created once above; keep their displayed count
  // and selected-state styling in sync whenever filters change the
  // underlying project set (communities themselves never change).
  useEffect(() => {
    if (!useLiveMap) return;
    communities.forEach((c) => {
      const el = markerElsRef.current.get(c.id);
      if (!el) return;
      const count = countByCommunity.get(c.id) ?? 0;
      if (count === 0) {
        el.style.display = "none";
        return;
      }
      el.style.display = "flex";
      const isSelected = c.id === selectedCommunityId;
      el.innerHTML = `<div style="width:36px;height:36px;border-radius:9999px;background:${c.pinColor};display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:700;border:2px solid ${
        isSelected ? "#f2c665" : "rgba(255,255,255,0.35)"
      };${isSelected ? "box-shadow:0 0 0 3px rgba(242,198,101,0.4);" : ""}">${count}</div>`;
    });
  }, [communities, countByCommunity, selectedCommunityId, useLiveMap]);

  // Real POI layers (Metro/Schools/Hospitals/etc.), all rendered through one
  // GeoJSON source so toggling is just a data swap rather than adding/
  // removing dozens of DOM markers. Each point uses its own color when set
  // (e.g. metro stations colored by line) falling back to the layer color.
  useEffect(() => {
    if (!useLiveMap || !mapRef.current) return;
    const map = mapRef.current;
    const source = map.getSource(POI_SOURCE_ID) as
      | import("mapbox-gl").GeoJSONSource
      | undefined;
    if (!source) return;

    const features: GeoJSON.Feature<GeoJSON.Point>[] = [];

    poiLayers
      .filter((layer) => activeLayers.includes(layer.key))
      .forEach((layer) => {
        layer.points.forEach((pt) => {
          features.push({
            type: "Feature",
            geometry: { type: "Point", coordinates: [pt.lng, pt.lat] },
            properties: {
              name: pt.name,
              color: pt.color ?? layer.color,
              icon: layer.icon,
            },
          });
        });
      });

    source.setData({ type: "FeatureCollection", features });

    const lineSource = map.getSource(LINE_SOURCE_ID) as
      | import("mapbox-gl").GeoJSONSource
      | undefined;
    if (lineSource) {
      const lineFeatures: GeoJSON.Feature<GeoJSON.LineString>[] = [];
      if (activeLayers.includes("metro")) {
        metroLines.forEach((line) => {
          lineFeatures.push({
            type: "Feature",
            // Rail alignments aren't something Directions APIs can trace
            // (unlike the highways below), so this smooths a curve through
            // the real station coordinates instead of leaving them as
            // sharp straight segments station-to-station.
            geometry: { type: "LineString", coordinates: smoothLine(line.coordinates) },
            properties: { name: line.name, color: line.color },
          });
        });
      }
      if (activeLayers.includes("highways")) {
        highwayLines.forEach((line) => {
          lineFeatures.push({
            type: "Feature",
            geometry: { type: "LineString", coordinates: line.coordinates },
            properties: { name: line.name, color: line.color },
          });
        });
      }
      lineSource.setData({ type: "FeatureCollection", features: lineFeatures });
    }
  }, [activeLayers, useLiveMap]);

  // Show each individual property's exact pin (small dots) once a
  // community is selected — this is in addition to the community-level
  // cluster pin, so drilling into a community reveals real per-property
  // locations instead of everything stacking on one point.
  useEffect(() => {
    if (!useLiveMap || !mapRef.current) return;
    const map = mapRef.current;

    propertyMarkersRef.current.forEach((m) => m.remove());
    propertyMarkersRef.current = [];

    if (!selectedCommunity) return;

    import("mapbox-gl").then((mapboxgl) => {
      communityProjects.forEach((p, i) => {
        if (p.lat === null || p.lat === undefined || p.lng === null || p.lng === undefined) {
          return;
        }
        const el = document.createElement("div");
        el.style.cursor = "pointer";
        const isActive = i === popupIndex;
        const isSponsored = sponsoredPinIds.includes(p.id);
        el.innerHTML = isSponsored
          ? `<div style="position:relative;width:20px;height:20px;border-radius:9999px;background:#f2c665;border:2px solid #0a0f1c;box-shadow:0 0 0 3px rgba(242,198,101,0.35),0 1px 4px rgba(0,0,0,0.5);"></div>`
          : `<div style="width:16px;height:16px;border-radius:9999px;background:${
              isActive ? "#f2c665" : "#ffffff"
            };border:2px solid #0a0f1c;box-shadow:0 1px 4px rgba(0,0,0,0.5);"></div>`;
        el.title = isSponsored ? `${p.name} (Sponsored)` : p.name;
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          setPopupIndex(i);
          trackProjectEvent(p.id, "map_click");
        });
        const marker = new mapboxgl.default.Marker({ element: el })
          .setLngLat([p.lng, p.lat])
          .addTo(map);
        propertyMarkersRef.current.push(marker);
      });
    });

    return () => {
      propertyMarkersRef.current.forEach((m) => m.remove());
      propertyMarkersRef.current = [];
    };
  }, [communityProjects, selectedCommunity, popupIndex, useLiveMap, sponsoredPinIds]);

  // "Coming Soon" pins (spec section 13) -- always shown, independent of
  // community selection, with an animated marker. The popup deliberately
  // only ever contains developer name/logo/"Coming Soon" -- never the
  // internal project name, which this component never even receives (the
  // public query it's fed from excludes it at the database level).
  useEffect(() => {
    if (!useLiveMap || !mapRef.current) return;
    const map = mapRef.current;

    upcomingMarkersRef.current.forEach((m) => m.remove());
    upcomingMarkersRef.current = [];

    import("mapbox-gl").then((mapboxgl) => {
      upcomingProjects.forEach((u) => {
        const el = document.createElement("div");
        // Lower than the community pins' z-index (5) -- when a "Coming
        // Soon" pin lands at nearly the same spot as a community pin, the
        // community pin (which opens the real project popup) should still
        // win the tap instead of this one silently swallowing it.
        el.style.cssText = "cursor:pointer;z-index:1;";
        el.innerHTML = `
          <div style="position:relative;width:22px;height:22px;">
            <div style="position:absolute;inset:0;border-radius:9999px;background:#38bdf8;animation:dpm-upcoming-pulse 1.8s ease-out infinite;"></div>
            <div style="position:absolute;inset:5px;border-radius:9999px;background:#38bdf8;border:2px solid #0a0f1c;"></div>
          </div>`;

        // Built via safe DOM APIs (not setHTML/innerHTML string interpolation)
        // since developer_name is a developer-editable field -- interpolating
        // it into an HTML string would be a stored XSS vector.
        const content = document.createElement("div");
        content.style.cssText = "display:flex;align-items:center;gap:8px;";
        if (u.logo_url) {
          const img = document.createElement("img");
          img.src = u.logo_url;
          img.alt = "";
          img.style.cssText = "height:28px;width:28px;object-fit:contain;border-radius:6px;background:#ffffff;padding:2px;flex-shrink:0;";
          content.appendChild(img);
        }
        const textWrap = document.createElement("div");
        const nameEl = document.createElement("div");
        nameEl.style.cssText = "font-size:12px;font-weight:700;color:#0a0f1c;";
        nameEl.textContent = u.developer_name;
        const labelEl = document.createElement("div");
        labelEl.style.cssText = "font-size:10px;font-weight:600;color:#0369a1;";
        labelEl.textContent = "Coming Soon";
        textWrap.appendChild(nameEl);
        textWrap.appendChild(labelEl);
        content.appendChild(textWrap);

        const popup = new mapboxgl.default.Popup({ closeButton: false, offset: 16 }).setDOMContent(content);
        const marker = new mapboxgl.default.Marker({ element: el })
          .setLngLat([u.lng, u.lat])
          .setPopup(popup)
          .addTo(map);
        upcomingMarkersRef.current.push(marker);
      });
    });

    return () => {
      upcomingMarkersRef.current.forEach((m) => m.remove());
      upcomingMarkersRef.current = [];
    };
  }, [upcomingProjects, useLiveMap]);

  function handleZoomIn() {
    if (mapRef.current) mapRef.current.zoomIn();
    else setZoom((z) => Math.min(2, z + 0.2));
  }

  function handleZoomOut() {
    if (mapRef.current) mapRef.current.zoomOut();
    else setZoom((z) => Math.max(0.6, z - 0.2));
  }

  function handleResetView() {
    if (mapRef.current) {
      mapRef.current.easeTo({ pitch: 55, bearing: -17, zoom: 10.5, duration: 600 });
    } else {
      setZoom(1);
    }
  }

  function handleStyleToggle(nextSatellite: boolean) {
    setSatellite(nextSatellite);
    if (mapRef.current) {
      mapRef.current.setStyle(
        nextSatellite
          ? "mapbox://styles/mapbox/satellite-streets-v12"
          : "mapbox://styles/mapbox/dark-v11"
      );
    }
  }

  function handleRotateLeft() {
    if (mapRef.current) {
      mapRef.current.rotateTo(mapRef.current.getBearing() - 30, { duration: 300 });
    }
  }

  function handleRotateRight() {
    if (mapRef.current) {
      mapRef.current.rotateTo(mapRef.current.getBearing() + 30, { duration: 300 });
    }
  }

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

      <div
        ref={mapContainer}
        style={{ position: "absolute", inset: 0 }}
      />

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
          onClick={handleZoomIn}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-300 hover:bg-navy-800 hover:text-ink-100"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-300 hover:bg-navy-800 hover:text-ink-100"
        >
          <Minus className="h-4 w-4" />
        </button>
        <div className="my-0.5 h-px bg-navy-700" />
        <button
          onClick={handleRotateLeft}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-300 hover:bg-navy-800 hover:text-ink-100"
          title="Rotate left"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          onClick={handleRotateRight}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-300 hover:bg-navy-800 hover:text-ink-100"
          title="Rotate right"
        >
          <RotateCw className="h-4 w-4" />
        </button>
        <button
          onClick={handleResetView}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-300 hover:bg-navy-800 hover:text-ink-100"
          title="Reset view"
        >
          <Compass className="h-4 w-4" />
        </button>
      </div>

      {/* Map / Satellite toggle + fullscreen */}
      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
        <div className="flex items-center gap-1 rounded-xl border border-navy-700 bg-navy-900/90 p-1 backdrop-blur">
          <button
            onClick={() => handleStyleToggle(false)}
            className={clsx(
              "rounded-lg px-3 py-1.5 text-xs font-medium",
              !satellite ? "bg-gold-500 text-navy-950" : "text-ink-300"
            )}
          >
            Map
          </button>
          <button
            onClick={() => handleStyleToggle(true)}
            className={clsx(
              "rounded-lg px-3 py-1.5 text-xs font-medium",
              satellite ? "bg-gold-500 text-navy-950" : "text-ink-300"
            )}
          >
            Satellite
          </button>
        </div>
        <button
          onClick={onFullscreenToggle}
          title={isFullscreen ? "Exit full screen" : "Full screen"}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-navy-700 bg-navy-900/90 text-ink-300 backdrop-blur hover:text-ink-100"
        >
          {isFullscreen ? (
            <Minimize className="h-4 w-4" />
          ) : (
            <Maximize className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Pin click popup — browses every property in the selected community */}
      {selectedCommunity && activeProject && (
        <div className="absolute bottom-28 left-1/2 z-20 w-80 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-xl border border-navy-700 bg-navy-900 shadow-2xl sm:left-24 sm:translate-x-0">
          {/* overflow-hidden lives here, not on the card itself -- the Share
              button below opens a dropdown that needs to extend past the
              card's own height, which the card clipping it would cut off. */}
          <div className="relative overflow-hidden rounded-t-xl">
            <ProjectThumb
              gradient={activeProject.gradient}
              imageUrl={activeProject.coverImageUrl}
              logoUrl={activeProject.logoUrl ?? activeProject.developerLogoUrl}
              className="h-28 w-full"
            />
            {communityProjects.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setPopupIndex(
                      (i) => (i - 1 + communityProjects.length) % communityProjects.length
                    )
                  }
                  className="absolute left-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-navy-950/70 text-ink-200 hover:text-ink-100"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() =>
                    setPopupIndex((i) => (i + 1) % communityProjects.length)
                  }
                  className="absolute right-9 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-navy-950/70 text-ink-200 hover:text-ink-100"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
            <button
              onClick={() => onSelectCommunity(null)}
              className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-navy-950/70 text-ink-300 hover:text-ink-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="p-3">
            <p className="flex items-center justify-between text-xs font-medium text-gold-400">
              <span>
                {selectedCommunity.name} · {communityProjects.length} projects
              </span>
              {communityProjects.length > 1 && (
                <span className="text-ink-500">
                  {popupIndex + 1} / {communityProjects.length}
                </span>
              )}
            </p>
            <h4 className="mt-0.5 flex items-center justify-between gap-1.5 text-sm font-semibold text-ink-100">
              <span className="flex min-w-0 items-center gap-1.5 truncate">
                <span className="truncate">{activeProject.name}</span>
                {sponsoredPinIds.includes(activeProject.id) && (
                  <span className="shrink-0 rounded-full bg-gold-500/15 px-1.5 py-0.5 text-[10px] font-medium text-gold-400">
                    Sponsored
                  </span>
                )}
              </span>
              <ShareButton
                targetType="project"
                targetId={activeProject.id}
                title={activeProject.name}
                path={`/projects/${activeProject.slug}`}
                compact
              />
            </h4>
            <p className="text-xs text-ink-500">
              by{" "}
              {activeProject.developerName ??
                getDeveloper(activeProject.developerId)?.name}
            </p>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="font-semibold text-ink-100">
                {formatAed(activeProject.priceFromAed)}
              </span>
              <span className="flex items-center gap-1 text-ink-400">
                <Star className="h-3 w-3 fill-gold-400 text-gold-400" />
                {activeProject.rating || "New"}
              </span>
            </div>
            {(activeProject.videoUrl || activeProject.virtualTourUrl) && (
              <div className="mt-2 flex gap-3 text-xs">
                {activeProject.videoUrl && (
                  <a
                    href={activeProject.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-400 hover:underline"
                  >
                    ▶ Video
                  </a>
                )}
                {activeProject.virtualTourUrl && (
                  <a
                    href={activeProject.virtualTourUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-400 hover:underline"
                  >
                    360° Virtual Tour
                  </a>
                )}
              </div>
            )}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link
                href={`/projects/${activeProject.slug}`}
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
