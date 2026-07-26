import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

// Fires after a bank transfer receipt has already been inserted client-side
// — mirrors /api/leads/notify: email-only, never blocks the submission.
export async function POST(request: NextRequest) {
  const { transferId } = (await request.json()) as { transferId?: string };
  if (!transferId) {
    return NextResponse.json({ error: "transferId is required." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: transfer } = await admin
    .from("subscription_bank_transfers")
    .select("id, account_type, developer_id, broker_id, salesperson_id, plan_key, submitted_by")
    .eq("id", transferId)
    .single();
  if (!transfer || transfer.submitted_by !== user.id) {
    return NextResponse.json({ error: "Submission not found." }, { status: 404 });
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

  if (accountEmail) {
    await sendEmail({
      category: "bank_transfer_submitted",
      to: accountEmail,
      subject: "We've received your bank transfer submission",
      html: `<p>Hi ${accountName},</p><p>Thanks — we've received your bank transfer receipt for <strong>${transfer.plan_key}</strong>. An admin will review it shortly and you'll be notified once it's approved.</p>`,
      relatedEntityType: "subscription_bank_transfer",
      relatedEntityId: transfer.id,
    });
  }

  return NextResponse.json({ ok: true });
}
