import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { notifyDeveloperTeam, notifyUser } from "@/lib/notify";
import { isFreeAccessEnabled } from "@/lib/supabase/queries";
import { sendPushToUser } from "@/lib/webPush";

// Agency-level counterpart to /api/broker/property-requests. Deliberately
// separate: an agency's own requests are never attached to a broker_id and
// never mixed with any individual broker's requests/clients/leads (spec
// section 10).
export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    projectId,
    salespersonId,
    propertyType,
    bedrooms,
    budgetMin,
    budgetMax,
    purchasePurpose,
    financing,
    purchaseTimeline,
    preferredUnit,
    notes,
  } = body;

  if (!projectId || !salespersonId || !propertyType) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("broker_agency_id")
    .eq("id", user.id)
    .single();
  if (!profile?.broker_agency_id) {
    return NextResponse.json({ error: "No broker agency account found." }, { status: 403 });
  }

  const admin = createAdminClient();

  const { data: agency } = await admin
    .from("brokerages")
    .select("name, company_email, contact_person, phone, subscription_status, verified")
    .eq("id", profile.broker_agency_id)
    .single();
  if (!agency) {
    return NextResponse.json({ error: "Broker agency account not found." }, { status: 403 });
  }
  if (!agency.verified) {
    return NextResponse.json({ error: "Your agency account is not yet approved." }, { status: 403 });
  }
  if (agency.subscription_status !== "active" && !(await isFreeAccessEnabled("broker_agency"))) {
    return NextResponse.json({ error: "An active subscription is required to submit requests." }, { status: 403 });
  }

  const { data: project } = await admin
    .from("projects")
    .select("id, name, developer_id")
    .eq("id", projectId)
    .single();
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const { data: salesperson } = await admin
    .from("salespersons")
    .select("id, full_name, email, developer_id, status")
    .eq("id", salespersonId)
    .single();
  if (!salesperson || salesperson.developer_id !== project.developer_id || salesperson.status !== "active") {
    return NextResponse.json({ error: "Selected salesperson is not available for this project." }, { status: 400 });
  }

  const { data: insertedRequest, error: insertError } = await supabase
    .from("agency_property_requests")
    .insert({
      brokerage_id: profile.broker_agency_id,
      developer_id: project.developer_id,
      salesperson_id: salesperson.id,
      project_id: project.id,
      property_type: propertyType,
      bedrooms: bedrooms ?? null,
      budget_min: budgetMin ?? null,
      budget_max: budgetMax ?? null,
      purchase_purpose: purchasePurpose ?? null,
      financing: financing ?? null,
      purchase_timeline: purchaseTimeline ?? null,
      preferred_unit: preferredUnit || null,
      agency_notes: notes || null,
    })
    .select("id, request_id")
    .single();

  if (insertError || !insertedRequest) {
    return NextResponse.json({ error: insertError?.message ?? "Could not submit request." }, { status: 500 });
  }

  const requestId = insertedRequest.request_id as string;

  const budgetLine =
    budgetMin || budgetMax
      ? `AED ${budgetMin ? Number(budgetMin).toLocaleString() : "—"} – ${budgetMax ? Number(budgetMax).toLocaleString() : "—"}`
      : "Not specified";

  const salespersonHtml = `
    <p>Hi ${salesperson.full_name},</p>
    <p>You have received a new property request through Dubai Property Map.</p>
    <p><strong>Agency Details</strong><br/>
    Agency: ${agency.name}<br/>
    Contact: ${agency.contact_person ?? "—"}<br/>
    Phone: ${agency.phone ?? "—"}<br/>
    Email: ${agency.company_email}</p>
    <p><strong>Property Request</strong><br/>
    Project: ${project.name}<br/>
    Property Type: ${propertyType}<br/>
    Bedrooms: ${bedrooms ?? "—"}<br/>
    Budget: ${budgetLine}<br/>
    Purpose: ${purchasePurpose ?? "—"}<br/>
    Payment: ${financing ?? "—"}<br/>
    Purchase Timeline: ${purchaseTimeline ?? "—"}${preferredUnit ? `<br/>Preferred Unit: ${preferredUnit}` : ""}</p>
    ${notes ? `<p><strong>Agency Notes</strong><br/>${notes}</p>` : ""}
    <p>Please contact the agency directly regarding this request.</p>
  `;

  const salespersonSendResult = await sendEmail({
    category: "agency_new_request",
    to: salesperson.email,
    subject: `New Agency Property Request – ${project.name} – ${requestId}`,
    html: salespersonHtml,
    replyTo: agency.company_email,
    relatedEntityType: "agency_property_request",
    relatedEntityId: insertedRequest.id,
  });
  void salespersonSendResult;

  const confirmationHtml = `
    <p>Hi ${agency.contact_person ?? agency.name},</p>
    <p>Your request for ${project.name} has been successfully submitted.</p>
    <p><strong>Salesperson:</strong> ${salesperson.full_name}<br/>
    <strong>Request ID:</strong> ${requestId}</p>
    <p>You can track the request from your Dubai Property Map dashboard.</p>
  `;
  await sendEmail({
    category: "agency_request_confirmation",
    to: agency.company_email,
    subject: `Your Property Request Has Been Submitted – ${requestId}`,
    html: confirmationHtml,
    relatedEntityType: "agency_property_request",
    relatedEntityId: insertedRequest.id,
  });

  const { data: salespersonProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("salesperson_id", salesperson.id)
    .maybeSingle();
  if (salespersonProfile) {
    const requestMessage = `New property request ${requestId} for ${project.name} from ${agency.name}.`;
    await notifyUser(salespersonProfile.id, requestMessage, project.id, admin);
    await sendPushToUser(salespersonProfile.id, { title: "New Property Request", body: requestMessage });
  }
  await notifyDeveloperTeam(
    project.developer_id,
    `New property request ${requestId} for ${project.name}.`,
    project.id,
    undefined,
    admin
  );

  return NextResponse.json({ requestId });
}
