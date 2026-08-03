import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getLockoutStatus } from "@/lib/authLockout";

// Called from the client right before signInWithPassword, so a locked
// account is blocked even on a correct password -- that's the whole
// point of lockout. Read-only; the service-role client is required here
// (not the session client) because there's no session yet to authenticate
// as, and normal users can't read other accounts' login_history rows.
export async function POST(request: NextRequest) {
  const { email } = (await request.json()) as { email?: string };
  if (!email) {
    return NextResponse.json({ locked: false, attemptsRemaining: 0 });
  }

  const admin = createAdminClient();
  const status = await getLockoutStatus(admin, email.trim().toLowerCase());
  return NextResponse.json(status);
}
