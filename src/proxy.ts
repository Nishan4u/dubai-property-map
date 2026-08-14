import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { updateSession } from "@/lib/supabase/proxy";
import { DEVICE_TOKEN_COOKIE, hashToken } from "@/lib/broker/session";
import { extractAgencyStorefrontSubdomain, AGENCY_STOREFRONT_ROOT_DOMAIN } from "@/lib/agencySubdomain";

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

// Agency White-Label Storefront -- subdomain detection lives in
// src/lib/agencySubdomain.ts (shared with client components that also
// need it; see that file's header comment for why). Every OTHER
// subdomain of dubaipropertymap.ae besides the reserved words gets
// rewritten to the storefront route regardless of whether it was ever
// actually claimed -- the destination page does its own service-role
// lookup and renders a clean not-found state, exactly like a stale
// /present/[token] or /l/[slug] link does today. This intentionally
// avoids an extra Supabase round-trip on every single request just to
// answer a question the destination page re-derives anyway.

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

interface SubscriptionGate {
  pathPrefix: string;
  subscribePath: string;
  profileColumn: "broker_id" | "salesperson_id" | "broker_agency_id";
  table: "brokers" | "salespersons" | "brokerages";
}

const SUBSCRIPTION_GATES: SubscriptionGate[] = [
  { pathPrefix: "/broker", subscribePath: "/broker/subscription", profileColumn: "broker_id", table: "brokers" },
  { pathPrefix: "/salesperson", subscribePath: "/salesperson/subscription", profileColumn: "salesperson_id", table: "salespersons" },
  { pathPrefix: "/broker-agency", subscribePath: "/broker-agency/subscription", profileColumn: "broker_agency_id", table: "brokerages" },
];

// Full portal lockout until subscription_status is 'active' -- previously
// the only place that actually checked subscription status was the
// property-request submission panel; every other page (dashboard home,
// clients, calendar, referral, etc.) rendered fine regardless. Deliberately
// exempts each portal's own /subscription path, otherwise a never-
// subscribed account could never reach the one page that lets them pay.
//
// No extra awareness of account_status/license-upload/deactivation state
// is needed here: each portal's layout.tsx already renders its own
// pending-approval / rejected / suspended / license-upload / deactivated
// screen unconditionally, for whatever child path was requested --
// including the subscription path this redirects to -- so those accounts
// see the *correct* status screen either way, this redirect is just a
// safe no-op for them.
async function checkSubscriptionGate(request: NextRequest, response: NextResponse) {
  const { pathname } = request.nextUrl;
  const gate = SUBSCRIPTION_GATES.find((g) => pathname === g.pathPrefix || pathname.startsWith(`${g.pathPrefix}/`));
  if (!gate || pathname === gate.subscribePath) return response;

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
  if (!user) return response; // not signed in -- the layout's own check redirects to /login

  const { data: profile } = await supabase.from("profiles").select(gate.profileColumn).eq("id", user.id).maybeSingle();
  const accountId = (profile as Record<string, string | null> | null)?.[gate.profileColumn];
  if (!accountId) return response; // onboarding not finished yet -- let the layout handle it

  const { data: account } = await supabase.from(gate.table).select("subscription_status").eq("id", accountId).maybeSingle();
  if (account && account.subscription_status !== "active") {
    return NextResponse.redirect(new URL(gate.subscribePath, request.url));
  }

  return response;
}

// Same portal-page list AiChatWidget.tsx already hides itself on (admin/
// developer/broker/broker-agency/salesperson/staff), plus /embed -- the
// Developer Embeddable Map Widget renders inside an <iframe> on someone
// else's website, where injecting AdSense would be an unwanted intrusion
// into a page this site doesn't own. Forwarded to AnalyticsScripts.tsx via
// the x-no-ads request header (see updateSession) so it can skip rendering
// the adsbygoogle.js script on exactly these paths -- GA/GTM/Meta/TikTok
// are untouched, only ads are suppressed here.
const NO_ADS_PATH_PREFIXES = ["/admin", "/dashboard", "/broker", "/broker-agency", "/salesperson", "/staff", "/embed"];

// Guards against an unrelated domain's stale/leftover DNS pointing an A
// record at this same server IP and silently getting served the real
// app -- confirmed live: hitad.ae (an unrelated UAE classifieds site)
// resolves to this exact IP with no matching TLS cert or vhost, and
// Google had indexed this site's own /favorites page under hitad.ae's
// URL as a result, since Nginx has no server_name block for it and falls
// through to whatever the default vhost is. Fixed at the app layer
// (rather than an Nginx config change, which would need direct VPS
// access this workflow doesn't have) -- any Host header that isn't the
// root domain, one of its subdomains (agency storefronts, www, or plain
// local dev) gets a bare 404 before any other work runs, so no page
// content, redirect target, or app structure is ever disclosed to a
// hostname this site doesn't recognize as its own.
function isRecognizedHost(hostname: string | null): boolean {
  if (!hostname) return false;
  const host = hostname.split(":")[0].toLowerCase();
  return (
    host === AGENCY_STOREFRONT_ROOT_DOMAIN ||
    host === `www.${AGENCY_STOREFRONT_ROOT_DOMAIN}` ||
    host.endsWith(`.${AGENCY_STOREFRONT_ROOT_DOMAIN}`) ||
    host === "localhost" ||
    host.endsWith(".localhost")
  );
}

export async function proxy(request: NextRequest) {
  if (!isRecognizedHost(request.headers.get("host"))) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // Agency White-Label Storefront -- checked first and returns
  // immediately, before any of the path-based logic below (redirects,
  // ads, subscription gates, admin IP allowlist), none of which apply to
  // a tenant subdomain. A pure no-op for the normal dubaipropertymap.ae/
  // www host and for local dev (localhost never matches ROOT_DOMAIN).
  const tenantSubdomain = extractAgencyStorefrontSubdomain(request.headers.get("host"));
  // API routes must never be rewritten -- the storefront page's own
  // client-side fetch("/api/agency-storefront/...") runs on this same
  // tenant host and would otherwise get caught by this same rewrite,
  // turning its JSON request into the page's HTML instead of real data.
  if (tenantSubdomain && !request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.rewrite(new URL(`/agency-storefront/${tenantSubdomain}`, request.url));
  }

  const redirects = await getRedirects();
  const match = redirects.get(request.nextUrl.pathname);

  if (match) {
    return NextResponse.redirect(new URL(match.to_path, request.url), {
      status: match.permanent ? 308 : 307,
    });
  }

  const { pathname } = request.nextUrl;
  const isNoAdsPath = NO_ADS_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  let response = await updateSession(request, { "x-no-ads": isNoAdsPath ? "1" : "0" });
  if (pathname === "/broker" || pathname.startsWith("/broker/")) {
    const deviceResult = await checkBrokerDevice(request, response);
    if (deviceResult !== response) return deviceResult;
    response = deviceResult;
  }

  const gateResult = await checkSubscriptionGate(request, response);
  if (gateResult !== response) return gateResult;
  response = gateResult;

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
