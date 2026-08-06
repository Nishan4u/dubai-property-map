import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requestWithdrawal } from "@/lib/brokerReferrals";
import { logAudit } from "@/lib/auditLog";

export async function POST(request: NextRequest) {
  const { amountAed, bankAccountName, bankName, bankIban } = (await request.json()) as {
    amountAed?: number;
    bankAccountName?: string;
    bankName?: string;
    bankIban?: string;
  };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { data: profile } = await supabase.from("profiles").select("broker_id").eq("id", user.id).single();
  if (!profile?.broker_id) {
    return NextResponse.json({ error: "No broker account found." }, { status: 400 });
  }

  const result = await requestWithdrawal("broker", profile.broker_id, {
    amountAed: Number(amountAed),
    bankAccountName: bankAccountName ?? "",
    bankName: bankName ?? "",
    bankIban: bankIban ?? "",
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await logAudit(
    "broker.wallet_withdrawal_requested",
    "broker",
    profile.broker_id,
    { amount_aed: amountAed },
    { actorId: user.id, actorEmail: user.email }
  );

  return NextResponse.json({ ok: true });
}
