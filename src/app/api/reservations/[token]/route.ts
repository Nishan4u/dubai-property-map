import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Public, no session -- the buyer signing a reservation may have no
// platform account at all. Mirrors the invitations-by-token route's
// shape (service-role lookup by an unguessable uuid token).
export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: reservation } = await admin
    .from("unit_reservations")
    .select("id, status, contract_snapshot_html, signed_at, crm_clients(full_name), projects(name)")
    .eq("sign_token", token)
    .maybeSingle();

  if (!reservation) {
    return NextResponse.json({ error: "Reservation not found." }, { status: 404 });
  }
  if (reservation.status === "draft") {
    return NextResponse.json({ error: "This reservation hasn't been sent yet." }, { status: 404 });
  }
  if (reservation.status === "cancelled") {
    return NextResponse.json({ error: "This reservation has been cancelled." }, { status: 410 });
  }

  let status = reservation.status;
  if (status === "sent") {
    await admin.from("unit_reservations").update({ status: "viewed", viewed_at: new Date().toISOString() }).eq("id", reservation.id);
    status = "viewed";
  }

  const client = Array.isArray(reservation.crm_clients) ? reservation.crm_clients[0] : reservation.crm_clients;
  const project = Array.isArray(reservation.projects) ? reservation.projects[0] : reservation.projects;

  return NextResponse.json({
    status,
    contractHtml: reservation.contract_snapshot_html,
    buyerName: client?.full_name ?? null,
    projectName: project?.name ?? null,
    signedAt: reservation.signed_at,
  });
}
