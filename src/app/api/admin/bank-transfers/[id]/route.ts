import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/auditLog";

type Action = "approve" | "reject";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const { action, reason } = (await request.json()) as { action: Action; reason?: string };

  const admin = createAdminClient();
  const { data: transfer } = await admin
    .from("subscription_bank_transfers")
    .select("account_type, developer_id, broker_id, plan_key, status")
    .eq("id", id)
    .single();
  if (!transfer) {
    return NextResponse.json({ error: "Submission not found." }, { status: 404 });
  }
  if (transfer.status !== "verification_pending") {
    return NextResponse.json({ error: "This submission has already been reviewed." }, { status: 400 });
  }

  const reviewFields = {
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
  };

  if (action === "approve") {
    const { error: transferError } = await admin
      .from("subscription_bank_transfers")
      .update({ status: "paid", rejection_reason: null, ...reviewFields })
      .eq("id", id);
    if (transferError) {
      return NextResponse.json({ error: transferError.message }, { status: 500 });
    }

    if (transfer.account_type === "developer" && transfer.developer_id) {
      const { error } = await admin
        .from("developers")
        .update({ plan_tier: transfer.plan_key, subscription_status: "active" })
        .eq("id", transfer.developer_id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else if (transfer.account_type === "broker" && transfer.broker_id) {
      const expires = new Date();
      expires.setDate(expires.getDate() + 30);
      const { error } = await admin
        .from("brokers")
        .update({
          plan_key: transfer.plan_key,
          subscription_status: "active",
          subscription_expires_at: expires.toISOString().slice(0, 10),
        })
        .eq("id", transfer.broker_id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
  } else if (action === "reject") {
    const { error } = await admin
      .from("subscription_bank_transfers")
      .update({ status: "rejected", rejection_reason: reason ?? null, ...reviewFields })
      .eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  await logAudit(
    `bank_transfer.${action}`,
    "subscription_bank_transfer",
    id,
    { reason },
    { client: admin, actorId: user.id, actorEmail: user.email }
  );

  return NextResponse.json({ ok: true });
}
