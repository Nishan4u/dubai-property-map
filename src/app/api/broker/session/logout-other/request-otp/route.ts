import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateOtp, hashToken } from "@/lib/broker/session";
import { sendEmail } from "@/lib/email";

// Re-validates the broker's password (proving device recovery isn't just
// "I have the email address") and, on success, establishes a real signed-in
// session for THIS browser via the cookie-writing request-scoped client —
// so by the time verify-otp runs, this device already looks like any other
// authenticated broker session; it's just missing an active broker_sessions
// row/device-token cookie until the OTP is confirmed.
export async function POST(request: NextRequest) {
  const { email, password } = await request.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError || !signInData.user) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("broker_id")
    .eq("id", signInData.user.id)
    .single();

  if (!profile?.broker_id) {
    await supabase.auth.signOut();
    return NextResponse.json({ error: "No broker account found for this email." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: broker } = await admin.from("brokers").select("full_name, email").eq("id", profile.broker_id).single();
  if (!broker) {
    return NextResponse.json({ error: "Broker account not found." }, { status: 400 });
  }

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await admin.from("broker_login_otps").insert({
    broker_id: profile.broker_id,
    purpose: "logout_other_device",
    otp_hash: hashToken(otp),
    expires_at: expiresAt,
  });

  await sendEmail({
    category: "device_logout_otp",
    to: broker.email,
    subject: "Your Dubai Property Map device verification code",
    html: `<p>Hi ${broker.full_name},</p><p>Your verification code to log out your other device is:</p><p style="font-size:24px;font-weight:700;letter-spacing:4px;">${otp}</p><p>This code expires in 10 minutes. If you didn't request this, contact support immediately.</p>`,
    relatedEntityType: "broker",
    relatedEntityId: profile.broker_id,
  });

  return NextResponse.json({ ok: true });
}
