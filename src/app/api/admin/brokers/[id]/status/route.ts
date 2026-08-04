import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminPermissionContext, hasModuleAccess } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/auditLog";
import { sendEmail } from "@/lib/email";

type Action = "approve" | "reject" | "suspend" | "block";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const { profile: permissionProfile, permissions } = await getAdminPermissionContext(supabase, user.id);
  if (!hasModuleAccess(permissionProfile, permissions, "brokers", "manage")) {
    return NextResponse.json({ error: "You don't have permission to manage brokers." }, { status: 403 });
  }

  const { action, reason } = (await request.json()) as { action: Action; reason?: string };

  const admin = createAdminClient();
  const { data: broker } = await admin
    .from("brokers")
    .select("full_name, email, brokerage_id, license_path")
    .eq("id", id)
    .single();
  if (!broker) {
    return NextResponse.json({ error: "Broker not found." }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};
  let subject = "";
  let html = "";

  switch (action) {
    case "approve":
      updates.account_status = "approved";
      updates.approved_at = new Date().toISOString();
      updates.approved_by = user.id;
      updates.rejection_reason = null;
      updates.suspension_reason = null;
      // Independent brokers' license gets reviewed as part of the same
      // overall approval -- no separate approval step.
      if (!broker.brokerage_id && broker.license_path) updates.license_status = "approved";
      subject = "Your Dubai Property Map broker account is approved";
      html = `<p>Hi ${broker.full_name},</p><p>Your broker account has been approved. Log in to subscribe and start submitting property requests.</p>`;
      break;
    case "reject":
      updates.account_status = "rejected";
      updates.rejection_reason = reason ?? null;
      if (!broker.brokerage_id) updates.license_status = "rejected";
      subject = "Your Dubai Property Map broker application";
      html = `<p>Hi ${broker.full_name},</p><p>We were unable to approve your broker application${reason ? `: ${reason}` : "."}</p>`;
      break;
    case "suspend":
      updates.account_status = "suspended";
      updates.suspension_reason = reason ?? null;
      subject = "Your Dubai Property Map broker account has been suspended";
      html = `<p>Hi ${broker.full_name},</p><p>Your broker account has been suspended${reason ? `: ${reason}` : "."} Contact support for details.</p>`;
      break;
    case "block":
      updates.account_status = "blocked";
      subject = "Your Dubai Property Map broker account has been blocked";
      html = `<p>Hi ${broker.full_name},</p><p>Your broker account has been blocked. Contact support for details.</p>`;
      break;
    default:
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  const { error } = await admin.from("brokers").update(updates).eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit(`broker.${action}`, "broker", id, { reason }, { client: admin, actorId: user.id, actorEmail: user.email });
  await sendEmail({
    category: `broker_${action}`,
    to: broker.email,
    subject,
    html,
    relatedEntityType: "broker",
    relatedEntityId: id,
  });

  return NextResponse.json({ ok: true });
}
