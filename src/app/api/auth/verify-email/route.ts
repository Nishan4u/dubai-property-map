import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token = searchParams.get("token");
  const next = searchParams.get("next") ?? "/";

  const confirmUrl = (params: string) => NextResponse.redirect(`${origin}/auth/confirm?${params}`);

  if (!token) return confirmUrl("verify_error=invalid");

  const admin = createAdminClient();
  const { data: row } = await admin.from("email_verification_tokens").select("*").eq("token", token).maybeSingle();

  if (!row) return confirmUrl("verify_error=invalid");
  if (row.used_at) return confirmUrl("verify_error=used");
  if (new Date(row.expires_at).getTime() < Date.now()) return confirmUrl("verify_error=expired");

  await admin.from("email_verification_tokens").update({ used_at: new Date().toISOString() }).eq("id", row.id);
  await admin.auth.admin.updateUserById(row.user_id, { email_confirm: true });

  return confirmUrl(`verified=1&next=${encodeURIComponent(next)}`);
}
