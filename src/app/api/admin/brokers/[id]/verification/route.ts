import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminPermissionContext, hasModuleAccess } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/auditLog";
import { sendEmail } from "@/lib/email";

type Action = "approve" | "reject" | "renew" | "revoke" | "feature" | "unfeature";

// Mirrors /api/admin/brokers/[id]/status/route.ts exactly -- same auth/
// permission checks, same admin-client + audit-log + email pattern.
// Needed because verification_status/verification_expires_at are revoked
// from `authenticated` at the column-privilege level (patch_127), so even
// an admin's own browser session cannot update them directly -- only this
// service-role route can.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

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
  if (!hasModuleAccess(permissionProfile, permissions, "brokers", "manage")) {
    return NextResponse.json({ error: "You don't have permission to manage brokers." }, { status: 403 });
  }

  const { action, reason } = (await request.json()) as { action: Action; reason?: string };

  const admin = createAdminClient();
  const { data: broker } = await admin.from("brokers").select("full_name, email").eq("id", id).single();
  if (!broker) {
    return NextResponse.json({ error: "Broker not found." }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};
  let subject = "";
  let html = "";

  switch (action) {
    case "approve": {
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      updates.verification_status = "active";
      updates.verification_expires_at = expiresAt.toISOString().slice(0, 10);
      subject = "You're now a Verified Broker on Dubai Property Map";
      html = `<p>Hi ${broker.full_name},</p><p>Your Verified Broker badge is now active for 1 year.</p>`;
      break;
    }
    case "reject":
      updates.verification_status = "rejected";
      subject = "Your Verified Broker application";
      html = `<p>Hi ${broker.full_name},</p><p>We were unable to approve your Verified Broker application${reason ? `: ${reason}` : "."}</p>`;
      break;
    case "renew": {
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      updates.verification_status = "active";
      updates.verification_expires_at = expiresAt.toISOString().slice(0, 10);
      subject = "Your Verified Broker badge has been renewed";
      html = `<p>Hi ${broker.full_name},</p><p>Your Verified Broker badge has been renewed for another year.</p>`;
      break;
    }
    case "revoke":
      updates.verification_status = "revoked";
      updates.verification_expires_at = null;
      subject = "Your Verified Broker badge has been revoked";
      html = `<p>Hi ${broker.full_name},</p><p>Your Verified Broker badge has been revoked${reason ? `: ${reason}` : "."} Contact support for details.</p>`;
      break;
    case "feature":
      updates.featured = true;
      break;
    case "unfeature":
      updates.featured = false;
      break;
    default:
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  const { error } = await admin.from("brokers").update(updates).eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit(`broker.verification.${action}`, "broker", id, { reason }, { client: admin, actorId: user.id, actorEmail: user.email });
  if (broker.email && subject) {
    await sendEmail({
      category: `broker_verification_${action}`,
      to: broker.email,
      subject,
      html,
      relatedEntityType: "broker",
      relatedEntityId: id,
    });
  }

  return NextResponse.json({ ok: true });
}
