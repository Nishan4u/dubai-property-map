import { createAdminClient } from "@/lib/supabase/admin";

// Server-only (no "use client") -- called from the streaming API routes
// after runToolLoop's onUsage callback fires. Uses the service-role
// client since MapAI serves anonymous guests with no session to key an
// RLS policy off, same stance as broker_payments' own insert-side
// comment: written only via the service-role client, no client-facing
// insert policy exists for this table.
export async function logAiUsage({
  kind,
  userId,
  model,
  inputTokens,
  outputTokens,
}: {
  kind: "mapai" | "broker" | "sales";
  userId: string | null;
  model: string;
  inputTokens: number;
  outputTokens: number;
}) {
  const supabase = createAdminClient();
  await supabase.from("ai_usage_log").insert({
    kind,
    user_id: userId,
    model,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
  });
}
