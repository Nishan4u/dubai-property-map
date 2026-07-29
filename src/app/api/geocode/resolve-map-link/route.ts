import { NextRequest, NextResponse } from "next/server";
import { parseGoogleMapsLink } from "@/lib/parseGoogleMapsLink";

// Short Google Maps links (maps.app.goo.gl, goo.gl/maps, g.co) don't carry
// coordinates in the URL itself -- only the redirect target does, and that
// redirect can't be followed client-side (Google's server doesn't send
// CORS headers for it). This route follows it server-side instead.
//
// Restricted to Google's own map-link hostnames specifically to avoid
// turning this into an open URL-fetching proxy (SSRF) -- it must not be
// usable to make the server fetch arbitrary attacker-supplied URLs.
const ALLOWED_HOSTS = new Set(["maps.app.goo.gl", "goo.gl", "g.co", "www.google.com", "google.com", "maps.google.com"]);

export async function POST(request: NextRequest) {
  const { url } = await request.json();
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "url is required." }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return NextResponse.json({ error: "Not a valid URL." }, { status: 400 });
  }
  if (!ALLOWED_HOSTS.has(parsed.hostname)) {
    return NextResponse.json({ error: "Only Google Maps links are supported." }, { status: 400 });
  }

  try {
    const res = await fetch(parsed.toString(), { redirect: "follow" });
    const finalUrl = res.url;
    const coords = parseGoogleMapsLink(finalUrl);
    if (!coords) {
      return NextResponse.json({ error: "Couldn't find coordinates in that link." }, { status: 422 });
    }
    return NextResponse.json(coords);
  } catch {
    return NextResponse.json({ error: "Couldn't resolve that link." }, { status: 502 });
  }
}
