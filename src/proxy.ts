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

interface AdminIpCache {
  enabled: boolean;
  allowedIps: Set<string>;
}
let ipCache: AdminIpCache | null = null;
let ipCachedAt = 0;

// Uses the service-role key, not the anon key -- this table lists which
// IPs bypass admin-panel protection, so unlike getRedirects() it must
// never be publicly readable (no "public read" RLS policy exists on it).
// Same 60s cache TTL as getRedirects(): staleness only ever makes a
// just-enabled restriction or a just-removed IP take up to 60s to take
// effect, never the reverse, and /admin/settings stays reachable
// regardless of cache state.
async function getAdminIpRestrictions(): Promise<AdminIpCache> {
  if (ipCache && Date.now() - ipCachedAt < CACHE_TTL_MS) {
    return ipCache;
  }
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const [{ data: settings }, { data: entries }] = await Promise.all([
    admin.from("admin_ip_restrictions_settings").select("enabled").eq("id", true).maybeSingle(),
    admin.from("admin_ip_allowlist").select("ip_address"),
  ]);
  ipCache = {
    enabled: settings?.enabled ?? false,
    allowedIps: new Set((entries ?? []).map((e) => e.ip_address as string)),
  };
  ipCachedAt = Date.now();
  return ipCache;
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

  // A broker who hasn't finished onboarding yet (still needs to claim
  // their broker_id via BrokerOnboarding) can never have a device token
  // -- that's only issued by /api/broker/session/claim, which itself
  // requires broker_id to already exist. Without this check, no new
  // broker could ever reach the onboarding form: visiting /broker to see
  // it would always redirect to /broker-device-conflict first.
  const { data: profile } = await supabase.from("profiles").select("broker_id").eq("id", user.id).maybeSingle();
  if (!profile?.broker_id) return response;

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

  // /admin/settings is deliberately exempted so a super-admin can always
  // reach it to fix a misconfigured allowlist -- it's still gated by the
  // existing admin/layout.tsx role check regardless of IP, and only a
  // super-admin can write to these tables at all (RLS). /api/admin/* is
  // included since those routes don't go through admin/layout.tsx's
  // check the way page routes do.
  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");
  if ((isAdminPath && pathname !== "/admin/settings") || pathname.startsWith("/api/admin")) {
    const { enabled, allowedIps } = await getAdminIpRestrictions();
    if (enabled) {
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? null;
      if (!ip || !allowedIps.has(ip)) {
        return NextResponse.redirect(new URL("/admin-ip-blocked", request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
