import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendInvitationEmailById } from "@/lib/invitations";

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
  const { data: invitation } = await admin.from("invitations").select("*, developers(name)").eq("id", id).single();
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

  if (invitation.status === "accepted" || invitation.status === "cancelled") {
    return NextResponse.json({ error: `This invitation is already ${invitation.status} and can't be resent.` }, { status: 400 });
  }

  await admin
    .from("invitations")
    .update({ expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), last_error: null })
    .eq("id", id);

  const developer = Array.isArray(invitation.developers) ? invitation.developers[0] : invitation.developers;
  const origin = request.headers.get("origin") ?? request.nextUrl.origin;
  const result = await sendInvitationEmailById(id, developer?.name, user.email, origin);

  return NextResponse.json({ ok: result.ok });
}
