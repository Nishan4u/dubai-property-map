import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getLockoutStatus } from "@/lib/authLockout";

// Called from the client right after signInWithPassword fails with
// invalid_credentials (not e.g. email_not_confirmed, which isn't a wrong
// password). There's no session at this point, so this writes with the
// service-role client, bypassing RLS.
//
// Known, accepted tradeoff of any email-keyed lockout: this endpoint has
// no way to verify the caller actually owns the email being reported as
// a failed attempt, since by definition the caller hasn't authenticated.
// Anyone who knows a real user's email can trigger enough of these to
// lock that account out on purpose. That's inherent to choosing to build
// account lockout at all (every implementation of this pattern has the
// same exposure) -- not something this pass tries to fully close.
export async function POST(request: NextRequest) {
  const { email } = (await request.json()) as { email?: string };
  if (!email) {
    return NextResponse.json({ locked: false, attemptsRemaining: 0 });
  }
  const normalizedEmail = email.trim().toLowerCase();

  const admin = createAdminClient();
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? null;

  await admin.from("login_history").insert({
    user_id: null,
    email: normalizedEmail,
    ip,
    user_agent: request.headers.get("user-agent"),
    success: false,
  });

  const status = await getLockoutStatus(admin, normalizedEmail);
  return NextResponse.json(status);
}
