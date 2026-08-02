import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { tryFinalizeReferralCashback } from "@/lib/brokerReferrals";

// The actual token-consuming step -- only ever reached via a POST triggered
// by a real button click on /auth/confirm (see that page), never by the
// bare GET the email link itself points to. See verify-email/route.ts for
// why that split exists.
export async function POST(request: NextRequest) {
  const { token } = await request.json();
  if (!token || typeof token !== "string") {
    return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: row } = await admin.from("email_verification_tokens").select("*").eq("token", token).maybeSingle();

  if (!row) return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
  if (row.used_at) return NextResponse.json({ ok: false, reason: "used" }, { status: 400 });
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ ok: false, reason: "expired" }, { status: 400 });
  }

  await admin.from("email_verification_tokens").update({ used_at: new Date().toISOString() }).eq("id", row.id);
  await admin.auth.admin.updateUserById(row.user_id, { email_confirm: true });

  // Broker/Salesperson Referral Program: covers the race where payment
  // completed before email verification did (neither dashboard currently
  // gates access on email_confirmed_at) -- no-ops if there's no referred
  // account waiting on this, or it's already been credited.
  const { data: profile } = await admin.from("profiles").select("broker_id, salesperson_id").eq("id", row.user_id).maybeSingle();
  if (profile?.broker_id) {
    await tryFinalizeReferralCashback("broker", profile.broker_id);
  } else if (profile?.salesperson_id) {
    await tryFinalizeReferralCashback("salesperson", profile.salesperson_id);
  }

  return NextResponse.json({ ok: true });
}
