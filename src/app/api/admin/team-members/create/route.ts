import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/auditLog";
import { getAdminPermissionContext, hasModuleAccess } from "@/lib/permissions";

// Creates a new admin account restricted to a custom role's module
// access -- mirrors /api/admin/staff/create's exact shape (auth user
// first, roll back on any later failure). Unlike staff (a separate
// role entirely), this account gets role: "admin" so it passes every
// existing is_admin()-gated RLS policy exactly like a full admin;
// custom_role_id is what narrows its actual admin-panel access via
// src/lib/permissions.ts. A full, unrestricted admin is created the
// same way this always worked -- just omit customRoleId.
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
  if (!hasModuleAccess(permissionProfile, permissions, "roles", "manage")) {
    return NextResponse.json({ error: "You don't have permission to manage admin team members." }, { status: 403 });
  }

  const { fullName, email, password, customRoleId } = await request.json();

  if (!fullName?.trim() || !email?.trim() || !password || password.length < 6) {
    return NextResponse.json({ error: "Full name, email and a password (6+ characters) are required." }, { status: 400 });
  }

  const admin = createAdminClient();

  if (customRoleId) {
    const { data: role } = await admin.from("custom_roles").select("id").eq("id", customRoleId).maybeSingle();
    if (!role) {
      return NextResponse.json({ error: "Selected role not found." }, { status: 400 });
    }
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName.trim(), role: "admin" },
  });
  if (createError || !created.user) {
    return NextResponse.json({ error: createError?.message ?? "Could not create the account." }, { status: 400 });
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({ role: "admin", custom_role_id: customRoleId || null, full_name: fullName.trim() })
    .eq("id", created.user.id);

  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  await logAudit(
    "admin_team_member.created",
    "profile",
    created.user.id,
    { fullName, email, customRoleId: customRoleId || null },
    { client: admin, actorId: user.id, actorEmail: user.email }
  );

  return NextResponse.json({ profileId: created.user.id, credentials: { email: email.trim(), password } });
}
