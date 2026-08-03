import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Public redirect — mirrors src/app/s/[code]/route.ts's exact shape.
// Logs a click for the placement's own developer/admin analytics, then
// forwards to the real destination. Every existing banner render site
// only points here when target_url is actually set, so this route is
// never the destination for a placement with nothing to click through to.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: placement } = await admin
    .from("ad_placements")
    .select("id, target_url")
    .eq("id", id)
    .maybeSingle();

  if (!placement?.target_url) {
    return NextResponse.redirect(request.nextUrl.origin);
  }

  await admin.from("ad_placement_events").insert({ placement_id: placement.id, event_type: "click" });

  return NextResponse.redirect(placement.target_url);
}
