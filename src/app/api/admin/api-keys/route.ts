import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateApiKey, type ApiScope } from "@/lib/apiAuth";
import { logAudit } from "@/lib/auditLog";

const VALID_SCOPES: ApiScope[] = ["projects:read", "communities:read", "developers:read"];

// Runs server-side only so the raw key can be generated + hashed with
// Node's crypto module and returned exactly once -- mirrors
// /api/integrations's "generate a secret the client can never re-derive"
// contract, one step further (only the hash is ever persisted, not the
// raw secret, since a bearer API key never needs to be re-signed with
// like a webhook secret does).
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

  const { name, scopes } = (await request.json()) as { name: string; scopes: string[] };
  const cleanScopes = (scopes ?? []).filter((s): s is ApiScope => VALID_SCOPES.includes(s as ApiScope));
  if (!name?.trim() || cleanScopes.length === 0) {
    return NextResponse.json({ error: "A name and at least one scope are required." }, { status: 400 });
  }

  const { rawKey, keyPrefix, keyHash } = generateApiKey();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("api_keys")
    .insert({ name: name.trim(), key_prefix: keyPrefix, key_hash: keyHash, scopes: cleanScopes, created_by: user.id })
    .select("id, name, key_prefix, scopes, status, created_at")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Failed to create API key." }, { status: 500 });
  }

  await logAudit("create", "api_key", data.id, { name: data.name, scopes: cleanScopes }, { client: supabase, actorId: user.id, actorEmail: user.email });

  return NextResponse.json({ apiKey: { ...data, rawKey } });
}
