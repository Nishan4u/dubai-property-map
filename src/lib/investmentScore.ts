import type { Project } from "@/types";
import { poiLayers } from "@/data/poi";

const metroStations = poiLayers.find((l) => l.key === "metro")?.points ?? [];

// Approximate distance in km between two lat/lng points (fine at Dubai's
// latitude for a "how close is the nearest metro station" check — not
// meant for precise navigation).
function approxDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
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

// Transparent, computed-from-real-fields score — not a fabricated market
// statistic. Combines rating, review volume, and the "high-roi" tag that
// developers/admins set on real listings.
export function getInvestmentScore(project: Project): number {
  const ratingScore = (project.rating ?? 0) * 15; // up to 75
  const reviewScore = Math.min(15, (project.reviews ?? 0) / 10); // up to 15
  const roiBonus = project.tags.includes("high-roi") ? 10 : 0; // up to 10
  return Math.round(Math.min(100, ratingScore + reviewScore + roiBonus));
}
