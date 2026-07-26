import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createInvitation } from "@/lib/invitations";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const { data: profile } = await supabase.from("profiles").select("developer_id").eq("id", user.id).single();
  if (!profile?.developer_id) {
    return NextResponse.json({ error: "No developer account found." }, { status: 403 });
  }

  const { name, email, role, permissions } = (await request.json()) as {
    name: string;
    email: string;
    role: string;
    permissions: { can_manage_projects: boolean; can_manage_leads: boolean; can_manage_billing: boolean };
  };
  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: developer } = await admin.from("developers").select("name").eq("id", profile.developer_id).single();

  const { data: member, error: memberError } = await admin
    .from("team_members")
    .insert({
      developer_id: profile.developer_id,
      name: name.trim(),
      email: email.trim(),
      role,
      status: "invited",
      ...permissions,
    })
    .select()
    .single();
  if (memberError || !member) {
    return NextResponse.json({ error: memberError?.message ?? "Could not create team member." }, { status: 500 });
  }

  const { invitation, error: inviteError } = await createInvitation({
    kind: "team_member",
    email: email.trim(),
    developerId: profile.developer_id,
    role,
    payload: { fullName: name.trim() },
    invitedBy: user.id,
    developerName: developer?.name,
    inviterEmail: user.email,
  });

  if (inviteError || !invitation) {
    return NextResponse.json({ member, invitationStatus: "failed", error: inviteError }, { status: 200 });
  }

  await admin.from("team_members").update({ invitation_id: invitation.id }).eq("id", member.id);

  return NextResponse.json({ member: { ...member, invitation_id: invitation.id }, invitationStatus: invitation.status });
}
