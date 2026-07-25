import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DEVICE_TOKEN_COOKIE, generateDeviceToken, hashToken, parseDeviceLabel } from "@/lib/broker/session";

// Called right after signInWithPassword succeeds, from the client. Inserts
// this device as the broker's one active session — the partial unique
// index on broker_sessions(broker_id) where status='active' makes a
// concurrent second login fail atomically as a 23505, not an app-level race.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("broker_id")
    .eq("id", user.id)
    .single();

  if (!profile?.broker_id) {
    return NextResponse.json({ error: "No broker account found." }, { status: 400 });
  }

  const token = generateDeviceToken();
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? null;
  const deviceLabel = parseDeviceLabel(request.headers.get("user-agent"));

  const { error } = await supabase.from("broker_sessions").insert({
    broker_id: profile.broker_id,
    device_label: deviceLabel,
    ip,
    device_token_hash: hashToken(token),
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ code: "device_conflict" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(DEVICE_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  return response;
}
