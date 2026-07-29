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
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token = searchParams.get("token");
  const next = searchParams.get("next") ?? "/";

  if (!token) {
    return NextResponse.redirect(`${origin}/auth/confirm?verify_error=invalid`);
  }

  return NextResponse.redirect(
    `${origin}/auth/confirm?token=${encodeURIComponent(token)}&next=${encodeURIComponent(next)}`
  );
}
