"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Search } from "lucide-react";
import "mapbox-gl/dist/mapbox-gl.css";
import { isShortGoogleMapsLink, parseGoogleMapsLink } from "@/lib/parseGoogleMapsLink";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Dubai bounding box, biases/limits place-name search results so "Marina"
// resolves to Dubai Marina rather than a same-named place elsewhere.
const DUBAI_BBOX = "54.8,24.7,55.65,25.45";

interface PlaceSuggestion {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export function CoordinatesPicker({
  lat,
  lng,
  onChange,
  communities = [],
}: {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
  /** Searched locally first (instant, authoritative Dubai community names)
   * before falling back to Mapbox geocoding for anything more specific
   * like a building or street name. */
  communities?: { name: string; lat: number; lng: number }[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("mapbox-gl").Map | null>(null);
  const markerRef = useRef<import("mapbox-gl").Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [linkInput, setLinkInput] = useState("");
  const [linkStatus, setLinkStatus] = useState<"idle" | "loading" | "error">("idle");
  const [linkError, setLinkError] = useState("");
  const [placeQuery, setPlaceQuery] = useState("");
  const [placeSuggestions, setPlaceSuggestions] = useState<PlaceSuggestion[]>([]);
  const [placeOpen, setPlaceOpen] = useState(false);
  const [placeLoading, setPlaceLoading] = useState(false);

  function applyCoords(next: { lat: number; lng: number }) {
    onChangeRef.current(next.lat, next.lng);
    markerRef.current?.setLngLat([next.lng, next.lat]);
    mapRef.current?.flyTo({ center: [next.lng, next.lat], zoom: 15 });
  }

  async function handleUseLink(e?: React.FormEvent) {
    e?.preventDefault();
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

  function handleSelectPlace(place: PlaceSuggestion) {
    applyCoords(place);
    setPlaceQuery(place.name);
    setPlaceOpen(false);
    setPlaceSuggestions([]);
  }

  const communityMatches: PlaceSuggestion[] = useMemo(() => {
    const q = placeQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    return communities
      .filter((c) => c.name.toLowerCase().includes(q))
      .slice(0, 5)
      .map((c) => ({ id: `community:${c.name}`, name: c.name, lat: c.lat, lng: c.lng }));
  }, [placeQuery, communities]);

  const combinedSuggestions = useMemo(() => {
    const seen = new Set(communityMatches.map((c) => c.name.toLowerCase()));
    const mapboxOnly = placeSuggestions.filter((p) => !seen.has(p.name.toLowerCase()));
    return [...communityMatches, ...mapboxOnly].slice(0, 7);
  }, [communityMatches, placeSuggestions]);

  useEffect(() => {
    if (!MAPBOX_TOKEN || placeQuery.trim().length < 3) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setPlaceLoading(true);
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(placeQuery.trim())}.json?access_token=${MAPBOX_TOKEN}&bbox=${DUBAI_BBOX}&limit=5&country=ae`,
          { signal: controller.signal }
        );
        const data = await res.json();
        const results: PlaceSuggestion[] = (data.features ?? []).map(
          (f: { id: string; place_name: string; center: [number, number] }) => ({
            id: f.id,
            name: f.place_name,
            lng: f.center[0],
            lat: f.center[1],
          })
        );
        setPlaceSuggestions(results);
        setPlaceOpen(true);
      } catch {
        // aborted or network hiccup -- next keystroke retries
      } finally {
        setPlaceLoading(false);
      }
    }, 350);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [placeQuery]);

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
      <div className="relative mb-2">
        <div className="flex items-center gap-2 rounded-lg border border-navy-600 bg-navy-800 px-3 py-2">
          <Search className="h-3.5 w-3.5 shrink-0 text-ink-500" />
          <input
            value={placeQuery}
            onChange={(e) => {
              setPlaceQuery(e.target.value);
              setPlaceOpen(true);
            }}
            onFocus={() => setPlaceOpen(true)}
            onBlur={() => setTimeout(() => setPlaceOpen(false), 150)}
            placeholder="Type a location name (e.g. Downtown Dubai, Dubai Marina)"
            className="min-w-0 flex-1 bg-transparent text-xs text-ink-100 placeholder:text-ink-500 focus:outline-none"
          />
          {placeLoading && <span className="text-[10px] text-ink-500">Searching…</span>}
        </div>
        {placeOpen && combinedSuggestions.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-navy-600 bg-navy-800 shadow-lg">
            {combinedSuggestions.map((place) => (
              <li key={place.id}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelectPlace(place)}
                  className="block w-full truncate px-3 py-2 text-left text-xs text-ink-200 hover:bg-navy-700 hover:text-gold-400"
                >
                  {place.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="mb-2 flex gap-2">
        <input
          value={linkInput}
          onChange={(e) => setLinkInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleUseLink();
            }
          }}
          placeholder="Paste a Google Maps link (or lat, lng) to jump to the exact location"
          className="min-w-0 flex-1 rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-xs text-ink-100 placeholder:text-ink-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => handleUseLink()}
          disabled={linkStatus === "loading" || !linkInput.trim()}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-gold-500 px-3 py-2 text-xs font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
        >
          <MapPin className="h-3.5 w-3.5" />
          {linkStatus === "loading" ? "Locating…" : "Set Location"}
        </button>
      </div>
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
