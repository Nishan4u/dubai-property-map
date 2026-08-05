import type { Project } from "@/types";
import { poiLayers } from "@/data/poi";

const metroStations = poiLayers.find((l) => l.key === "metro")?.points ?? [];

// Approximate distance in km between two lat/lng points (fine at Dubai's
// latitude for a "how close is the nearest metro station" check — not
// meant for precise navigation). Exported for reuse by the map's Radius
// Search (src/lib/geoSearch.ts).
export function approxDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const dLat = (lat1 - lat2) * 111;
  const dLng = (lng1 - lng2) * 111 * Math.cos((lat1 * Math.PI) / 180);
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

export function distanceToNearestMetroKm(project: Project): number | null {
  if (project.lat == null || project.lng == null || metroStations.length === 0) {
    return null;
  }
  return Math.min(
    ...metroStations.map((s) => approxDistanceKm(project.lat!, project.lng!, s.lat, s.lng))
  );
}

export function isNearMetro(project: Project, radiusKm = 1.5): boolean {
  const d = distanceToNearestMetroKm(project);
  return d !== null && d <= radiusKm;
}

export interface NearestPoi {
  categoryKey: string;
  categoryLabel: string;
  name: string;
  distanceKm: number;
}

// Nearest named point per requested POI category (metro, malls, schools,
// etc. -- see src/data/poi.ts) to a given lat/lng. Powers the project
// page's "Nearby" distances -- every result is a real, named place with
// a real computed distance, never an invented figure.
export function findNearestByCategory(
  lat: number,
  lng: number,
  categoryKeys: string[]
): NearestPoi[] {
  const results: NearestPoi[] = [];
  for (const key of categoryKeys) {
    const layer = poiLayers.find((l) => l.key === key);
    if (!layer || layer.points.length === 0) continue;
    let nearest = layer.points[0];
    let nearestDist = approxDistanceKm(lat, lng, nearest.lat, nearest.lng);
    for (const point of layer.points.slice(1)) {
      const d = approxDistanceKm(lat, lng, point.lat, point.lng);
      if (d < nearestDist) {
        nearest = point;
        nearestDist = d;
      }
    }
    results.push({
      categoryKey: key,
      categoryLabel: layer.label,
      name: nearest.name,
      distanceKm: nearestDist,
    });
  }
  return results.sort((a, b) => a.distanceKm - b.distanceKm);
}

// Transparent, computed-from-real-fields score — not a fabricated market
// statistic. Combines rating, review volume, and the "high-roi" tag that
// developers/admins set on real listings.
export function getInvestmentScore(project: Project): number {
  const ratingScore = (project.rating ?? 0) * 15; // up to 75
  const reviewScore = Math.min(15, (project.reviews ?? 0) / 10); // up to 15
  const roiBonus = project.tags.includes("high-roi") ? 10 : 0; // up to 10
  return Math.round(Math.min(100, ratingScore + reviewScore + roiBonus));
}
