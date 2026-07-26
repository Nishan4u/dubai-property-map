import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const { data: profile } = await supabase.from("profiles").select("role, developer_id").eq("id", user.id).single();

  const admin = createAdminClient();
  const { data: invitation } = await admin.from("invitations").select("*").eq("id", id).single();
  if (!invitation) {
    return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
  }

  const isOwner =
    (invitation.kind === "team_member" || invitation.kind === "developer_salesperson") &&
    profile?.role === "developer" &&
    profile.developer_id === invitation.developer_id;
  const isAdmin = profile?.role === "admin";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  if (invitation.status === "accepted") {
    return NextResponse.json({ error: "This invitation has already been accepted and can't be cancelled." }, { status: 400 });
  }

  await admin.from("invitations").update({ status: "cancelled" }).eq("id", id);

  if (invitation.kind === "team_member") {
    await admin.from("team_members").update({ status: "cancelled" }).eq("invitation_id", id);
  } else if (invitation.kind === "developer_salesperson" || invitation.kind === "admin_salesperson") {
    await admin.from("salespersons").delete().eq("invitation_id", id).eq("status", "pending_invitation");
  }

  return NextResponse.json({ ok: true });
}
