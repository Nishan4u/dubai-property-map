import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminPermissionContext, hasModuleAccess } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { sendSms } from "@/lib/sms";

const BATCH_SIZE = 20;

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

  const { profile: permissionProfile, permissions } = await getAdminPermissionContext(supabase, user.id);
  if (!hasModuleAccess(permissionProfile, permissions, "campaigns", "manage")) {
    return NextResponse.json({ error: "You don't have permission to manage campaigns." }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: campaign } = await admin.from("marketing_campaigns").select("*").eq("id", id).single();
  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
  }
  if (campaign.status !== "draft") {
    return NextResponse.json({ error: "This campaign has already been sent." }, { status: 400 });
  }

  const contactColumn = campaign.channel === "email" ? "email" : "phone";
  const { data: clients } = await admin
    .from("crm_clients")
    .select("email, phone")
    .eq("marketing_opt_out", false)
    .not(contactColumn, "is", null);

  const contacts = Array.from(
    new Set((clients ?? []).map((c) => (campaign.channel === "email" ? c.email : c.phone)).filter((v): v is string => !!v))
  );

  await admin.from("marketing_campaigns").update({ status: "sending", recipient_count: contacts.length }).eq("id", id);

  let sentCount = 0;
  let failedCount = 0;

  for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
    const batch = contacts.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (contact) => {
        if (campaign.channel === "email") {
          const { ok } = await sendEmail({
            category: "marketing_campaign",
            to: contact,
            subject: campaign.subject ?? campaign.name,
            html: `<p>${campaign.body.replace(/\n/g, "<br />")}</p>`,
          });
          return ok;
        }
        const { ok } = await sendSms({ campaignId: campaign.id, to: contact, body: campaign.body });
        return ok;
      })
    );
    sentCount += results.filter(Boolean).length;
    failedCount += results.filter((ok) => !ok).length;
  }

  await admin
    .from("marketing_campaigns")
    .update({
      status: sentCount > 0 || contacts.length === 0 ? "sent" : "failed",
      sent_at: new Date().toISOString(),
      sent_count: sentCount,
      failed_count: failedCount,
    })
    .eq("id", id);

  return NextResponse.json({ recipientCount: contacts.length, sentCount, failedCount });
}
