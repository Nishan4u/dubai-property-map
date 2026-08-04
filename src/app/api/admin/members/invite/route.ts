import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminPermissionContext, hasModuleAccess } from "@/lib/permissions";
import { createInvitation } from "@/lib/invitations";

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
  if (!hasModuleAccess(permissionProfile, permissions, "users", "manage")) {
    return NextResponse.json({ error: "You don't have permission to manage users." }, { status: 403 });
  }

  const { fullName, email } = await request.json();
  if (!fullName?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Full name and email are required." }, { status: 400 });
  }

  const { invitation, error } = await createInvitation({
    kind: "admin_member",
    email: email.trim(),
    payload: { fullName: fullName.trim() },
    invitedBy: user.id,
    inviterEmail: user.email,
    origin: request.headers.get("origin") ?? request.nextUrl.origin,
  });

  if (error || !invitation) {
    return NextResponse.json({ error: error ?? "Could not send invitation." }, { status: 500 });
  }

  return NextResponse.json({ invitation });
}
