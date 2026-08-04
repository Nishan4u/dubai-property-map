import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminPermissionContext, hasModuleAccess } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/auditLog";

const TABLE = {
  developer: "developers",
  broker: "brokers",
  salesperson: "salespersons",
  broker_agency: "brokerages",
} as const;

export async function POST(request: NextRequest) {
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

  const { profile: permissionProfile, permissions } = await getAdminPermissionContext(supabase, user.id);
  if (!hasModuleAccess(permissionProfile, permissions, "subscriptions", "manage")) {
    return NextResponse.json({ error: "You don't have permission to manage subscriptions." }, { status: 403 });
  }

  const { grantId } = (await request.json()) as { grantId?: string };
  if (!grantId) {
    return NextResponse.json({ error: "Grant id is required." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: grant } = await admin
    .from("subscription_grants")
    .select("id, account_type, developer_id, broker_id, salesperson_id, brokerage_id, revoked_at")
    .eq("id", grantId)
    .single();
  if (!grant) {
    return NextResponse.json({ error: "Grant not found." }, { status: 404 });
  }
  if (grant.revoked_at) {
    return NextResponse.json({ error: "This grant is already revoked." }, { status: 400 });
  }

  const accountType = grant.account_type as keyof typeof TABLE;
  const accountId = grant.developer_id ?? grant.broker_id ?? grant.salesperson_id ?? grant.brokerage_id;
  const table = TABLE[accountType];
  if (!table || !accountId) {
    return NextResponse.json({ error: "Malformed grant record." }, { status: 500 });
  }

  const { error: updateError } = await admin
    .from(table)
    .update({ subscription_status: "cancelled", is_complimentary: false })
    .eq("id", accountId);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const { error: revokeError } = await admin
    .from("subscription_grants")
    .update({ revoked_at: new Date().toISOString(), revoked_by: user.id })
    .eq("id", grantId);
  if (revokeError) {
    return NextResponse.json({ error: revokeError.message }, { status: 500 });
  }

  await logAudit(
    "subscription.revoke_grant",
    accountType,
    accountId,
    { grantId },
    { client: admin, actorId: user.id, actorEmail: user.email }
  );

  return NextResponse.json({ ok: true });
}
