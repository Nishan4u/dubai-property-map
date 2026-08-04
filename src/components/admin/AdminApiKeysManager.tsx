"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Copy, Ban } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/Badge";

const SCOPE_OPTIONS = [
  { value: "projects:read", label: "Projects (read)" },
  { value: "communities:read", label: "Communities (read)" },
  { value: "developers:read", label: "Developers (read)" },
];

interface ApiKeyLog {
  id: string;
  endpoint: string;
  status_code: number;
  created_at: string;
}

interface ApiKeyRow {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  status: "active" | "revoked";
  last_used_at: string | null;
  created_at: string;
  logs: ApiKeyLog[];
}

// Admin-only API key issuance for the read-only Public API (/api/v1/*).
// Mirrors IntegrationsPanel.tsx's "generate server-side, show once,
// list/revoke stay direct client RLS calls" shape -- one real difference:
// only a sha256 hash of the key is ever persisted (see src/lib/apiAuth.ts),
// so unlike a webhook secret, a lost key can never be re-displayed, only
// revoked and replaced with a new one.
export function AdminApiKeysManager({ apiKeys }: { apiKeys: ApiKeyRow[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<string[]>(["projects:read", "communities:read", "developers:read"]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [justCreated, setJustCreated] = useState<{ name: string; rawKey: string } | null>(null);

  function toggleScope(value: string) {
    setScopes((prev) => (prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || scopes.length === 0) return;
    setSaving(true);
    setError("");

    const res = await fetch("/api/admin/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), scopes }),
    });
    const body = await res.json();

    if (!res.ok) {
      setError(body.error ?? "Failed to create API key.");
      setSaving(false);
      return;
    }

    setJustCreated({ name: body.apiKey.name, rawKey: body.apiKey.rawKey });
    setName("");
    setScopes(["projects:read", "communities:read", "developers:read"]);
    setSaving(false);
    setOpen(false);
    router.refresh();
  }

  async function handleRevoke(row: ApiKeyRow) {
    if (!window.confirm(`Revoke the API key "${row.name}"? Any integration using it will stop working immediately.`)) return;
    const supabase = createClient();
    await supabase.from("api_keys").update({ status: "revoked", revoked_at: new Date().toISOString() }).eq("id", row.id);
    router.refresh();
  }

  return (
    <div className="space-y-4 rounded-xl border border-navy-700 bg-navy-850 p-5">
      <div>
        <h2 className="text-sm font-semibold text-ink-100">Public API Keys</h2>
        <p className="mt-1 text-xs text-ink-500">
          Issue bearer keys for external partners/integrators to read published projects, communities, and developers
          via <code className="text-ink-400">GET /api/v1/*</code> with an <code className="text-ink-400">Authorization: Bearer &lt;key&gt;</code>{" "}
          header. Each key is rate-limited to 120 requests / 5 minutes and every request is logged below.
        </p>
      </div>

      {justCreated && (
        <div className="space-y-2 rounded-lg border border-gold-500/50 bg-gold-500/10 p-4">
          <p className="text-xs font-semibold text-gold-300">
            Save this key now — &quot;{justCreated.name}&quot; won&apos;t be shown again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded bg-navy-950 px-3 py-2 text-xs text-ink-100">{justCreated.rawKey}</code>
            <button
              onClick={() => navigator.clipboard?.writeText(justCreated.rawKey)}
              className="flex items-center gap-1 rounded-lg border border-navy-600 px-3 py-2 text-xs font-medium text-ink-300 hover:text-ink-100"
            >
              <Copy className="h-3.5 w-3.5" /> Copy
            </button>
          </div>
          <button onClick={() => setJustCreated(null)} className="text-xs text-ink-500 hover:text-ink-300">
            Dismiss
          </button>
        </div>
      )}

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400"
        >
          <Plus className="h-4 w-4" /> New API Key
        </button>
      ) : (
        <form onSubmit={handleCreate} className="grid grid-cols-1 gap-3 rounded-lg border border-navy-700 bg-navy-900 p-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-ink-400">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Partner Feed"
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-ink-400">Scopes</label>
            <div className="flex flex-wrap gap-3">
              {SCOPE_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 text-xs text-ink-300">
                  <input
                    type="checkbox"
                    checked={scopes.includes(opt.value)}
                    onChange={() => toggleScope(opt.value)}
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

      {apiKeys.length === 0 ? (
        <p className="text-sm text-ink-500">No API keys issued yet.</p>
      ) : (
        <div className="space-y-3">
          {apiKeys.map((row) => (
            <div key={row.id} className="rounded-lg border border-navy-700 bg-navy-900 p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-ink-100">{row.name}</span>
                  <Badge tone={row.status === "active" ? "green" : "neutral"}>{row.status}</Badge>
                </div>
                {row.status === "active" && (
                  <button onClick={() => handleRevoke(row)} className="flex items-center gap-1 text-xs font-medium text-rose-400 hover:text-rose-300">
                    <Ban className="h-3.5 w-3.5" /> Revoke
                  </button>
                )}
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5">
                {row.scopes.map((scope) => (
                  <Badge key={scope} tone="blue">
                    {scope}
                  </Badge>
                ))}
              </div>

              <p className="mt-2 text-xs text-ink-500">
                Key: {row.key_prefix}… · Created {new Date(row.created_at).toLocaleDateString()} · Last used{" "}
                {row.last_used_at ? new Date(row.last_used_at).toLocaleString() : "never"}
              </p>

              {row.logs.length > 0 && (
                <div className="mt-3 space-y-1 border-t border-navy-800 pt-2">
                  {row.logs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between text-xs text-ink-500">
                      <span>
                        {log.endpoint} —{" "}
                        <span className={log.status_code < 400 ? "text-emerald-400" : "text-rose-400"}>HTTP {log.status_code}</span>
                      </span>
                      <span>{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
