// Shared logic for detecting an Agency White-Label Storefront tenant
// subdomain (e.g. smithrealty.dubaipropertymap.ae) from a hostname
// string. Used both server-side (src/proxy.ts, parsing the request's
// Host header) and client-side (AiChatWidget.tsx/InstallAppPrompt.tsx/
// PushNotificationPrompt.tsx, parsing window.location.hostname) --
// single source of truth so the two never drift apart.
//
// Client-side matters here specifically because a middleware rewrite is
// invisible to the browser: usePathname() on a page reached via
// NextResponse.rewrite() still reflects the ORIGINAL request path (e.g.
// "/"), never the internal destination ("/agency-storefront/[sub]") --
// so a pathname-based "hide on this route" check can never match a real
// tenant-subdomain visit. Checking the hostname directly is the only
// reliable client-side signal.
export const AGENCY_STOREFRONT_ROOT_DOMAIN = "dubaipropertymap.ae";

// Mirrors the reserved-word check constraint in
// supabase/patch_135_agency_storefront.sql exactly.
const RESERVED_SUBDOMAINS = new Set([
  "www", "api", "admin", "app", "mail", "staging", "dev", "ftp", "cdn",
  "static", "blog", "help", "support", "status", "docs", "dashboard",
  "portal", "my", "secure",
]);

export function extractAgencyStorefrontSubdomain(hostname: string | null | undefined): string | null {
  if (!hostname) return null;
  const host = hostname.split(":")[0].toLowerCase();
  if (!host.endsWith(`.${AGENCY_STOREFRONT_ROOT_DOMAIN}`)) return null;
  const sub = host.slice(0, host.length - AGENCY_STOREFRONT_ROOT_DOMAIN.length - 1);
  if (!sub || sub.includes(".") || RESERVED_SUBDOMAINS.has(sub)) return null;
  return sub;
}
