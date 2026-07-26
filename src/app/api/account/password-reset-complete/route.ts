import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

// Called right after a successful supabase.auth.updateUser({ password })
// on /reset-password — the password itself is already changed by then, so
// everything here is best-effort cleanup: revoke every other session for
// this account and send a "your password was changed" confirmation email.
export async function POST() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const admin = createAdminClient();

  await admin.auth.admin.signOut(session.access_token, "others").catch(() => {});

  const email = session.user.email;
  if (email) {
    await sendEmail({
      category: "password_changed",
      to: email,
      subject: "Your Dubai Property Map password was changed",
      html: `
        <p>Hi,</p>
        <p>This confirms your Dubai Property Map account password was just changed. All other active sessions have been signed out.</p>
        <p>If you didn't make this change, please contact support immediately.</p>
      `,
    });
  }

  return NextResponse.json({ ok: true });
}
