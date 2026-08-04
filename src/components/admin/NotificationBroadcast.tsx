"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { CompactSelect } from "@/components/public/CompactSelect";
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
  const [sendEmailToo, setSendEmailToo] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleSend() {
    if (!message.trim()) return;
    setSending(true);
    setResult(null);

    const res = await fetch("/api/admin/notifications/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audience, developerId, message: message.trim(), sendEmailToo }),
    });
    const body = await res.json();

    if (!res.ok) {
      setResult(`Failed to send: ${body.error}`);
      setSending(false);
      return;
    }

    const { recipientCount, emailsSent } = body as { recipientCount: number; emailsSent: number };

    await logAudit("notification.broadcast", "notification", null, {
      audience,
      developerId: audience === "developer" ? developerId : undefined,
      recipientCount,
      emailsSent,
    });

    setResult(
      recipientCount === 0
        ? "No matching recipients found — nothing was sent."
        : `Sent to ${recipientCount} recipient${recipientCount === 1 ? "" : "s"}${sendEmailToo ? ` (${emailsSent} email${emailsSent === 1 ? "" : "s"} sent)` : ""}.`
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

      <label className="flex items-center gap-2 text-xs text-ink-400">
        <input
          type="checkbox"
          checked={sendEmailToo}
          onChange={(e) => setSendEmailToo(e.target.checked)}
          className="h-3.5 w-3.5 rounded border-navy-600 bg-navy-800"
        />
        Also send email to each recipient
      </label>

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
