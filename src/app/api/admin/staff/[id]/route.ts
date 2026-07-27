import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/auditLog";

type Action =
  | "set_status"
  | "set_login_enabled"
  | "reset_password"
  | "set_target"
  | "set_commission"
  | "update_details";

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

  const body = await request.json();
  const action = body.action as Action;
  const admin = createAdminClient();

  const { data: staff } = await admin.from("staff").select("*").eq("id", id).single();
  if (!staff) {
    return NextResponse.json({ error: "Staff member not found." }, { status: 404 });
  }

  switch (action) {
    case "set_status": {
      const status = body.status as "active" | "inactive" | "archived";
      if (!["active", "inactive", "archived"].includes(status)) {
        return NextResponse.json({ error: "Invalid status." }, { status: 400 });
      }
      await admin.from("staff").update({ status }).eq("id", id);
      if (status !== "active") {
        await admin.from("staff").update({ login_enabled: false }).eq("id", id);
        const { data: staffProfile } = await admin.from("profiles").select("id").eq("staff_id", id).maybeSingle();
        if (staffProfile) {
          await admin.auth.admin.updateUserById(staffProfile.id, { ban_duration: "876000h" });
        }
      }
      await logAudit(`staff.status_${status}`, "staff", id, {}, { client: admin, actorId: user.id, actorEmail: user.email });
      break;
    }
    case "set_login_enabled": {
      const enabled = !!body.enabled;
      await admin.from("staff").update({ login_enabled: enabled }).eq("id", id);
      const { data: staffProfile } = await admin.from("profiles").select("id").eq("staff_id", id).maybeSingle();
      if (staffProfile) {
        await admin.auth.admin.updateUserById(staffProfile.id, { ban_duration: enabled ? "none" : "876000h" });
      }
      await logAudit(`staff.login_${enabled ? "enabled" : "disabled"}`, "staff", id, {}, { client: admin, actorId: user.id, actorEmail: user.email });
      break;
    }
    case "reset_password": {
      const newPassword = body.password as string;
      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
      }
      const { data: staffProfile } = await admin.from("profiles").select("id").eq("staff_id", id).maybeSingle();
      if (!staffProfile) {
        return NextResponse.json({ error: "No linked login account found." }, { status: 400 });
      }
      await admin.auth.admin.updateUserById(staffProfile.id, { password: newPassword });
      await logAudit("staff.password_reset", "staff", id, {}, { client: admin, actorId: user.id, actorEmail: user.email });
      break;
    }
    case "set_target": {
      const now = new Date();
      const year = Number(body.year) || now.getUTCFullYear();
      const month = Number(body.month) || now.getUTCMonth() + 1;
      const newSubscriptionTarget = Number(body.newSubscriptionTarget) || 0;
      const renewalTarget = Number(body.renewalTarget) || 0;
      const revenueTarget = Number(body.revenueTarget) || 0;

      await admin
        .from("staff")
        .update({
          new_subscription_target: newSubscriptionTarget,
          renewal_target: renewalTarget,
          revenue_target: revenueTarget,
        })
        .eq("id", id);

      await admin.from("staff_monthly_targets").upsert(
        {
          staff_id: id,
          year,
          month,
          new_subscription_target: newSubscriptionTarget,
          renewal_target: renewalTarget,
          revenue_target: revenueTarget,
        },
        { onConflict: "staff_id,year,month" }
      );
      await logAudit("staff.target_set", "staff", id, { year, month, newSubscriptionTarget, renewalTarget, revenueTarget }, { client: admin, actorId: user.id, actorEmail: user.email });
      break;
    }
    case "set_commission": {
      const commissionType = body.commissionType === "flat" ? "flat" : "percentage";
      const commissionRate = Number(body.commissionRate) || 0;
      await admin.from("staff").update({ commission_type: commissionType, commission_rate: commissionRate }).eq("id", id);
      await logAudit("staff.commission_set", "staff", id, { commissionType, commissionRate }, { client: admin, actorId: user.id, actorEmail: user.email });
      break;
    }
    case "update_details": {
      const { fullName, phone, position } = body;
      await admin
        .from("staff")
        .update({
          full_name: fullName?.trim() || staff.full_name,
          phone: phone ?? staff.phone,
          position: position ?? staff.position,
        })
        .eq("id", id);
      await logAudit("staff.updated", "staff", id, {}, { client: admin, actorId: user.id, actorEmail: user.email });
      break;
    }
    default:
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
