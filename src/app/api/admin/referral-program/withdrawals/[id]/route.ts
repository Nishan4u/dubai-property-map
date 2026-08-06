import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminPermissionContext, hasModuleAccess } from "@/lib/permissions";
import { approveWithdrawal, rejectWithdrawal } from "@/lib/brokerReferrals";
import { logAudit } from "@/lib/auditLog";

type Action = "approve" | "reject";

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
  if (!hasModuleAccess(permissionProfile, permissions, "referral-program", "manage")) {
    return NextResponse.json({ error: "You don't have permission to manage the referral program." }, { status: 403 });
  }

  const { action, reason } = (await request.json()) as { action: Action; reason?: string };

  const result =
    action === "approve"
      ? await approveWithdrawal(id, user.id)
      : action === "reject"
        ? await rejectWithdrawal(id, user.id, reason ?? "")
        : { ok: false as const, error: "Unknown action." };

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await logAudit(`referral_withdrawal.${action}`, "broker_referral_withdrawal_request", id, { reason }, { actorId: user.id, actorEmail: user.email });

  return NextResponse.json({ ok: true });
}
