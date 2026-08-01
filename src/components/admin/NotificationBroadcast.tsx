"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { CompactSelect } from "@/components/public/CompactSelect";
import { createClient } from "@/lib/supabase/client";
import { logAudit } from "@/lib/auditLog";

const AUDIENCE_OPTIONS: { label: string; value: Audience }[] = [
  { label: "All Buyers", value: "buyers" },
  { label: "All Developers", value: "developers" },
  { label: "Specific Developer", value: "developer" },
];

type Audience = "buyers" | "developers" | "developer";

export function NotificationBroadcast({
  developers,
}: {
  developers: { id: string; name: string }[];
}) {
  const [audience, setAudience] = useState<Audience>("buyers");
  const [developerId, setDeveloperId] = useState(developers[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleSend() {
    if (!message.trim()) return;
    setSending(true);
    setResult(null);
    const supabase = createClient();

    let recipients: { id: string }[] = [];
    if (audience === "buyers") {
      const { data } = await supabase.from("profiles").select("id").eq("role", "buyer");
      recipients = data ?? [];
    } else if (audience === "developers") {
      const { data } = await supabase.from("profiles").select("id").eq("role", "developer");
      recipients = data ?? [];
    } else {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("developer_id", developerId);
      recipients = data ?? [];
    }

    let insertError = null;
    if (recipients.length > 0) {
      const { error } = await supabase.from("notifications").insert(
        recipients.map((r) => ({ user_id: r.id, message: message.trim() }))
      );
      insertError = error;
    }

    if (insertError) {
      setResult(`Failed to send: ${insertError.message}`);
      setSending(false);
      return;
    }

    await logAudit("notification.broadcast", "notification", null, {
      audience,
      developerId: audience === "developer" ? developerId : undefined,
      recipientCount: recipients.length,
    });

    setResult(
      recipients.length === 0
        ? "No matching recipients found — nothing was sent."
        : `Sent to ${recipients.length} recipient${recipients.length === 1 ? "" : "s"}.`
    );
    setMessage("");
    setSending(false);
  }

  return (
    <div className="max-w-xl space-y-4 rounded-xl border border-navy-700 bg-navy-850 p-5">
      <CompactSelect
        label="Audience"
        placeholder="Select audience"
        allowClear={false}
        searchable={false}
        value={audience}
        onChange={(v) => setAudience(v as Audience)}
        options={AUDIENCE_OPTIONS}
      />

      {audience === "developer" && (
        <CompactSelect
          label="Developer"
          placeholder="Select developer"
          allowClear={false}
          value={developerId}
          onChange={setDeveloperId}
          options={developers.map((d) => ({ label: d.name, value: d.id }))}
        />
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-ink-400">Message</label>
        <textarea
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="e.g. New payment plans are now available for Q1 launches."
          className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
        />
      </div>

      {result && <p className="text-xs font-medium text-emerald-400">{result}</p>}

      <button
        onClick={handleSend}
        disabled={sending || !message.trim()}
        className="flex items-center gap-1.5 rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
      >
        <Send className="h-3.5 w-3.5" />
        {sending ? "Sending…" : "Send Notification"}
      </button>
    </div>
  );
}
