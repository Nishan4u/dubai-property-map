import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: invitation } = await admin
    .from("invitations")
    .select("id, kind, email, status, expires_at, developer_id, role, developers(name)")
    .eq("token", token)
    .maybeSingle();

  if (!invitation) {
    return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
  }

  if (invitation.status === "cancelled") {
    return NextResponse.json({ error: "This invitation has been cancelled." }, { status: 410 });
  }
  if (invitation.status === "accepted") {
    return NextResponse.json({ error: "This invitation has already been accepted." }, { status: 410 });
  }
  if (new Date(invitation.expires_at) < new Date()) {
    if (invitation.status !== "expired") {
      await admin.from("invitations").update({ status: "expired" }).eq("id", invitation.id);
    }
    return NextResponse.json({ error: "This invitation has expired. Ask for a new one to be sent." }, { status: 410 });
  }

  const developer = Array.isArray(invitation.developers) ? invitation.developers[0] : invitation.developers;

  return NextResponse.json({
    kind: invitation.kind,
    email: invitation.email,
    role: invitation.role,
    developerName: developer?.name ?? null,
  });
}
