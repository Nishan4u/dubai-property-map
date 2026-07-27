import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createAndSendVerificationToken } from "@/lib/emailVerification";

// Always responds the same way regardless of whether the account exists or
// is already confirmed -- same anti-enumeration stance as forgot-password.
export async function POST(request: NextRequest) {
  const { email } = (await request.json()) as { email?: string };
  const normalized = (email ?? "").trim().toLowerCase();

  if (normalized) {
    const admin = createAdminClient();

    let user: { id: string; email?: string; email_confirmed_at?: string | null; user_metadata?: Record<string, unknown> } | undefined;
    let page = 1;
    while (!user) {
      const { data } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (!data?.users?.length) break;
      user = data.users.find((u) => u.email?.toLowerCase() === normalized);
      if (data.users.length < 200) break;
      page += 1;
    }

    if (user && !user.email_confirmed_at) {
      const meta = user.user_metadata ?? {};
      const role = (meta.role as string) ?? "buyer";
      const next = role === "developer" ? "/dashboard" : role === "broker" ? "/broker" : role === "salesperson" ? "/salesperson" : "/";
      await createAndSendVerificationToken(user.id, normalized, (meta.full_name as string) ?? "", next);
    }
  }

  return NextResponse.json({ ok: true });
}
