"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logAudit } from "@/lib/auditLog";
import { Badge } from "@/components/ui/Badge";
import { CompactSelect } from "@/components/public/CompactSelect";
import { isPromoLive } from "@/lib/subscriptionStatus";
import type { SubscriptionPlanFeatureLimits } from "@/types/database";

const PLAN_TYPE_OPTIONS = [
  { label: "Developer", value: "developer" },
  { label: "Broker", value: "broker" },
  { label: "Broker Agency", value: "broker_agency" },
  { label: "Salesperson", value: "salesperson" },
];

interface PlanRow {
  id: string;
  key: string;
  name: string;
  price_label: string;
  price_aed: number | null;
  vat_percent: number | null;
  features: string[];
  stripe_price_id: string | null;
  sort_order: number;
  plan_type: "developer" | "broker" | "broker_agency" | "salesperson";
  description: string | null;
  duration_days: number | null;
  status: "active" | "inactive";
  is_popular: boolean;
  is_recommended: boolean;
  online_payment_enabled: boolean;
  bank_transfer_enabled: boolean;
  renewal_allowed_when_inactive: boolean;
  feature_limits: SubscriptionPlanFeatureLimits;
  promo_price_label: string | null;
  promo_stripe_price_id: string | null;
  promo_active: boolean;
  promo_ends_at: string | null;
}

