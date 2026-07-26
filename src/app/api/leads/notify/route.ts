import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

// Fires after a lead (Enquire Now / Book Appointment) has already been
// inserted client-side — this route only handles the email side, so a slow
// or failed send can never block the lead itself from being saved.
export async function POST(request: NextRequest) {
  const { leadId, isViewing } = (await request.json()) as { leadId?: string; isViewing?: boolean };
  if (!leadId) {
    return NextResponse.json({ error: "leadId is required." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: lead } = await admin
    .from("leads")
    .select("id, name, email, phone, notes, project_id, created_by")
    .eq("id", leadId)
    .single();
  // Only the user who created this lead can trigger its notification email
  // — prevents an arbitrary authenticated caller from using this route to
  // fire emails against someone else's lead id.
  if (!lead || lead.created_by !== user.id) {
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  }

  const { data: project } = await admin
    .from("projects")
    .select("id, name, developer_id")
    .eq("id", lead.project_id)
    .single();
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const { data: developer } = await admin
    .from("developers")
    .select("id, name, email")
    .eq("id", project.developer_id)
    .single();

  const kind = isViewing ? "viewing request" : "enquiry";

  if (developer?.email) {
    const developerHtml = `
      <p>Hi ${developer.name},</p>
      <p>You have received a new ${kind} through Dubai Property Map.</p>
      <p><strong>Project:</strong> ${project.name}<br/>
      <strong>Name:</strong> ${lead.name}<br/>
      <strong>Email:</strong> ${lead.email}<br/>
      <strong>Phone:</strong> ${lead.phone}</p>
      ${lead.notes ? `<p><strong>Details:</strong><br/>${lead.notes}</p>` : ""}
      <p>Reply directly to this email to reach ${lead.name}.</p>
    `;
    await sendEmail({
      category: isViewing ? "developer_new_viewing_request" : "developer_new_enquiry",
      to: developer.email,
      subject: `New ${isViewing ? "Viewing Request" : "Enquiry"} – ${project.name}`,
      html: developerHtml,
      replyTo: lead.email,
      relatedEntityType: "lead",
      relatedEntityId: lead.id,
    });
  }

  const userHtml = `
    <p>Hi ${lead.name},</p>
    <p>Thanks for your ${kind} for <strong>${project.name}</strong> on Dubai Property Map. The developer's team has been notified and will be in touch shortly.</p>
  `;
  await sendEmail({
    category: isViewing ? "user_viewing_confirmation" : "user_enquiry_confirmation",
    to: lead.email,
    subject: `We've received your ${isViewing ? "viewing request" : "enquiry"} for ${project.name}`,
    html: userHtml,
    relatedEntityType: "lead",
    relatedEntityId: lead.id,
  });

  return NextResponse.json({ ok: true });
}
