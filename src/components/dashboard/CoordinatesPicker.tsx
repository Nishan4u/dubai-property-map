"use client";

import { useEffect, useRef } from "react";
import "mapbox-gl/dist/mapbox-gl.css";

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
      <div ref={containerRef} className="h-56 w-full rounded-lg" />
      <p className="mt-1 text-xs text-ink-500">
        Click the map or drag the pin to set the exact location.
      </p>
    </div>
  );
}
