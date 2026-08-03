import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Called fire-and-forget from the client right after a fully-authenticated
// login (after any 2FA challenge has passed) -- mirrors the same
// session-client-then-insert shape as /api/broker/session/claim. Never
// blocks or fails the login itself; the caller ignores the response.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? null;
  const userAgent = request.headers.get("user-agent");

  const { error } = await supabase.from("login_history").insert({
    user_id: user.id,
    email: user.email ?? "",
    ip,
    user_agent: userAgent,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
