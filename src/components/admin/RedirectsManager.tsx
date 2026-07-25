"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logAudit } from "@/lib/auditLog";
import type { RedirectRow } from "@/types/database";

export function RedirectsManager({ redirects: initial }: { redirects: RedirectRow[] }) {
  const [redirects, setRedirects] = useState(initial);
  const [fromPath, setFromPath] = useState("");
  const [toPath, setToPath] = useState("");
  const [permanent, setPermanent] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleAdd() {
    if (!fromPath.trim() || !toPath.trim()) return;
    setSaving(true);
    setError("");
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("redirects")
      .insert({
        from_path: fromPath.trim().startsWith("/") ? fromPath.trim() : `/${fromPath.trim()}`,
        to_path: toPath.trim(),
        permanent,
      })
      .select()
      .single();

    if (err) {
      setError(err.message);
    } else if (data) {
      setRedirects((prev) => [data, ...prev]);
      await logAudit("redirect.created", "redirect", data.id, {
        from: data.from_path,
        to: data.to_path,
      });
      setFromPath("");
      setToPath("");
    }
    setSaving(false);
  }

  async function handleDelete(r: RedirectRow) {
    setRedirects((prev) => prev.filter((x) => x.id !== r.id));
    const supabase = createClient();
    await supabase.from("redirects").delete().eq("id", r.id);
    await logAudit("redirect.deleted", "redirect", r.id, { from: r.from_path });
  }

  return (
    <div className="rounded-xl border border-navy-700 bg-navy-850 p-4">
      <p className="mb-1 text-sm font-semibold text-ink-100">Redirects</p>
      <p className="mb-3 text-xs text-ink-500">
        Takes effect immediately across the whole site (cached up to 60s).
      </p>
      <ul className="mb-3 space-y-1.5">
        {redirects.map((r) => (
          <li
            key={r.id}
            className="flex items-center justify-between rounded-lg border border-navy-700 bg-navy-900 px-3 py-2 text-sm"
          >
            <span className="text-ink-200">
              {r.from_path} <span className="text-ink-500">→</span> {r.to_path}{" "}
              <span className="text-xs text-ink-500">
                ({r.permanent ? "308 permanent" : "307 temporary"})
              </span>
            </span>
            <button
              onClick={() => handleDelete(r)}
              className="text-ink-500 hover:text-rose-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
        {redirects.length === 0 && (
          <p className="text-xs text-ink-500">No redirects configured.</p>
        )}
      </ul>
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={fromPath}
          onChange={(e) => setFromPath(e.target.value)}
          placeholder="/old-path"
          className="w-40 rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
        />
        <span className="text-ink-500">→</span>
        <input
          value={toPath}
          onChange={(e) => setToPath(e.target.value)}
          placeholder="/new-path"
          className="w-40 rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
        />
        <label className="flex items-center gap-1.5 text-xs text-ink-300">
          <input
            type="checkbox"
            checked={permanent}
            onChange={(e) => setPermanent(e.target.checked)}
            className="accent-gold-500"
          />
          Permanent
        </label>
        <button
          onClick={handleAdd}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-gold-500 px-3 py-2 text-xs font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}
    </div>
  );
}
