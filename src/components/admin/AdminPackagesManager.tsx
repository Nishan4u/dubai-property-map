"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logAudit } from "@/lib/auditLog";
import { Badge } from "@/components/ui/Badge";

interface PlanRow {
  id: string;
  key: string;
  name: string;
  price_label: string;
  features: string[];
  stripe_price_id: string | null;
  sort_order: number;
  plan_type: "developer" | "broker";
}

export function AdminPackagesManager({
  plans,
  subscriberCounts,
}: {
  plans: PlanRow[];
  subscriberCounts: Record<string, number>;
}) {
  const [rows, setRows] = useState(plans);
  const [showNew, setShowNew] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newName, setNewName] = useState("");
  const [newPlanType, setNewPlanType] = useState<"developer" | "broker">("developer");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  function updateField<K extends keyof PlanRow>(id: string, key: K, value: PlanRow[K]) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  }

  async function handleSave(row: PlanRow) {
    setSavingId(row.id);
    const supabase = createClient();
    await supabase
      .from("subscription_plans")
      .update({
        name: row.name,
        price_label: row.price_label,
        features: row.features,
        stripe_price_id: row.stripe_price_id || null,
        sort_order: row.sort_order,
      })
      .eq("id", row.id);
    await logAudit("subscription_plan.updated", "subscription_plan", row.id, { key: row.key });
    setSavingId(null);
    setSavedId(row.id);
    setTimeout(() => setSavedId((id) => (id === row.id ? null : id)), 2000);
  }

  async function handleDelete(row: PlanRow) {
    if (row.key === "free") return;
    if (!confirm(`Delete the "${row.name}" plan?`)) return;
    setRows((prev) => prev.filter((r) => r.id !== row.id));
    const supabase = createClient();
    await supabase.from("subscription_plans").delete().eq("id", row.id);
    await logAudit("subscription_plan.deleted", "subscription_plan", row.id, { key: row.key });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newKey.trim() || !newName.trim()) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("subscription_plans")
      .insert({
        key: newKey.trim().toLowerCase().replace(/\s+/g, "-"),
        name: newName.trim(),
        price_label: "Custom",
        features: [],
        sort_order: rows.length,
        plan_type: newPlanType,
      })
      .select()
      .single();

    if (!error && data) {
      setRows((prev) => [...prev, data]);
      await logAudit("subscription_plan.created", "subscription_plan", data.id, { key: data.key });
      setNewKey("");
      setNewName("");
      setNewPlanType("developer");
      setShowNew(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.id} className="rounded-xl border border-navy-700 bg-navy-850 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-ink-100">{row.name}</h3>
                <Badge tone="neutral">{row.key}</Badge>
                <Badge tone={row.plan_type === "broker" ? "purple" : "gold"}>{row.plan_type}</Badge>
              </div>
              <Badge tone="blue">
                {subscriberCounts[row.key] ?? 0} subscriber
                {(subscriberCounts[row.key] ?? 0) === 1 ? "" : "s"}
              </Badge>
              <div className="ml-auto flex items-center gap-3">
                {savingId === row.id && (
                  <span className="text-xs text-ink-500">Saving…</span>
                )}
                {savedId === row.id && (
                  <span className="text-xs font-medium text-emerald-400">Saved</span>
                )}
                <button
                  onClick={() => handleSave(row)}
                  className="text-xs font-medium text-gold-400 hover:text-gold-300"
                >
                  Save
                </button>
                {row.key !== "free" && (
                  <button
                    onClick={() => handleDelete(row)}
                    className="text-ink-500 hover:text-rose-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-400">
                  Display Name
                </label>
                <input
                  value={row.name}
                  onChange={(e) => updateField(row.id, "name", e.target.value)}
                  className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-1.5 text-sm text-ink-100 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-400">
                  Price Label
                </label>
                <input
                  value={row.price_label}
                  onChange={(e) => updateField(row.id, "price_label", e.target.value)}
                  className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-1.5 text-sm text-ink-100 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-ink-400">
                  Features (one per line)
                </label>
                <textarea
                  rows={3}
                  value={row.features.join("\n")}
                  onChange={(e) =>
                    updateField(
                      row.id,
                      "features",
                      e.target.value.split("\n").map((f) => f.trim()).filter(Boolean)
                    )
                  }
                  className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-1.5 text-sm text-ink-100 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-ink-400">
                  Stripe Price ID
                </label>
                <input
                  value={row.stripe_price_id ?? ""}
                  onChange={(e) => updateField(row.id, "stripe_price_id", e.target.value)}
                  placeholder="price_..."
                  className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-1.5 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
                />
                <p className="mt-1 text-xs text-ink-500">
                  {row.key === "free"
                    ? "Free plan — no Stripe price needed."
                    : row.stripe_price_id
                      ? "Developers can upgrade to this plan via Stripe."
                      : "Empty — the Upgrade button will show a clear error until you paste a real Stripe Price ID here."}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showNew ? (
        <form
          onSubmit={handleCreate}
          className="flex flex-wrap items-end gap-3 rounded-xl border border-navy-700 bg-navy-850 p-4"
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Key</label>
            <input
              required
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="e.g. pro-plus"
              className="rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Name</label>
            <input
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Pro Plus"
              className="rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">For</label>
            <select
              value={newPlanType}
              onChange={(e) => setNewPlanType(e.target.value as "developer" | "broker")}
              className="rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
            >
              <option value="developer">Developer</option>
              <option value="broker">Broker</option>
            </select>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400"
          >
            Create
          </button>
          <button
            type="button"
            onClick={() => setShowNew(false)}
            className="rounded-lg border border-navy-600 px-4 py-2 text-sm font-medium text-ink-300 hover:text-ink-100"
          >
            Cancel
          </button>
        </form>
      ) : (
        <button
          onClick={() => setShowNew(true)}
          className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400"
        >
          + New Plan
        </button>
      )}
    </div>
  );
}
