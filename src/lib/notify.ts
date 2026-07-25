import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

// `client` lets a server route pass its own server/admin client instead of
// the default browser client (e.g. the property-request route notifying a
// salesperson from inside a Route Handler).
export async function notifyUser(
  userId: string,
  message: string,
  projectId?: string,
  client?: SupabaseClient
) {
  const supabase = client ?? createClient();
  await supabase
    .from("notifications")
    .insert({ user_id: userId, message, project_id: projectId ?? null });
}

export async function notifyDeveloperTeam(
  developerId: string,
  message: string,
  projectId?: string,
  prefKey?: "new_leads" | "new_messages",
  client?: SupabaseClient
) {
  const supabase = client ?? createClient();

  if (prefKey) {
    const { data: developer } = await supabase
      .from("developers")
      .select("notification_prefs")
      .eq("id", developerId)
      .single();
    const prefs = developer?.notification_prefs as Record<string, boolean> | null;
    if (prefs && prefs[prefKey] === false) return;
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id")
    .eq("developer_id", developerId);

  if (!profiles?.length) return;

  await supabase.from("notifications").insert(
    profiles.map((p) => ({
      user_id: p.id,
      message,
      project_id: projectId ?? null,
    }))
  );
}

export async function sendLeadWebhook(
  developerId: string,
  payload: Record<string, unknown>
) {
  const supabase = createClient();
  const { data: developer } = await supabase
    .from("developers")
    .select("lead_webhook_url")
    .eq("id", developerId)
    .single();

  const url = developer?.lead_webhook_url;
  if (!url) return;

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // Best-effort — the developer's own endpoint may be unreachable or
    // block cross-origin requests; the lead itself is already saved.
  }
}
