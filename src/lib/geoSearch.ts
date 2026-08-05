// Shared geometry helpers for the map's Radius Search and Draw Search Area
// tools. Both ultimately reduce to "is this project's real lat/lng inside
// this region" -- radius search via direct distance, draw search via
// point-in-polygon -- so they share this one small, dependency-free module
// rather than pulling in a geometry library (matches this codebase's
// existing approach in smoothLine.ts / investmentScore.ts's own distance
// math).

export type GeoSearchRegion =
  | { type: "radius"; center: [number, number]; radiusKm: number }
  | { type: "polygon"; ring: [number, number][] };

// Save Map View: the map's own camera state, snapshotted into a saved
// search alongside its filter criteria (see saved_searches.map_view,
// patch_122) so loading it restores exactly where the map was, not just
// which projects matched.
export interface MapViewState {
  center: [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
  activeLayers: string[];
}

// Standard ray-casting point-in-polygon test. `ring` is a list of
// [lng, lat] vertices; does not need to be explicitly closed (first point
// repeated as the last) -- works either way.
export function pointInPolygon(lng: number, lat: number, ring: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects =
      yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

// A closed [lng, lat] ring approximating a real circle of `radiusKm` around
// `center`, for rendering the radius-search overlay and (via
// pointInPolygon) for a uniform filtering code path with Draw Search Area.
// Uses the same flat-earth approximation as approxDistanceKm -- accurate
// enough at Dubai's latitude for a search-radius visual, not for precision
// navigation.
export function buildCirclePolygon(
  center: [number, number],
  radiusKm: number,
  steps = 64
): [number, number][] {
  const [centerLng, centerLat] = center;
  const kmPerDegLat = 111;
  const kmPerDegLng = 111 * Math.cos((centerLat * Math.PI) / 180);
  const ring: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI;
    const lng = centerLng + (radiusKm * Math.cos(angle)) / kmPerDegLng;
    const lat = centerLat + (radiusKm * Math.sin(angle)) / kmPerDegLat;
    ring.push([lng, lat]);
  }
  return ring;
}
