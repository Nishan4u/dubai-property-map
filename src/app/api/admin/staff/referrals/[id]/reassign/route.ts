import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminPermissionContext, hasModuleAccess } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/auditLog";

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
  if (!hasModuleAccess(permissionProfile, permissions, "staff", "manage")) {
    return NextResponse.json({ error: "You don't have permission to manage staff." }, { status: 403 });
  }

  const { newStaffId } = (await request.json()) as { newStaffId: string };
  if (!newStaffId) {
    return NextResponse.json({ error: "newStaffId is required." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: referral } = await admin.from("staff_referrals").select("staff_id, account_type").eq("id", id).single();
  if (!referral) {
    return NextResponse.json({ error: "Referral not found." }, { status: 404 });
  }
  const { data: newStaff } = await admin.from("staff").select("id").eq("id", newStaffId).maybeSingle();
  if (!newStaff) {
    return NextResponse.json({ error: "Target staff member not found." }, { status: 404 });
  }

  const previousStaffId = referral.staff_id;

  const { error } = await admin.from("staff_referrals").update({ staff_id: newStaffId }).eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Existing commission rows keep their original staff_id (they're a
  // historical record of who was credited at the time), so the audit log
  // is the source of truth for the correction itself, not a rewrite of
  // already-paid history.
  await logAudit(
    "staff_referral.reassigned",
    "staff_referral",
    id,
    { previousStaffId, newStaffId, accountType: referral.account_type },
    { client: admin, actorId: user.id, actorEmail: user.email }
  );

  return NextResponse.json({ ok: true });
}
