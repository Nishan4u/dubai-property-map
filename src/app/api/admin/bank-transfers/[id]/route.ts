import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/auditLog";
import { sendEmail } from "@/lib/email";

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
    .select("account_type, developer_id, broker_id, salesperson_id, plan_key, status")
    .eq("id", id)
    .single();
  if (!transfer) {
    return NextResponse.json({ error: "Submission not found." }, { status: 404 });
  }
  if (transfer.status !== "verification_pending") {
    return NextResponse.json({ error: "This submission has already been reviewed." }, { status: 400 });
  }

  let accountName = "";
  let accountEmail: string | null = null;
  if (transfer.account_type === "developer" && transfer.developer_id) {
    const { data } = await admin.from("developers").select("name, email").eq("id", transfer.developer_id).single();
    accountName = data?.name ?? "";
    accountEmail = data?.email ?? null;
  } else if (transfer.account_type === "broker" && transfer.broker_id) {
    const { data } = await admin.from("brokers").select("full_name, email").eq("id", transfer.broker_id).single();
    accountName = data?.full_name ?? "";
    accountEmail = data?.email ?? null;
  } else if (transfer.account_type === "salesperson" && transfer.salesperson_id) {
    const { data } = await admin.from("salespersons").select("full_name, email").eq("id", transfer.salesperson_id).single();
    accountName = data?.full_name ?? "";
    accountEmail = data?.email ?? null;
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
        .update({ plan_tier: transfer.plan_key, subscription_status: "active", payment_type: "bank_transfer" })
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
          payment_type: "bank_transfer",
        })
        .eq("id", transfer.broker_id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else if (transfer.account_type === "salesperson" && transfer.salesperson_id) {
      const expires = new Date();
      expires.setDate(expires.getDate() + 30);
      const { error } = await admin
        .from("salespersons")
        .update({
          plan_key: transfer.plan_key,
          subscription_status: "active",
          subscription_expires_at: expires.toISOString().slice(0, 10),
          payment_type: "bank_transfer",
        })
        .eq("id", transfer.salesperson_id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    if (accountEmail) {
      await sendEmail({
        category: "bank_transfer_approved",
        to: accountEmail,
        subject: "Your bank transfer payment has been approved",
        html: `<p>Hi ${accountName},</p><p>Your bank transfer for <strong>${transfer.plan_key}</strong> has been approved and your subscription is now active.</p>`,
        relatedEntityType: "subscription_bank_transfer",
        relatedEntityId: id,
      });
    }
  } else if (action === "reject") {
    const { error } = await admin
      .from("subscription_bank_transfers")
      .update({ status: "rejected", rejection_reason: reason ?? null, ...reviewFields })
      .eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (accountEmail) {
      await sendEmail({
        category: "bank_transfer_rejected",
        to: accountEmail,
        subject: "Your bank transfer payment could not be verified",
        html: `<p>Hi ${accountName},</p><p>Your bank transfer submission for <strong>${transfer.plan_key}</strong> could not be verified${reason ? `: ${reason}` : "."}</p><p>Please double-check your receipt and submit again, or contact support.</p>`,
        relatedEntityType: "subscription_bank_transfer",
        relatedEntityId: id,
      });
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
