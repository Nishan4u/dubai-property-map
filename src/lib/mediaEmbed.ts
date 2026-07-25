// Converts common video share links into an embeddable iframe URL. Returns
// null for unrecognized providers so callers can fall back to a plain link
// instead of guessing at an embed format that won't work.
export function getVideoEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      if (u.pathname.startsWith("/embed/")) return url;
      const id = u.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname === "youtu.be") {
      const id = u.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    return null;
  } catch {
    return null;
  }
}

// A keyless Google Maps embed centered on a real lat/lng (or a place name as
// a fallback) — genuinely interactive, no API key needed.
export function getLocationEmbedUrl({
  lat,
  lng,
  fallbackQuery,
}: {
  lat?: number | null;
  lng?: number | null;
  fallbackQuery: string;
}): string {
  const query = lat != null && lng != null ? `${lat},${lng}` : fallbackQuery;
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`;
}
