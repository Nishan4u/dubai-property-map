import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminPermissionContext, hasModuleAccess } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/auditLog";

type Action = "approve" | "reject" | "archive";

// moderation_status/rejection_reason are revoked from `authenticated` at
// the column-privilege level (patch_127) -- same reasoning as the broker
// verification route: only a service-role route can flip them.
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
  const updates: Record<string, unknown> = {};
  switch (action) {
    case "approve":
      updates.moderation_status = "approved";
      updates.rejection_reason = null;
      break;
    case "reject":
      updates.moderation_status = "rejected";
      updates.rejection_reason = reason ?? null;
      break;
    case "archive":
      updates.moderation_status = "archived";
      break;
    default:
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  const { error } = await admin.from("broker_listings").update(updates).eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit(`broker_listing.${action}`, "broker_listing", id, { reason }, { client: admin, actorId: user.id, actorEmail: user.email });

  return NextResponse.json({ ok: true });
}
