import type { PoiPoint } from "@/data/poi";

// Same flat-earth approximation used for the "near a metro station" filter —
// fine at Dubai's latitude for sorting nearby places, not for navigation.
function approxDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const dLat = (lat1 - lat2) * 111;
  const dLng = (lng1 - lng2) * 111 * Math.cos((lat1 * Math.PI) / 180);
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

export interface NearbyPoint extends PoiPoint {
  distanceKm: number;
}

export function nearestPoints(
  origin: { lat: number; lng: number },
  points: PoiPoint[],
  count = 4
): NearbyPoint[] {
  return points
    .map((p) => ({ ...p, distanceKm: approxDistanceKm(origin.lat, origin.lng, p.lat, p.lng) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, count);
}
