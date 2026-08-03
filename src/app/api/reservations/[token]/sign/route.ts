import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/auditLog";

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { signatureType, signatureData, signedByName } = (await request.json()) as {
    signatureType?: string;
    signatureData?: string;
    signedByName?: string;
  };

  if (!signatureType || !signatureData || !signedByName?.trim()) {
    return NextResponse.json({ error: "A signature and name are required." }, { status: 400 });
  }
  if (signatureType !== "typed" && signatureType !== "drawn") {
    return NextResponse.json({ error: "Invalid signature type." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: reservation } = await admin
    .from("unit_reservations")
    .select("id, status")
    .eq("sign_token", token)
    .maybeSingle();

  if (!reservation) {
    return NextResponse.json({ error: "Reservation not found." }, { status: 404 });
  }
  if (!["sent", "viewed"].includes(reservation.status)) {
    return NextResponse.json({ error: "This reservation can no longer be signed." }, { status: 409 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? null;
  const userAgent = request.headers.get("user-agent");

  const { error } = await admin
    .from("unit_reservations")
    .update({
      status: "signed",
      signature_type: signatureType,
      signature_data: signatureData,
      signed_by_name: signedByName.trim(),
      signed_at: new Date().toISOString(),
      signed_ip: ip,
      signed_user_agent: userAgent,
    })
    .eq("id", reservation.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit("unit_reservation.signed", "unit_reservation", reservation.id, { signatureType }, { client: admin });

  return NextResponse.json({ ok: true });
}
