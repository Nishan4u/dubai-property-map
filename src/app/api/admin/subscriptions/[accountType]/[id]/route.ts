import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/auditLog";

// Extend/Give Complimentary/Cancel/Suspend/Reactivate for developers,
// salespersons and broker agencies — mirrors the existing
// /api/admin/brokers/[id]/subscription route (kept as-is for brokers) so
// every account type gets the same quick admin actions.
type Action = "extend" | "complimentary" | "cancel" | "suspend" | "reactivate";

const TABLE = {
  developer: "developers",
  salesperson: "salespersons",
  broker_agency: "brokerages",
} as const;

export async function POST(request: NextRequest, { params }: { params: Promise<{ accountType: string; id: string }> }) {
  const { accountType, id } = await params;
  if (accountType !== "developer" && accountType !== "salesperson" && accountType !== "broker_agency") {
    return NextResponse.json({ error: "Unsupported account type." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const { action, days } = (await request.json()) as { action: Action; days?: number };
  const admin = createAdminClient();
  const table = TABLE[accountType];

  const { data: account } = await admin.from(table).select("subscription_expires_at").eq("id", id).single();
  if (!account) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};

  switch (action) {
    case "extend": {
      const extendDays = days ?? 30;
      const base =
        account.subscription_expires_at && new Date(account.subscription_expires_at) > new Date()
          ? new Date(account.subscription_expires_at)
          : new Date();
      base.setDate(base.getDate() + extendDays);
      updates.subscription_expires_at = base.toISOString().slice(0, 10);
      updates.subscription_status = "active";
      break;
    }
    case "complimentary": {
      const expires = new Date();
      expires.setDate(expires.getDate() + 365);
      updates.is_complimentary = true;
      updates.subscription_status = "active";
      updates.subscription_expires_at = expires.toISOString().slice(0, 10);
      updates.payment_type = "admin_free";
      break;
    }
    case "cancel":
      updates.subscription_status = "cancelled";
      break;
    case "suspend":
      updates.subscription_status = "suspended";
      break;
    case "reactivate":
      updates.subscription_status = "active";
      break;
    default:
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  const { error } = await admin.from(table).update(updates).eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit(`${accountType}.subscription_${action}`, accountType, id, { days }, { client: admin, actorId: user.id, actorEmail: user.email });

  return NextResponse.json({ ok: true });
}
