import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminPermissionContext, hasModuleAccess } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/auditLog";
import { sendEmail } from "@/lib/email";

type AccountType = "developer" | "broker" | "salesperson" | "broker_agency";

const TABLE: Record<AccountType, "developers" | "brokers" | "salespersons" | "brokerages"> = {
  developer: "developers",
  broker: "brokers",
  salesperson: "salespersons",
  broker_agency: "brokerages",
};

const PLAN_KEY_COLUMN: Record<AccountType, "plan_tier" | "plan_key"> = {
  developer: "plan_tier",
  broker: "plan_key",
  salesperson: "plan_key",
  broker_agency: "plan_key",
};

const NAME_COLUMN: Record<AccountType, "name" | "full_name"> = {
  developer: "name",
  broker: "full_name",
  salesperson: "full_name",
  broker_agency: "name",
};

const EMAIL_COLUMN: Record<AccountType, "email" | "company_email"> = {
  developer: "email",
  broker: "email",
  salesperson: "email",
  broker_agency: "company_email",
};

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

  const { accountType, accountId, planKey, durationDays, reason } = (await request.json()) as {
    accountType?: AccountType;
    accountId?: string;
    planKey?: string;
    durationDays?: number | null;
    reason?: string;
  };

  if (!accountType || !TABLE[accountType] || !accountId || !planKey) {
    return NextResponse.json({ error: "Account type, account, and plan are required." }, { status: 400 });
  }
  const noExpiry = durationDays === null;
  const days = Number(durationDays);
  if (!noExpiry && (!Number.isFinite(days) || days < 1)) {
    return NextResponse.json({ error: "Duration must be at least 1 day." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: plan } = await admin
    .from("subscription_plans")
    .select("key, plan_type, status")
    .eq("key", planKey)
    .single();
  if (!plan || plan.plan_type !== accountType) {
    return NextResponse.json({ error: "That plan does not belong to this account type." }, { status: 400 });
  }
  if (plan.status !== "active") {
    return NextResponse.json({ error: "That plan is disabled and cannot be granted." }, { status: 400 });
  }

  const table = TABLE[accountType];
  const planKeyColumn = PLAN_KEY_COLUMN[accountType];

  const nameColumn = NAME_COLUMN[accountType];
  const emailColumn = EMAIL_COLUMN[accountType];
  const { data: account } = await admin.from(table).select(`id, ${emailColumn}, ${nameColumn}`).eq("id", accountId).single();
  if (!account) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }
  const accountName = (account as unknown as Record<string, string>)[nameColumn] ?? "";
  const accountEmail = (account as unknown as Record<string, string | null>)[emailColumn];

  const startDate = new Date();
  let expiryDateStr: string | null = null;
  if (!noExpiry) {
    const expiryDate = new Date(startDate);
    expiryDate.setDate(expiryDate.getDate() + days);
    expiryDateStr = expiryDate.toISOString().slice(0, 10);
  }

  const { error: updateError } = await admin
    .from(table)
    .update({
      [planKeyColumn]: planKey,
      subscription_status: "active",
      is_complimentary: true,
      subscription_expires_at: expiryDateStr,
      payment_type: "admin_free",
    })
    .eq("id", accountId);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const { error: grantError } = await admin.from("subscription_grants").insert({
    account_type: accountType,
    developer_id: accountType === "developer" ? accountId : null,
    broker_id: accountType === "broker" ? accountId : null,
    salesperson_id: accountType === "salesperson" ? accountId : null,
    brokerage_id: accountType === "broker_agency" ? accountId : null,
    plan_key: planKey,
    granted_by: user.id,
    start_date: startDate.toISOString().slice(0, 10),
    expiry_date: expiryDateStr,
    reason: reason || null,
  });
  if (grantError) {
    return NextResponse.json({ error: grantError.message }, { status: 500 });
  }

  await logAudit(
    "subscription.grant_free",
    accountType,
    accountId,
    { planKey, durationDays: noExpiry ? "no_expiry" : days, reason },
    { client: admin, actorId: user.id, actorEmail: user.email }
  );

  if (accountEmail) {
    const validityText = noExpiry ? "with no expiry" : `active until ${expiryDateStr}`;
    await sendEmail({
      category: "free_subscription_granted",
      to: accountEmail,
      subject: "You've been granted a free Dubai Property Map subscription",
      html: `<p>Hi ${accountName},</p><p>An admin has granted you free access to the <strong>${planKey}</strong> plan, ${validityText}.</p><p><strong>Subscription Status:</strong> Active<br/><strong>Payment Type:</strong> Admin Granted / Free</p>${reason ? `<p>Note: ${reason}</p>` : ""}`,
      relatedEntityType: accountType,
      relatedEntityId: accountId,
    });
  }

  return NextResponse.json({ ok: true });
}
