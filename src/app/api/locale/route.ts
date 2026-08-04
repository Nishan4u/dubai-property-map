import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// Pure preference, not auth -- no session/CSRF handling needed. The
// switcher calls this then router.refresh() so every server component
// re-reads the cookie on the next render.
export async function POST(request: NextRequest) {
  const { locale, currency } = (await request.json()) as { locale?: string; currency?: string };
  const store = await cookies();

  if (locale === "en" || locale === "ar") {
    store.set("locale", locale, { maxAge: 60 * 60 * 24 * 365, path: "/" });
  }
  if (currency === "AED" || currency === "USD" || currency === "EUR" || currency === "GBP") {
    store.set("currency", currency, { maxAge: 60 * 60 * 24 * 365, path: "/" });
  }

  return NextResponse.json({ ok: true });
}
