import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Runs server-side only so the secret can be generated with Node's
// crypto module (not available in the browser) and returned exactly
// once. Owner is always resolved from the caller's own session, never
// trusted from the request body -- a broker can only ever create an
// integration owned by their own broker_id, etc.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, broker_id, salesperson_id, developer_id, broker_agency_id")
    .eq("id", user.id)
    .single();

  const ownerType =
    profile?.role === "broker"
      ? "broker"
      : profile?.role === "salesperson"
        ? "salesperson"
        : profile?.role === "developer"
          ? "developer"
          : profile?.role === "broker_agency"
            ? "broker_agency"
            : null;
  const ownerId =
    ownerType === "broker"
      ? profile?.broker_id
      : ownerType === "salesperson"
        ? profile?.salesperson_id
        : ownerType === "developer"
          ? profile?.developer_id
          : profile?.broker_agency_id;

  if (!ownerType || !ownerId) {
    return NextResponse.json({ error: "No broker, salesperson, developer, or broker agency account found." }, { status: 403 });
  }

  const { name, webhookUrl, events } = (await request.json()) as {
    name: string;
    webhookUrl?: string;
    events: string[];
  };

  if (!name?.trim() || !Array.isArray(events) || events.length === 0) {
    return NextResponse.json({ error: "A name and at least one event are required." }, { status: 400 });
  }

  const secret = crypto.randomBytes(24).toString("hex");
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("crm_integrations")
    .insert({
      owner_type: ownerType,
      broker_id: ownerType === "broker" ? ownerId : null,
      salesperson_id: ownerType === "salesperson" ? ownerId : null,
      developer_id: ownerType === "developer" ? ownerId : null,
      brokerage_id: ownerType === "broker_agency" ? ownerId : null,
      name: name.trim(),
      webhook_url: webhookUrl?.trim() || null,
      secret,
      events,
    })
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Failed to create integration." }, { status: 500 });
  }

  return NextResponse.json({ integration: data });
}
