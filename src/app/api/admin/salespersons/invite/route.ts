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
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const { developerId, fullName, jobTitle, employeeId, email, mobile, whatsapp } = await request.json();
  if (!developerId || !fullName?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Developer, full name and email are required." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: developer } = await admin.from("developers").select("name").eq("id", developerId).single();
  if (!developer) {
    return NextResponse.json({ error: "Developer not found." }, { status: 404 });
  }

  const { data: salesperson, error: spError } = await admin
    .from("salespersons")
    .insert({
      developer_id: developerId,
      full_name: fullName.trim(),
      job_title: jobTitle || null,
      employee_id: employeeId || null,
      email: email.trim(),
      mobile: mobile || null,
      whatsapp: whatsapp || null,
      status: "pending_invitation",
      created_by: user.id,
    })
    .select()
    .single();

  if (spError || !salesperson) {
    return NextResponse.json({ error: spError?.message ?? "Could not create the salesperson profile." }, { status: 400 });
  }

  const { invitation, error: inviteError } = await createInvitation({
    kind: "admin_salesperson",
    email: email.trim(),
    developerId,
    payload: { fullName: fullName.trim() },
    invitedBy: user.id,
    developerName: developer.name,
    inviterEmail: user.email,
    origin: request.headers.get("origin") ?? request.nextUrl.origin,
  });

  if (inviteError || !invitation) {
    return NextResponse.json({ salesperson, invitationStatus: "failed", error: inviteError });
  }

  await admin.from("salespersons").update({ invitation_id: invitation.id }).eq("id", salesperson.id);

  return NextResponse.json({ salesperson, invitationStatus: invitation.status });
}
