"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logAudit } from "@/lib/auditLog";

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
      <div>
        <label className="mb-1 block text-xs font-medium text-ink-400">Audience</label>
        <select
          value={audience}
          onChange={(e) => setAudience(e.target.value as Audience)}
          className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
        >
          <option value="buyers">All Buyers</option>
          <option value="developers">All Developers</option>
          <option value="developer">Specific Developer</option>
        </select>
      </div>

      {audience === "developer" && (
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-400">Developer</label>
          <select
            value={developerId}
            onChange={(e) => setDeveloperId(e.target.value)}
            className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
          >
            {developers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
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
