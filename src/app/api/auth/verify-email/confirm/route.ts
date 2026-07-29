import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

  return NextResponse.json({ ok: true });
}
