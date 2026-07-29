import { NextRequest, NextResponse } from "next/server";

// This route deliberately does NOT consume the token or confirm the email --
// it only forwards the token to a page that requires an actual user gesture
// (a button click, POST to verify-email/confirm) before anything happens.
//
// Found during QA: every verification token's used_at was ~15 seconds after
// created_at across multiple different real users -- far faster than a
// human opening an email client and clicking, and consistent across
// accounts. That's an email security scanner ("Safe Links"-style link
// prefetching) auto-following the link in the email and burning the
// single-use token before the real recipient ever clicks it, so by the time
// they do click, verification fails with "expired or invalid". A bare GET
// is exactly what those scanners issue, so a GET must never be able to
// complete a one-time action -- see verify-email/confirm/route.ts for where
// the actual consumption now happens.
// This is a plain top-level navigation (clicking a link in an email), not a
// fetch/CORS request, so the browser never sends an Origin header here --
// unlike the POST routes elsewhere in this app, there's no reliable
// per-request signal to prefer. Confirmed live in production: the request's
// own URL/Host resolves to the internal "localhost:3000" the Node process
// is bound to behind the reverse proxy, not the public domain, so
// redirecting with that origin sends real users to an unreachable link.
// Same reasoning as the NEXT_PUBLIC_SITE_URL fallback in
// emailVerification.ts -- this app has exactly one production domain, so a
// forwarded-host header (when present) or the known domain is more
// trustworthy here than anything derived from the request URL itself.
function resolveOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  if (forwardedHost) return `${forwardedProto}://${forwardedHost}`;
  return process.env.NEXT_PUBLIC_SITE_URL || "https://dubaipropertymap.ae";
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origin = resolveOrigin(request);
  const token = searchParams.get("token");
  const next = searchParams.get("next") ?? "/";

  if (!token) {
    return NextResponse.redirect(`${origin}/auth/confirm?verify_error=invalid`);
  }

  return NextResponse.redirect(
    `${origin}/auth/confirm?token=${encodeURIComponent(token)}&next=${encodeURIComponent(next)}`
  );
}
