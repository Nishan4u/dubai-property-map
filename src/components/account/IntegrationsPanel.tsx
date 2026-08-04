"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Eye, EyeOff, Copy, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/Badge";

const EVENT_OPTIONS = [
  { value: "lead.created", label: "New Lead (property request)" },
  { value: "client.created", label: "New Client" },
];

interface IntegrationLog {
  id: string;
  event: string;
  status: "success" | "failed";
  response_code: number | null;
  error: string | null;
  created_at: string;
}

interface IntegrationRow {
  id: string;
  name: string;
  webhook_url: string | null;
  secret: string;
  events: string[];
  status: "active" | "paused";
  created_at: string;
  logs: IntegrationLog[];
}

// Shared "connect your own CRM" panel, mounted into the broker,
// salesperson, and developer portals (mirrors SecurityPanel.tsx's own
// "one shared component, several thin wrapper pages" shape). Needs no
// owner-scoping prop -- /api/integrations resolves the owner from the
// caller's own session server-side, the same way SecurityPanel resolves
// auth.uid() itself, so a client-passed owner id is never trusted.
export function IntegrationsPanel({ integrations }: { integrations: IntegrationRow[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [events, setEvents] = useState<string[]>(["lead.created", "client.created"]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [revealedId, setRevealedId] = useState<string | null>(null);

  function toggleEvent(value: string) {
    setEvents((prev) => (prev.includes(value) ? prev.filter((e) => e !== value) : [...prev, value]));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || events.length === 0) return;
    setSaving(true);
    setError("");

    const res = await fetch("/api/integrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), webhookUrl: webhookUrl.trim(), events }),
    });
    const body = await res.json();

    if (!res.ok) {
      setError(body.error ?? "Failed to create integration.");
      setSaving(false);
      return;
    }

    setName("");
    setWebhookUrl("");
    setEvents(["lead.created", "client.created"]);
    setSaving(false);
    setOpen(false);
    setRevealedId(body.integration.id);
    router.refresh();
  }

  async function handleToggleStatus(row: IntegrationRow) {
    const supabase = createClient();
    await supabase
      .from("crm_integrations")
      .update({ status: row.status === "active" ? "paused" : "active" })
      .eq("id", row.id);
    router.refresh();
  }

  async function handleDelete(row: IntegrationRow) {
    if (!window.confirm(`Delete the integration "${row.name}"? This cannot be undone.`)) return;
    const supabase = createClient();
    await supabase.from("crm_integrations").delete().eq("id", row.id);
    router.refresh();
  }

  function feedUrl(secret: string) {
    return typeof window !== "undefined" ? `${window.location.origin}/api/integrations/feed/${secret}` : `/api/integrations/feed/${secret}`;
  }

  return (
    <div className="space-y-4 rounded-xl border border-navy-700 bg-navy-850 p-5">
      <div>
        <h2 className="text-sm font-semibold text-ink-100">Connect Your CRM</h2>
        <p className="mt-1 text-xs text-ink-500">
          Point your own CRM (or a Zapier/Make/n8n workflow) at a webhook URL and it&apos;ll receive a signed POST every
          time you get a new lead or client here. Every integration also gets a JSON feed URL your CRM can poll on its
          own schedule instead, using the same secret.
        </p>
      </div>

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400"
        >
          <Plus className="h-4 w-4" /> New Integration
        </button>
      ) : (
        <form onSubmit={handleCreate} className="grid grid-cols-1 gap-3 rounded-lg border border-navy-700 bg-navy-900 p-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-ink-400">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My HubSpot Zap"
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-ink-400">Webhook URL (optional — leave blank to use the pull feed only)</label>
            <input
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://…"
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-ink-400">Events</label>
            <div className="flex flex-wrap gap-3">
              {EVENT_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 text-xs text-ink-300">
                  <input
                    type="checkbox"
                    checked={events.includes(opt.value)}
                    onChange={() => toggleEvent(opt.value)}
                    className="h-3.5 w-3.5 rounded border-navy-600 bg-navy-800"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {error && <p className="text-xs font-medium text-rose-400 sm:col-span-2">{error}</p>}

          <div className="flex gap-2 sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
            >
              {saving ? "Creating…" : "Create"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-navy-600 px-4 py-2 text-sm font-medium text-ink-300 hover:text-ink-100"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {integrations.length === 0 ? (
        <p className="text-sm text-ink-500">No integrations connected yet.</p>
      ) : (
        <div className="space-y-3">
          {integrations.map((row) => {
            const revealed = revealedId === row.id;
            return (
              <div key={row.id} className="rounded-lg border border-navy-700 bg-navy-900 p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-ink-100">{row.name}</span>
                    <Badge tone={row.status === "active" ? "green" : "neutral"}>{row.status}</Badge>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => handleToggleStatus(row)} className="text-xs font-medium text-gold-400 hover:text-gold-300">
                      {row.status === "active" ? "Pause" : "Resume"}
                    </button>
                    <button onClick={() => handleDelete(row)} className="text-ink-400 hover:text-rose-400">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {row.events.map((ev) => (
                    <Badge key={ev} tone="blue">
                      {ev}
                    </Badge>
                  ))}
                </div>

                {row.webhook_url && <p className="mt-2 truncate text-xs text-ink-500">Webhook: {row.webhook_url}</p>}

                <div className="mt-2 flex items-center gap-2 text-xs text-ink-500">
                  <span>Secret: {revealed ? row.secret : "•".repeat(16)}</span>
                  <button onClick={() => setRevealedId(revealed ? null : row.id)} className="text-ink-400 hover:text-ink-200">
                    {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => navigator.clipboard?.writeText(feedUrl(row.secret))}
                    className="flex items-center gap-1 text-ink-400 hover:text-ink-200"
                    title="Copy JSON feed URL"
                  >
                    <Copy className="h-3.5 w-3.5" /> Copy Feed URL
                  </button>
                </div>

                {row.logs.length > 0 && (
                  <div className="mt-3 space-y-1 border-t border-navy-800 pt-2">
                    {row.logs.map((log) => (
                      <div key={log.id} className="flex items-center justify-between text-xs text-ink-500">
                        <span>
                          {log.event} — <span className={log.status === "success" ? "text-emerald-400" : "text-rose-400"}>{log.status}</span>
                          {log.response_code ? ` (HTTP ${log.response_code})` : ""}
                          {log.error ? ` — ${log.error}` : ""}
                        </span>
                        <span>{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
