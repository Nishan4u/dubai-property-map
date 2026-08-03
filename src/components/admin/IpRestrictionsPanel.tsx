"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logAudit } from "@/lib/auditLog";

interface AllowlistEntry {
  id: string;
  ip_address: string;
  label: string | null;
}

export function IpRestrictionsPanel({
  initialEnabled,
  initialEntries,
  currentIp,
  canManage,
}: {
  initialEnabled: boolean;
  initialEntries: AllowlistEntry[];
  /** The viewing admin's own current IP, shown so they know what to add
   * before turning this on -- exact-match only, no CIDR ranges. */
  currentIp: string | null;
  /** Only a super admin may change this -- enforced at the RLS level too,
   * this just controls whether the controls are interactive. */
  canManage: boolean;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [entries, setEntries] = useState(initialEntries);
  const [ip, setIp] = useState("");
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleToggle() {
    if (!canManage) return;
    const next = !enabled;
    setEnabled(next);
    setSaving(true);
    const supabase = createClient();
    await supabase.from("admin_ip_restrictions_settings").update({ enabled: next }).eq("id", true);
    await logAudit(next ? "admin_ip_restrictions.enabled" : "admin_ip_restrictions.disabled", "admin_ip_restrictions_settings", "true");
    setSaving(false);
  }

  async function handleAdd() {
    if (!canManage || !ip.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("admin_ip_allowlist")
      .insert({ ip_address: ip.trim(), label: label.trim() || null })
      .select()
      .single();

    if (!error && data) {
      setEntries((prev) => [...prev, data]);
      await logAudit("admin_ip_allowlist.added", "admin_ip_allowlist", data.id, { ip_address: ip.trim() });
      setIp("");
      setLabel("");
    }
    setSaving(false);
  }

  async function handleDelete(entry: AllowlistEntry) {
    if (!canManage) return;
    setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    const supabase = createClient();
    await supabase.from("admin_ip_allowlist").delete().eq("id", entry.id);
    await logAudit("admin_ip_allowlist.removed", "admin_ip_allowlist", entry.id, { ip_address: entry.ip_address });
  }

  const currentIpAllowed = currentIp ? entries.some((e) => e.ip_address === currentIp) : false;

  return (
    <div>
      <h2 className="text-sm font-semibold text-ink-200">IP Restrictions</h2>
      <p className="mt-1 text-xs text-ink-500">
        Restrict the admin panel to a specific list of IP addresses (exact match only, no ranges).
        Admin Settings itself always stays reachable regardless of this list, so you can never lock
        yourself out completely.
        {!canManage && " Only a super admin can change this."}
      </p>

      <div className="mt-3 flex items-center justify-between rounded-xl border border-navy-700 bg-navy-850 px-4 py-3">
        <span className="text-sm text-ink-200">
          {enabled ? "Restrictions active" : "Restrictions disabled — admin panel reachable from anywhere"}
        </span>
        <button
          onClick={handleToggle}
          disabled={saving || !canManage}
          title={canManage ? undefined : "Only a super admin can change this"}
          role="switch"
          aria-checked={enabled}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
            enabled ? "bg-emerald-500" : "bg-rose-500"
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
              enabled ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      <div className="mt-3 rounded-lg border border-navy-700 bg-navy-900 px-3 py-2 text-xs text-ink-400">
        Your current IP is <span className="font-mono text-ink-200">{currentIp ?? "unknown"}</span>
        {currentIp && !currentIpAllowed && (
          <span className="ml-1 text-rose-400">— not on the allowlist yet.</span>
        )}
      </div>

      {enabled && currentIp && !currentIpAllowed && (
        <p className="mt-2 text-xs font-medium text-rose-400">
          Warning: your own IP isn&apos;t on the list. You&apos;ll be blocked from every admin page
          except this Settings page until it&apos;s added.
        </p>
      )}

      <div className="mt-3 rounded-xl border border-navy-700 bg-navy-850 p-4">
        <ul className="mb-3 space-y-1.5">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center justify-between rounded-lg border border-navy-700 bg-navy-900 px-3 py-2 text-sm"
            >
              <span className="font-mono text-ink-200">
                {entry.ip_address}{" "}
                {entry.label && <span className="font-sans text-xs text-ink-500">({entry.label})</span>}
              </span>
              {canManage && (
                <button onClick={() => handleDelete(entry)} className="text-ink-500 hover:text-rose-400">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
          {entries.length === 0 && <p className="text-xs text-ink-500">No IPs allowlisted yet.</p>}
        </ul>
        {canManage && (
          <div className="flex gap-2">
            <input
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              placeholder="203.0.113.10"
              className="w-40 rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
            />
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Label (optional)"
              className="flex-1 rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
            />
            <button
              onClick={handleAdd}
              disabled={saving || !ip.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-gold-500 px-3 py-2 text-xs font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
