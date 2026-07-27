import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/auditLog";
import { sendEmail } from "@/lib/email";

type Action = "active" | "suspended";

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

  const { action, verified } = (await request.json()) as { action: Action; verified?: boolean };
  if (action !== "active" && action !== "suspended") {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: developer } = await admin.from("developers").select("name").eq("id", id).single();
  if (!developer) {
    return NextResponse.json({ error: "Developer not found." }, { status: 404 });
  }

  const { error } = await admin
    .from("developers")
    .update({ status: action, ...(verified !== undefined ? { verified } : {}) })
    .eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit(`developer.${action}`, "developer", id, {}, { client: admin, actorId: user.id, actorEmail: user.email });

  // developers.email is never populated (the self-registration flow never
  // sets it) — the actual contact is whichever profile is linked to this
  // developer_id. The founding signup is the earliest-created one; later
  // profiles are team-invite additions.
  const { data: linkedProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("developer_id", id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (linkedProfile) {
    const { data: authUser } = await admin.auth.admin.getUserById(linkedProfile.id);
    const email = authUser.user?.email;
    if (email) {
      const subject =
        action === "active"
          ? "Your Dubai Property Map developer account is approved"
          : "Your Dubai Property Map developer account has been suspended";
      const html =
        action === "active"
          ? `<p>Hi,</p><p>Your developer account for <strong>${developer.name}</strong> has been approved. Log in to publish projects.</p>`
          : `<p>Hi,</p><p>Your developer account for <strong>${developer.name}</strong> has been suspended. Contact support for details.</p>`;
      await sendEmail({
        category: `developer_${action}`,
        to: email,
        subject,
        html,
        relatedEntityType: "developer",
        relatedEntityId: id,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
