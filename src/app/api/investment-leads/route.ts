import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyAdmins } from "@/lib/notify";
import { isRateLimited } from "@/lib/ai/rateLimit";

const VALID_PURPOSES = new Set(["end_use", "investment", "second_home", "golden_visa"]);
const VALID_STATUSES_ON_CREATE = "new"; // fixed -- never client-supplied

// No login required by design -- this is the public Investment Report
// quiz's submit endpoint. Deliberately NOT backed by an RLS insert
// policy (see patch_147_investment_leads.sql's header comment for why:
// this codebase already found a public-insert lead table to be a real
// production vulnerability once). This route IS the security boundary --
// it validates the body itself, then writes via the service-role client,
// mirroring the same admin-client pattern already used by
// /api/broker/property-requests/[id]/client/route.ts.
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";
  if (isRateLimited(`investment-lead:${ip}`)) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!fullName || !email) {
    return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
  }
  // Cheap sanity check, not a full RFC validator -- matches the level of
  // validation every other public form in this codebase relies on (native
  // `type="email"` client-side, no server-side regex elsewhere either).
  if (!email.includes("@")) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const purpose = typeof body.purpose === "string" && VALID_PURPOSES.has(body.purpose) ? body.purpose : null;
  const budgetMin = typeof body.budgetMin === "number" ? body.budgetMin : null;
  const budgetMax = typeof body.budgetMax === "number" ? body.budgetMax : null;
  const communityId = typeof body.communityId === "string" && body.communityId ? body.communityId : null;
  const purchaseTimeline = typeof body.purchaseTimeline === "string" ? body.purchaseTimeline : null;
  const whatsapp = typeof body.whatsapp === "string" && body.whatsapp.trim() ? body.whatsapp.trim() : null;
  const sourcePath = typeof body.sourcePath === "string" ? body.sourcePath.slice(0, 200) : null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("investment_leads")
    .insert({
      purpose,
      budget_min: budgetMin,
      budget_max: budgetMax,
      community_id: communityId,
      purchase_timeline: purchaseTimeline,
      full_name: fullName,
      email,
      whatsapp,
      status: VALID_STATUSES_ON_CREATE,
      source_path: sourcePath,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: "Something went wrong saving your details. Please try again." }, { status: 500 });
  }

  // Best-effort -- the lead itself is already saved regardless of whether
  // this notification succeeds, same contract as sendLeadWebhook.
  notifyAdmins(`New Investment Report lead: ${fullName} (${email})`, admin).catch(() => {});

  return NextResponse.json({ id: data.id });
}
