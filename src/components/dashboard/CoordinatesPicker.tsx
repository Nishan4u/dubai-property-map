"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import "mapbox-gl/dist/mapbox-gl.css";
import { isShortGoogleMapsLink, parseGoogleMapsLink } from "@/lib/parseGoogleMapsLink";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export function CoordinatesPicker({
  lat,
  lng,
  onChange,
}: {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("mapbox-gl").Map | null>(null);
  const markerRef = useRef<import("mapbox-gl").Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [linkInput, setLinkInput] = useState("");
  const [linkStatus, setLinkStatus] = useState<"idle" | "loading" | "error">("idle");
  const [linkError, setLinkError] = useState("");

  function applyCoords(next: { lat: number; lng: number }) {
    onChangeRef.current(next.lat, next.lng);
    markerRef.current?.setLngLat([next.lng, next.lat]);
    mapRef.current?.flyTo({ center: [next.lng, next.lat], zoom: 15 });
  }

  async function handleUseLink(e: React.FormEvent) {
    e.preventDefault();
    if (!linkInput.trim()) return;
    setLinkStatus("loading");
    setLinkError("");

    const direct = parseGoogleMapsLink(linkInput);
    if (direct) {
      applyCoords(direct);
      setLinkStatus("idle");
      return;
    }

    if (!isShortGoogleMapsLink(linkInput)) {
      setLinkStatus("error");
      setLinkError("Couldn't find coordinates in that link or text. Paste a Google Maps link or \"lat, lng\".");
      return;
    }

    try {
      const res = await fetch("/api/geocode/resolve-map-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: linkInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't resolve that link.");
      applyCoords(data);
      setLinkStatus("idle");
    } catch (err) {
      setLinkStatus("error");
      setLinkError(err instanceof Error ? err.message : "Couldn't resolve that link.");
    }
  }

  useEffect(() => {
    if (!containerRef.current || !MAPBOX_TOKEN || mapRef.current) return;

    import("mapbox-gl").then((mapboxgl) => {
      if (!containerRef.current || mapRef.current) return;
      mapboxgl.default.accessToken = MAPBOX_TOKEN;
      const map = new mapboxgl.default.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [lng, lat],
        zoom: 12,
      });
      mapRef.current = map;

      const marker = new mapboxgl.default.Marker({ color: "#e3ab3d", draggable: true })
        .setLngLat([lng, lat])
        .addTo(map);
      markerRef.current = marker;

      marker.on("dragend", () => {
        const pos = marker.getLngLat();
        onChangeRef.current(pos.lat, pos.lng);
      });

      map.on("click", (e) => {
        marker.setLngLat(e.lngLat);
        onChangeRef.current(e.lngLat.lat, e.lngLat.lng);
      });
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (markerRef.current) {
      const current = markerRef.current.getLngLat();
      if (Math.abs(current.lat - lat) > 0.0001 || Math.abs(current.lng - lng) > 0.0001) {
        markerRef.current.setLngLat([lng, lat]);
        mapRef.current?.setCenter([lng, lat]);
      }
    }
  }, [lat, lng]);

  if (!MAPBOX_TOKEN) {
    return (
      <p className="text-xs text-ink-500">
        Map picker unavailable (no Mapbox token configured).
      </p>
    );
  }

  return (
    <div>
      <form onSubmit={handleUseLink} className="mb-2 flex gap-2">
        <input
          value={linkInput}
          onChange={(e) => setLinkInput(e.target.value)}
          placeholder="Paste a Google Maps link (or lat, lng) to jump to the exact location"
          className="min-w-0 flex-1 rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-xs text-ink-100 placeholder:text-ink-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={linkStatus === "loading" || !linkInput.trim()}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-gold-500 px-3 py-2 text-xs font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
        >
          <MapPin className="h-3.5 w-3.5" />
          {linkStatus === "loading" ? "Locating…" : "Set Location"}
        </button>
      </form>
      {linkStatus === "error" && (
        <p className="mb-2 text-xs font-medium text-rose-400">{linkError}</p>
      )}
      <div ref={containerRef} className="h-56 w-full rounded-lg" />
      <p className="mt-1 text-xs text-ink-500">
        Click the map or drag the pin to set the exact location.
      </p>
    </div>
  );
}
