import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { notifyDeveloperTeam, notifyUser } from "@/lib/notify";

// The single atomic route for submitting a property request. Runs
// server-side only so RESEND_API_KEY never reaches the browser, and so the
// property_requests insert (which must succeed independent of whatever
// happens with email) and the notification bookkeeping happen in one
// controlled place instead of a client-side insert + a separate fire-and-
// forget email call that could silently drop the notification row if the
// tab closed mid-flight.
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
    .select("broker_id")
    .eq("id", user.id)
    .single();
  if (!profile?.broker_id) {
    return NextResponse.json({ error: "No broker account found." }, { status: 403 });
  }

  const admin = createAdminClient();

  const { data: broker } = await admin
    .from("brokers")
    .select("account_status, subscription_status, brokerage_id, full_name, email, mobile, whatsapp, brn")
    .eq("id", profile.broker_id)
    .single();
  if (!broker) {
    return NextResponse.json({ error: "Broker account not found." }, { status: 403 });
  }
  if (broker.account_status !== "approved") {
    return NextResponse.json({ error: "Your broker account is not yet approved." }, { status: 403 });
  }
  if (broker.subscription_status !== "active") {
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
    .from("property_requests")
    .insert({
      broker_id: profile.broker_id,
      brokerage_id: broker.brokerage_id,
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
      broker_notes: notes || null,
    })
    .select("id, request_id")
    .single();

  if (insertError || !insertedRequest) {
    return NextResponse.json({ error: insertError?.message ?? "Could not submit request." }, { status: 500 });
  }

  // Remember this broker's salesperson choice for this developer.
  await supabase
    .from("broker_salesperson_relationships")
    .upsert(
      { broker_id: profile.broker_id, developer_id: project.developer_id, salesperson_id: salesperson.id, updated_at: new Date().toISOString() },
      { onConflict: "broker_id,developer_id" }
    );

  // Everything below is best-effort — the request above has already
  // committed and must survive regardless of what happens with email.
  const requestId = insertedRequest.request_id as string;

  const budgetLine =
    budgetMin || budgetMax
      ? `AED ${budgetMin ? Number(budgetMin).toLocaleString() : "—"} – ${budgetMax ? Number(budgetMax).toLocaleString() : "—"}`
      : "Not specified";

  const salespersonHtml = `
    <p>Hi ${salesperson.full_name},</p>
    <p>You have received a new property request through Dubai Property Map.</p>
    <p><strong>Broker Details</strong><br/>
    Broker: ${broker.full_name}<br/>
    BRN: ${broker.brn}<br/>
    Mobile: ${broker.mobile}<br/>
    WhatsApp: ${broker.whatsapp}<br/>
    Email: ${broker.email}</p>
    <p><strong>Property Request</strong><br/>
    Project: ${project.name}<br/>
    Property Type: ${propertyType}<br/>
    Bedrooms: ${bedrooms ?? "—"}<br/>
    Budget: ${budgetLine}<br/>
    Purpose: ${purchasePurpose ?? "—"}<br/>
    Payment: ${financing ?? "—"}<br/>
    Purchase Timeline: ${purchaseTimeline ?? "—"}${preferredUnit ? `<br/>Preferred Unit: ${preferredUnit}` : ""}</p>
    ${notes ? `<p><strong>Broker Notes</strong><br/>${notes}</p>` : ""}
    <p>Please contact the broker directly regarding this request.</p>
  `;

  const { data: notifRow } = await admin
    .from("request_notifications")
    .insert({
      request_id: insertedRequest.id,
      salesperson_id: salesperson.id,
      recipient_email: salesperson.email,
      type: "salesperson_new_request",
    })
    .select("id")
    .single();

  const salespersonSendResult = await sendEmail({
    category: "salesperson_new_request",
    to: salesperson.email,
    subject: `New Broker Property Request – ${project.name} – ${requestId}`,
    html: salespersonHtml,
    relatedEntityType: "property_request",
    relatedEntityId: insertedRequest.id,
  });
  if (notifRow) {
    await admin
      .from("request_notifications")
      .update(
        salespersonSendResult.ok
          ? { status: "sent", sent_at: new Date().toISOString() }
          : { status: "failed", last_error: "See email_logs for details.", attempt_count: 1 }
      )
      .eq("id", notifRow.id);
  }

  const { data: confirmationRow } = await admin
    .from("request_notifications")
    .insert({
      request_id: insertedRequest.id,
      salesperson_id: salesperson.id,
      recipient_email: broker.email,
      type: "broker_confirmation",
    })
    .select("id")
    .single();

  const confirmationHtml = `
    <p>Hi ${broker.full_name},</p>
    <p>Your request for ${project.name} has been successfully submitted.</p>
    <p><strong>Salesperson:</strong> ${salesperson.full_name}<br/>
    <strong>Request ID:</strong> ${requestId}</p>
    <p>You can track the request from your Dubai Property Map dashboard.</p>
  `;
  const confirmationSendResult = await sendEmail({
    category: "broker_confirmation",
    to: broker.email,
    subject: `Your Property Request Has Been Submitted – ${requestId}`,
    html: confirmationHtml,
    relatedEntityType: "property_request",
    relatedEntityId: insertedRequest.id,
  });
  if (confirmationRow) {
    await admin
      .from("request_notifications")
      .update(
        confirmationSendResult.ok
          ? { status: "sent", sent_at: new Date().toISOString() }
          : { status: "failed", last_error: "See email_logs for details.", attempt_count: 1 }
      )
      .eq("id", confirmationRow.id);
  }

  const { data: salespersonProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("salesperson_id", salesperson.id)
    .maybeSingle();
  if (salespersonProfile) {
    await notifyUser(
      salespersonProfile.id,
      `New property request ${requestId} for ${project.name} from ${broker.full_name}.`,
      project.id,
      admin
    );
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
