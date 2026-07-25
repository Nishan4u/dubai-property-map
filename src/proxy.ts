import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { updateSession } from "@/lib/supabase/proxy";
import { DEVICE_TOKEN_COOKIE, hashToken } from "@/lib/broker/session";

interface RedirectEntry {
  to_path: string;
  permanent: boolean;
}

// Redirects rarely change, so cache them in-memory for a minute rather than
// hitting Supabase on every single page request.
let redirectsCache: Map<string, RedirectEntry> | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 60_000;

async function getRedirects() {
  if (redirectsCache && Date.now() - cachedAt < CACHE_TTL_MS) {
    return redirectsCache;
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data } = await supabase.from("redirects").select("from_path, to_path, permanent");
  redirectsCache = new Map((data ?? []).map((r) => [r.from_path, r]));
  cachedAt = Date.now();
  return redirectsCache;
}

const LAST_ACTIVE_THROTTLE_MS = 5 * 60 * 1000;

// One-device-per-broker enforcement. Runs after updateSession() so the
// auth cookies are already refreshed. A missing/unmatched device token
// means either a brand new (never-logged-in-here) browser, a logged-out
// device, or one that was revoked by "Logout Other Device" / admin Force
// Logout — all funnel to the same recovery page.
async function checkBrokerDevice(request: NextRequest, response: NextResponse) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: () => {},
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return response; // not signed in — let the layout's own check redirect to /login

  const deviceToken = request.cookies.get(DEVICE_TOKEN_COOKIE)?.value;
  if (!deviceToken) {
    return NextResponse.redirect(new URL("/broker-device-conflict", request.url));
  }

  const { data: session } = await supabase
    .from("broker_sessions")
    .select("id, last_active")
    .eq("device_token_hash", hashToken(deviceToken))
    .eq("status", "active")
    .maybeSingle();

  if (!session) {
    return NextResponse.redirect(new URL("/broker-device-conflict", request.url));
  }

  if (Date.now() - new Date(session.last_active).getTime() > LAST_ACTIVE_THROTTLE_MS) {
    await supabase.from("broker_sessions").update({ last_active: new Date().toISOString() }).eq("id", session.id);
  }

  return response;
}

export async function proxy(request: NextRequest) {
  const redirects = await getRedirects();
  const match = redirects.get(request.nextUrl.pathname);

  if (match) {
    return NextResponse.redirect(new URL(match.to_path, request.url), {
      status: match.permanent ? 308 : 307,
    });
  }

  const response = await updateSession(request);

  const { pathname } = request.nextUrl;
  if (pathname === "/broker" || pathname.startsWith("/broker/")) {
    return checkBrokerDevice(request, response);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
