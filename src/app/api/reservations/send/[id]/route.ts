import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { renderReservationContract } from "@/lib/contractTemplate";
import { sendEmail } from "@/lib/email";
import { logAudit } from "@/lib/auditLog";

interface JoinedProject {
  name: string;
  developers: { name: string } | { name: string }[] | null;
  communities: { name: string } | { name: string }[] | null;
}

// Session-authenticated (broker/salesperson/developer) -- uses the
// session client throughout, not the service-role client, since RLS's
// own "owner manages own" policy on unit_reservations already scopes
// both the select and the update to the caller's own reservations.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { data: reservation } = await supabase
    .from("unit_reservations")
    .select(
      "id, status, unit_id, unit_number, price_aed, deposit_amount_aed, sign_token, crm_clients(full_name, email, phone), projects(name, developers(name), communities(name)), project_unit_types(unit_name, unit_type)"
    )
    .eq("id", id)
    .maybeSingle();

  if (!reservation) {
    return NextResponse.json({ error: "Reservation not found." }, { status: 404 });
  }
  if (reservation.status !== "draft") {
    return NextResponse.json({ error: "Only a draft reservation can be sent." }, { status: 400 });
  }

  const client = Array.isArray(reservation.crm_clients) ? reservation.crm_clients[0] : reservation.crm_clients;
  if (!client?.email) {
    return NextResponse.json({ error: "This client has no email on file to send the contract to." }, { status: 400 });
  }

  // Locks the unit before doing anything else -- if two drafts reference
  // the same unit, whichever sends first wins. The session client can't
  // write project_units at all if the caller is a broker/salesperson
  // (that table's RLS only grants write access to the owning developer),
  // so this narrow, already-audited side-effect uses the service-role
  // client, same shape as the sign route. Conditioned on status='available'
  // and checked for affected rows, not a blind update, so a conflict is
  // caught rather than silently overwriting someone else's lock.
  if (reservation.unit_id) {
    const admin = createAdminClient();
    const { data: locked } = await admin
      .from("project_units")
      .update({ status: "reserved", updated_at: new Date().toISOString() })
      .eq("id", reservation.unit_id)
      .eq("status", "available")
      .select("id");
    if (!locked || locked.length === 0) {
      return NextResponse.json({ error: "This unit is no longer available — pick a different unit." }, { status: 409 });
    }
  }

  const project = (Array.isArray(reservation.projects) ? reservation.projects[0] : reservation.projects) as
    | JoinedProject
    | undefined;
  const developer = Array.isArray(project?.developers) ? project?.developers[0] : project?.developers;
  const community = Array.isArray(project?.communities) ? project?.communities[0] : project?.communities;
  const unitType = Array.isArray(reservation.project_unit_types) ? reservation.project_unit_types[0] : reservation.project_unit_types;

  const contractHtml = renderReservationContract({
    buyerName: client.full_name,
    buyerEmail: client.email ?? null,
    buyerPhone: client.phone ?? null,
    projectName: project?.name ?? "",
    developerName: developer?.name ?? "",
    communityName: community?.name ?? null,
    unitType: unitType?.unit_name ?? unitType?.unit_type ?? null,
    unitNumber: reservation.unit_number,
    priceAed: reservation.price_aed,
    depositAed: reservation.deposit_amount_aed,
  });

  const { error } = await supabase
    .from("unit_reservations")
    .update({
      contract_snapshot_html: contractHtml,
      status: "sent",
      sent_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const origin = request.headers.get("origin") ?? request.nextUrl.origin;
  const signUrl = `${origin}/sign/${reservation.sign_token}`;

  await sendEmail({
    category: "reservation_contract",
    to: client.email,
    subject: `Your Reservation Agreement for ${project?.name ?? "your unit"}`,
    html: `
      <p>Hi ${client.full_name},</p>
      <p>Your Unit Reservation Agreement for <strong>${project?.name ?? "your unit"}</strong> is ready to review and sign.</p>
      <p><a href="${signUrl}">Review and sign the agreement</a></p>
    `,
    relatedEntityType: "unit_reservation",
    relatedEntityId: id,
  });

  await logAudit("unit_reservation.sent", "unit_reservation", id, {}, { actorId: user.id, actorEmail: user.email, client: supabase });

  return NextResponse.json({ ok: true });
}
