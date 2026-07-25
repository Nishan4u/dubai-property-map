import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEVICE_TOKEN_COOKIE, generateDeviceToken, hashToken, parseDeviceLabel } from "@/lib/broker/session";
import { logAudit } from "@/lib/auditLog";

const MAX_ATTEMPTS = 5;

export async function POST(request: NextRequest) {
  const { otp } = await request.json();
  if (!otp) {
    return NextResponse.json({ error: "Enter the code from your email." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Session expired — start over." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("broker_id")
    .eq("id", user.id)
    .single();
  if (!profile?.broker_id) {
    return NextResponse.json({ error: "No broker account found." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: otpRow } = await admin
    .from("broker_login_otps")
    .select("*")
    .eq("broker_id", profile.broker_id)
    .eq("purpose", "logout_other_device")
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!otpRow || new Date(otpRow.expires_at) < new Date()) {
    return NextResponse.json({ error: "Code expired — request a new one." }, { status: 400 });
  }
  if (otpRow.attempt_count >= MAX_ATTEMPTS) {
    return NextResponse.json({ error: "Too many attempts — request a new code." }, { status: 429 });
  }
  if (otpRow.otp_hash !== hashToken(otp)) {
    await admin.from("broker_login_otps").update({ attempt_count: otpRow.attempt_count + 1 }).eq("id", otpRow.id);
    return NextResponse.json({ error: "Incorrect code." }, { status: 400 });
  }

  await admin.from("broker_login_otps").update({ consumed_at: new Date().toISOString() }).eq("id", otpRow.id);
  await admin
    .from("broker_sessions")
    .update({ status: "revoked", revoked_at: new Date().toISOString(), revoked_by: user.id })
    .eq("broker_id", profile.broker_id)
    .eq("status", "active");

  const token = generateDeviceToken();
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? null;
  const deviceLabel = parseDeviceLabel(request.headers.get("user-agent"));

  await admin.from("broker_sessions").insert({
    broker_id: profile.broker_id,
    device_label: deviceLabel,
    ip,
    device_token_hash: hashToken(token),
  });

  await logAudit("broker.logout_other_device", "broker", profile.broker_id, {}, { client: admin, actorId: user.id, actorEmail: user.email });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(DEVICE_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  return response;
}
