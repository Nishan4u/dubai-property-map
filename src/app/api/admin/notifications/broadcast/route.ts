import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

type Audience = "buyers" | "developers" | "developer";

export async function POST(request: NextRequest) {
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

  const { audience, developerId, message, sendEmailToo } = (await request.json()) as {
    audience: Audience;
    developerId?: string;
    message: string;
    sendEmailToo?: boolean;
  };

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  const admin = createAdminClient();

  let recipients: { id: string }[] = [];
  if (audience === "buyers") {
    const { data } = await admin.from("profiles").select("id").eq("role", "buyer");
    recipients = data ?? [];
  } else if (audience === "developers") {
    const { data } = await admin.from("profiles").select("id").eq("role", "developer");
    recipients = data ?? [];
  } else {
    const { data } = await admin.from("profiles").select("id").eq("developer_id", developerId ?? "");
    recipients = data ?? [];
  }

  if (recipients.length > 0) {
    const { error: insertError } = await admin
      .from("notifications")
      .insert(recipients.map((r) => ({ user_id: r.id, message: message.trim() })));
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  let emailsSent = 0;
  if (sendEmailToo && recipients.length > 0) {
    const results = await Promise.all(
      recipients.map(async (r) => {
        const { data } = await admin.auth.admin.getUserById(r.id);
        const email = data?.user?.email;
        if (!email) return false;
        const { ok } = await sendEmail({
          category: "marketing_broadcast",
          to: email,
          subject: "New Update from Dubai Property Map",
          html: `<p>${message.trim().replace(/\n/g, "<br />")}</p>`,
        });
        return ok;
      })
    );
    emailsSent = results.filter(Boolean).length;
  }

  return NextResponse.json({ recipientCount: recipients.length, emailsSent });
}
