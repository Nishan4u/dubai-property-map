// Mapbox Static Images API -- used for the "Mapbox Map Card" share/OG image
// (spec: Share Feature). No client-side map instance needed, just a URL.
export function getMapboxStaticImageUrl(lat: number, lng: number, options?: { width?: number; height?: number }) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) return null;

  const width = options?.width ?? 1200;
  const height = options?.height ?? 630;
  const overlay = `pin-s+f4c430(${lng},${lat})`;

  return `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${overlay}/${lng},${lat},14/${width}x${height}@2x?access_token=${token}`;
}
