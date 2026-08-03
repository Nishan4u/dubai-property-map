import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/auditLog";

// Session-authenticated (broker/salesperson/developer) -- the reservation
// update itself goes through the session client, same as before this route
// existed, since RLS's own "owner manages own" policy already scopes it.
// Only the linked unit's release needs the service-role client, mirroring
// the send route's lock (that table's RLS only grants write access to the
// owning developer, not whichever role is doing the cancelling).
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
    .select("id, status, unit_id")
    .eq("id", id)
    .maybeSingle();

  if (!reservation) {
    return NextResponse.json({ error: "Reservation not found." }, { status: 404 });
  }
  if (reservation.status === "cancelled" || reservation.status === "signed") {
    return NextResponse.json({ error: "This reservation can no longer be cancelled." }, { status: 400 });
  }

  const { error } = await supabase.from("unit_reservations").update({ status: "cancelled" }).eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Guarded on status='reserved' so this never clobbers a unit that was
  // independently changed (e.g. already sold) by something else.
  if (reservation.unit_id) {
    const admin = createAdminClient();
    await admin
      .from("project_units")
      .update({ status: "available", updated_at: new Date().toISOString() })
      .eq("id", reservation.unit_id)
      .eq("status", "reserved");
  }

  await logAudit("unit_reservation.cancelled", "unit_reservation", id, {}, { actorId: user.id, actorEmail: user.email, client: supabase });

  return NextResponse.json({ ok: true });
}
