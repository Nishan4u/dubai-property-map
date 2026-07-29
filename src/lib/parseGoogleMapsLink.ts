// Extracts lat/lng from a pasted Google Maps URL or raw "lat, lng" text.
// Checked in priority order: a place's exact pinned coordinates (!3d/!4d)
// beat the viewport center (@lat,lng) beat the legacy ?q= param.
export function parseGoogleMapsLink(input: string): { lat: number; lng: number } | null {
  const text = input.trim();

  const placeMatch = text.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (placeMatch) return { lat: Number(placeMatch[1]), lng: Number(placeMatch[2]) };

  const viewportMatch = text.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (viewportMatch) return { lat: Number(viewportMatch[1]), lng: Number(viewportMatch[2]) };

  const qMatch = text.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) return { lat: Number(qMatch[1]), lng: Number(qMatch[2]) };

  const plainMatch = text.match(/^(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)$/);
  if (plainMatch) return { lat: Number(plainMatch[1]), lng: Number(plainMatch[2]) };

  return null;
}

// Short links (maps.app.goo.gl, goo.gl/maps, g.co) don't contain
// coordinates directly -- they need a redirect resolved first.
export function isShortGoogleMapsLink(input: string): boolean {
  try {
    const url = new URL(input.trim());
    return ["maps.app.goo.gl", "goo.gl", "g.co"].includes(url.hostname);
  } catch {
    return false;
  }
}
