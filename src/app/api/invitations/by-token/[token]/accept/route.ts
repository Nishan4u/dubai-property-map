import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { password, fullName } = (await request.json()) as { password?: string; fullName?: string };

  if (!password || password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: invitation } = await admin.from("invitations").select("*").eq("token", token).maybeSingle();

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
    await admin.from("invitations").update({ status: "expired" }).eq("id", invitation.id);
    return NextResponse.json({ error: "This invitation has expired. Ask for a new one to be sent." }, { status: 410 });
  }

  const payload = (invitation.payload ?? {}) as Record<string, unknown>;
  const displayName = fullName?.trim() || (payload.fullName as string | undefined) || invitation.email;

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: invitation.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: displayName, role: invitation.kind === "team_member" ? "developer" : invitation.kind === "admin_member" ? "admin" : "salesperson" },
  });
  if (createError || !created.user) {
    return NextResponse.json({ error: createError?.message ?? "Could not create the account." }, { status: 400 });
  }

  try {
    if (invitation.kind === "team_member") {
      await admin
        .from("profiles")
        .update({ role: "developer", developer_id: invitation.developer_id })
        .eq("id", created.user.id);
      await admin
        .from("team_members")
        .update({ status: "active" })
        .eq("invitation_id", invitation.id);
    } else if (invitation.kind === "developer_salesperson" || invitation.kind === "admin_salesperson") {
      const { data: salesperson, error: spError } = await admin
        .from("salespersons")
        .update({ status: "active", email: invitation.email })
        .eq("invitation_id", invitation.id)
        .select("id")
        .single();
      if (spError || !salesperson) throw new Error(spError?.message ?? "Salesperson record not found.");
      await admin.from("profiles").update({ role: "salesperson", salesperson_id: salesperson.id }).eq("id", created.user.id);
    } else if (invitation.kind === "admin_member") {
      await admin.from("profiles").update({ role: "admin" }).eq("id", created.user.id);
    }
  } catch (linkError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json(
      { error: linkError instanceof Error ? linkError.message : "Could not complete account setup." },
      { status: 500 }
    );
  }

  await admin
    .from("invitations")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", invitation.id);

  return NextResponse.json({ ok: true, kind: invitation.kind });
}
