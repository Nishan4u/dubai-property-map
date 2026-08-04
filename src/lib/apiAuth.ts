import crypto from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isApiRateLimited } from "@/lib/apiRateLimit";

// Server-only (Node's crypto module) -- never imported by a client
// component. Only ever reached from the /api/v1/* route handlers and the
// admin key-creation route below, both provably server-only, so this
// avoids the exact "Node lib pulled into the client bundle" bug hit while
// building Web Push (src/lib/notify.ts had to be reverted after web-push's
// tls/net imports broke the production build via a client-reachable
// import chain).
export type ApiScope = "projects:read" | "communities:read" | "developers:read";

function hashKey(rawKey: string): string {
  return crypto.createHash("sha256").update(rawKey).digest("hex");
}

// The raw key is only ever known at generation time -- callers must save
// it immediately, it can never be displayed again (only key_hash is
// stored). key_prefix keeps enough of it visible in the admin UI to tell
// keys apart without ever being able to reconstruct the real value.
export function generateApiKey(): { rawKey: string; keyPrefix: string; keyHash: string } {
  const rawKey = `dpm_live_${crypto.randomBytes(24).toString("hex")}`;
  return { rawKey, keyPrefix: rawKey.slice(0, 16), keyHash: hashKey(rawKey) };
}

interface AuthenticatedKey {
  id: string;
  scopes: ApiScope[];
}

async function authenticateApiKey(request: Request, admin: ReturnType<typeof createAdminClient>): Promise<AuthenticatedKey | null> {
  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  const keyHash = hashKey(match[1].trim());
  const { data } = await admin.from("api_keys").select("id, scopes, status").eq("key_hash", keyHash).maybeSingle();
  if (!data || data.status !== "active") return null;

  // Best-effort, must never block or fail the actual request.
  void admin.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", data.id);

  return { id: data.id, scopes: (data.scopes ?? []) as ApiScope[] };
}

// Shared auth + scope + rate-limit + logging wrapper for every /api/v1/*
// route -- each route only supplies the scope it needs and the data
// fetch itself, so the auth/log contract can't drift between endpoints.
// Every attempt (success or failure) is logged to api_request_logs,
// mirroring dispatchCrmEvent's (src/lib/crmIntegrations.ts) "log every
// attempt regardless of outcome" contract.
export async function withApiAuth(request: Request, scope: ApiScope, endpoint: string, handler: () => Promise<unknown>): Promise<NextResponse> {
  const admin = createAdminClient();
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  async function log(apiKeyId: string | null, statusCode: number) {
    await admin.from("api_request_logs").insert({ api_key_id: apiKeyId, endpoint, status_code: statusCode, ip });
  }

  const auth = await authenticateApiKey(request, admin);
  if (!auth) {
    await log(null, 401);
    return NextResponse.json({ error: "Invalid or missing API key." }, { status: 401 });
  }
  if (!auth.scopes.includes(scope)) {
    await log(auth.id, 403);
    return NextResponse.json({ error: `This API key does not have the '${scope}' scope.` }, { status: 403 });
  }
  if (isApiRateLimited(auth.id)) {
    await log(auth.id, 429);
    return NextResponse.json({ error: "Rate limit exceeded. Try again shortly." }, { status: 429 });
  }

  try {
    const data = await handler();
    await log(auth.id, 200);
    return NextResponse.json(data);
  } catch {
    await log(auth.id, 500);
    return NextResponse.json({ error: "Internal error." }, { status: 500 });
  }
}
