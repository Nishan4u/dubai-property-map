import type { SupabaseClient } from "@supabase/supabase-js";

export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_WINDOW_MINUTES = 15;

export type LockoutStatus =
  | { locked: false; attemptsRemaining: number }
  | { locked: true; retryAfterSeconds: number };

// Sliding window, not a fixed "locked_until" timestamp -- self-resolves
// as old failures age out of the window rather than needing a separate
// unlock step. Shared by both the pre-attempt check and the
// after-a-failure recorder so the counting logic lives in one place.
export async function getLockoutStatus(admin: SupabaseClient, email: string): Promise<LockoutStatus> {
  const windowStart = new Date(Date.now() - LOCKOUT_WINDOW_MINUTES * 60 * 1000).toISOString();
  const { data } = await admin
    .from("login_history")
    .select("created_at")
    .eq("email", email)
    .eq("success", false)
    .gte("created_at", windowStart)
    .order("created_at", { ascending: true });

  const attempts = data ?? [];
  if (attempts.length < MAX_LOGIN_ATTEMPTS) {
    return { locked: false, attemptsRemaining: MAX_LOGIN_ATTEMPTS - attempts.length };
  }

  const oldest = new Date(attempts[0].created_at as string).getTime();
  const retryAfterMs = oldest + LOCKOUT_WINDOW_MINUTES * 60 * 1000 - Date.now();
  return { locked: true, retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
}