const planTypeTone = { developer: "gold", broker: "purple", broker_agency: "red", salesperson: "blue" } as const;

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
  const [newPlanType, setNewPlanType] = useState<"developer" | "broker" | "broker_agency" | "salesperson">(
    "developer"
  );
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  function updateField<K extends keyof PlanRow>(id: string, key: K, value: PlanRow[K]) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  }

  function updateLimit<K extends keyof SubscriptionPlanFeatureLimits>(
    id: string,
    key: K,
    value: SubscriptionPlanFeatureLimits[K]
  ) {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, feature_limits: { ...r.feature_limits, [key]: value } } : r
      )
    );
  }

  async function handleSave(row: PlanRow) {
    setSavingId(row.id);
    const supabase = createClient();
    await supabase
      .from("subscription_plans")
      .update({
        name: row.name,
        price_label: row.price_label,
        price_aed: row.price_aed,
        vat_percent: row.vat_percent,
        features: row.features,
        stripe_price_id: row.stripe_price_id || null,
        sort_order: row.sort_order,
        description: row.description || null,
        duration_days: row.duration_days,
        status: row.status,
        is_popular: row.is_popular,
        is_recommended: row.is_recommended,
        online_payment_enabled: row.online_payment_enabled,
        bank_transfer_enabled: row.bank_transfer_enabled,
        renewal_allowed_when_inactive: row.renewal_allowed_when_inactive,
        feature_limits: row.feature_limits,
        promo_price_label: row.promo_price_label || null,
        promo_stripe_price_id: row.promo_stripe_price_id || null,
        promo_active: row.promo_active,
        promo_ends_at: row.promo_ends_at || null,
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
                <Badge tone={planTypeTone[row.plan_type]}>{row.plan_type}</Badge>
                <Badge tone={row.status === "active" ? "green" : "neutral"}>{row.status}</Badge>
                {row.is_popular && <Badge tone="gold">Popular</Badge>}
                {row.is_recommended && <Badge tone="blue">Recommended</Badge>}
                {isPromoLive(row) && <Badge tone="red">Promo Live</Badge>}
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
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-400">
                  Price (AED)
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={row.price_aed ?? ""}
                  onChange={(e) => updateField(row.id, "price_aed", e.target.value === "" ? null : Number(e.target.value))}
                  placeholder="e.g. 100"
                  className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-1.5 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
                />
                <p className="mt-1 text-xs text-ink-500">
                  A real number for referral discount/wallet math -- the label above is still what
                  subscribers actually see.
                </p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-400">
                  VAT % (blank = not applicable)
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={row.vat_percent ?? ""}
                  onChange={(e) => updateField(row.id, "vat_percent", e.target.value === "" ? null : Number(e.target.value))}
                  placeholder="e.g. 5"
                  className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-1.5 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
                />
                <p className="mt-1 text-xs text-ink-500">
                  VAT is already included in the price above, not charged separately. This just shows the
                  breakdown (e.g. &ldquo;Includes 5% VAT&rdquo;) on the Subscription page and in the
                  payments export for VAT filing -- it doesn&apos;t change what&apos;s actually charged.
                </p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-400">
                  Duration (days, blank = custom/no fixed term)
                </label>
                <input
                  type="number"
                  value={row.duration_days ?? ""}
                  onChange={(e) =>
                    updateField(
                      row.id,
                      "duration_days",
                      e.target.value === "" ? null : Number(e.target.value)
                    )
                  }
                  placeholder="e.g. 30"
                  className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-1.5 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-400">
                  Display Order
                </label>
                <input
                  type="number"
                  value={row.sort_order}
                  onChange={(e) => updateField(row.id, "sort_order", Number(e.target.value))}
                  className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-1.5 text-sm text-ink-100 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-ink-400">
                  Description
                </label>
                <input
                  value={row.description ?? ""}
                  onChange={(e) => updateField(row.id, "description", e.target.value)}
                  placeholder="Shown under the plan name where applicable"
                  className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-1.5 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
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

              {row.plan_type === "developer" && (
                <div className="sm:col-span-2 rounded-lg border border-navy-700 bg-navy-900 p-3">
                  <p className="mb-2 text-xs font-semibold text-ink-300">
                    Feature Limits — actually enforced, not just card text
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-ink-400">
                        Max Active Listings (blank = unlimited)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={row.feature_limits.max_active_listings ?? ""}
                        onChange={(e) =>
                          updateLimit(
                            row.id,
                            "max_active_listings",
                            e.target.value === "" ? null : Number(e.target.value)
                          )
                        }
                        className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-1.5 text-sm text-ink-100 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-ink-400">
                        Max Featured Pins (blank = unlimited)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={row.feature_limits.max_featured_pins ?? ""}
                        onChange={(e) =>
                          updateLimit(
                            row.id,
                            "max_featured_pins",
                            e.target.value === "" ? null : Number(e.target.value)
                          )
                        }
                        className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-1.5 text-sm text-ink-100 focus:outline-none"
                      />
                    </div>
                    <div className="flex items-end pb-1.5">
                      <label className="flex items-center gap-1.5 text-xs text-ink-300">
                        <input
                          type="checkbox"
                          checked={!!row.feature_limits.homepage_banner_allowed}
                          onChange={(e) =>
                            updateLimit(row.id, "homepage_banner_allowed", e.target.checked)
                          }
                          className="accent-gold-500"
                        />
                        Homepage Banner Allowed
                      </label>
                    </div>
                  </div>
                </div>
              )}

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
                      ? "Subscribers can upgrade to this plan via Stripe."
                      : "Empty — the Upgrade button will show a clear error until you paste a real Stripe Price ID here."}
                </p>
              </div>

              <div className="sm:col-span-2 rounded-lg border border-navy-700 bg-navy-900 p-3">
                <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-ink-300">
                  <input
                    type="checkbox"
                    checked={row.promo_active}
                    onChange={(e) => updateField(row.id, "promo_active", e.target.checked)}
                    className="accent-rose-500"
                  />
                  Promotional Pricing Active
                </label>
                <p className="mb-2 text-xs text-ink-500">
                  The normal price and Stripe Price ID above stay untouched — this is a separate,
                  temporary override shown instead of them while active.
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-ink-400">Promo Price Label</label>
                    <input
                      value={row.promo_price_label ?? ""}
                      onChange={(e) => updateField(row.id, "promo_price_label", e.target.value)}
                      placeholder="e.g. AED 50/year"
                      className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-1.5 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-ink-400">Promo Stripe Price ID</label>
                    <input
                      value={row.promo_stripe_price_id ?? ""}
                      onChange={(e) => updateField(row.id, "promo_stripe_price_id", e.target.value)}
                      placeholder="price_... (a separate Stripe price)"
                      className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-1.5 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-ink-400">Promo Ends (blank = no end date)</label>
                    <input
                      type="date"
                      value={row.promo_ends_at ?? ""}
                      onChange={(e) => updateField(row.id, "promo_ends_at", e.target.value || null)}
                      className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-1.5 text-sm text-ink-100 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2 flex flex-wrap items-center gap-4 border-t border-navy-800 pt-3">
                <label className="flex items-center gap-1.5 text-xs text-ink-300">
                  <input
                    type="checkbox"
                    checked={row.status === "active"}
                    onChange={(e) =>
                      updateField(row.id, "status", e.target.checked ? "active" : "inactive")
                    }
                    className="accent-emerald-500"
                  />
                  Active (visible for new subscriptions)
                </label>
                {row.status === "inactive" && (
                  <label className="flex items-center gap-1.5 text-xs text-ink-300">
                    <input
                      type="checkbox"
                      checked={row.renewal_allowed_when_inactive}
                      onChange={(e) =>
                        updateField(row.id, "renewal_allowed_when_inactive", e.target.checked)
                      }
                      className="accent-emerald-500"
                    />
                    Existing subscribers can still renew
                  </label>
                )}
                <label className="flex items-center gap-1.5 text-xs text-ink-300">
                  <input
                    type="checkbox"
                    checked={row.is_popular}
                    onChange={(e) => updateField(row.id, "is_popular", e.target.checked)}
                    className="accent-gold-500"
                  />
                  Popular
                </label>
                <label className="flex items-center gap-1.5 text-xs text-ink-300">
                  <input
                    type="checkbox"
                    checked={row.is_recommended}
                    onChange={(e) => updateField(row.id, "is_recommended", e.target.checked)}
                    className="accent-sky-500"
                  />
                  Recommended
                </label>
                <label className="flex items-center gap-1.5 text-xs text-ink-300">
                  <input
                    type="checkbox"
                    checked={row.online_payment_enabled}
                    onChange={(e) =>
                      updateField(row.id, "online_payment_enabled", e.target.checked)
                    }
                    className="accent-emerald-500"
                  />
                  Online Payment
                </label>
                <label className="flex items-center gap-1.5 text-xs text-ink-300">
                  <input
                    type="checkbox"
                    checked={row.bank_transfer_enabled}
                    onChange={(e) =>
                      updateField(row.id, "bank_transfer_enabled", e.target.checked)
                    }
                    className="accent-emerald-500"
                  />
                  Bank Transfer
                </label>
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
            <CompactSelect
              label="Account Type"
              allowClear={false}
              searchable={false}
              placeholder="Account Type"
              value={newPlanType}
              onChange={(v) =>
                setNewPlanType(v as "developer" | "broker" | "broker_agency" | "salesperson")
              }
              options={PLAN_TYPE_OPTIONS}
            />
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
