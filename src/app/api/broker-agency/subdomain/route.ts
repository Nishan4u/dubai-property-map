import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Mirrors supabase/patch_135_agency_storefront.sql's two check
// constraints exactly -- validated here too so the agency gets a
// friendly error message instead of a raw Postgres constraint-violation
// string, which is what a direct client-side .update() (the pattern
// BrokerAgencyLogoUpload.tsx uses for the logo) would otherwise surface.
const SUBDOMAIN_FORMAT = /^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$/;
const RESERVED_SUBDOMAINS = new Set([
  "www", "api", "admin", "app", "mail", "staging", "dev", "ftp", "cdn",
  "static", "blog", "help", "support", "status", "docs", "dashboard",
  "portal", "my", "secure",
]);

export async function POST(request: NextRequest) {
  const body = await request.json();
  const raw = typeof body?.subdomain === "string" ? body.subdomain.trim().toLowerCase() : "";

  if (!raw) {
    return NextResponse.json({ error: "Enter a subdomain." }, { status: 400 });
  }
  if (!SUBDOMAIN_FORMAT.test(raw)) {
    return NextResponse.json(
      { error: "Use 3-63 lowercase letters, numbers, or hyphens (can't start/end with a hyphen)." },
      { status: 400 }
    );
  }
  if (RESERVED_SUBDOMAINS.has(raw)) {
    return NextResponse.json({ error: "That subdomain is reserved -- please choose another." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { data: profile } = await supabase.from("profiles").select("broker_agency_id").eq("id", user.id).single();
  if (!profile?.broker_agency_id) {
    return NextResponse.json({ error: "No broker agency account found." }, { status: 403 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("brokerages").update({ subdomain: raw }).eq("id", profile.broker_agency_id);

  if (error) {
    // 23505 = unique_violation, 23514 = check_violation (belt-and-braces
    // in case the DB migration's constraints catch something the checks
    // above didn't -- e.g. a race with another agency claiming the same
    // subdomain a moment earlier).
    if (error.code === "23505") {
      return NextResponse.json({ error: "That subdomain is already taken." }, { status: 409 });
    }
    return NextResponse.json({ error: "Could not save that subdomain. Please try a different one." }, { status: 400 });
  }

  return NextResponse.json({ subdomain: raw });
}
