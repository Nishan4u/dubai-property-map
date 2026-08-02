"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { logAudit } from "@/lib/auditLog";

interface SettingsRow {
  program_enabled: boolean;
  broker_code_prefix: string;
  salesperson_code_prefix: string;
  code_expiry_days: number | null;
  allow_reward_on_resubscription: boolean;
  discount_enabled: boolean;
  discount_percent: number;
  discount_first_subscription_only: boolean;
  cashback_enabled: boolean;
  cashback_amount_aed: number;
  cashback_min_subscription_amount_aed: number | null;
  wallet_new_purchase_enabled: boolean;
}

export function AdminReferralProgramSettings({ initial }: { initial: SettingsRow }) {
  const [settings, setSettings] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function update<K extends keyof SettingsRow>(key: K, value: SettingsRow[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("broker_referral_settings")
      .update({ ...settings, updated_at: new Date().toISOString() })
      .eq("id", true);
    await logAudit("broker_referral_settings.updated", "broker_referral_settings", null, { ...settings } as Record<string, unknown>);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-navy-700 bg-navy-850 p-4">
        <label className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-ink-200">Referral Program</p>
            <p className="mt-0.5 text-xs text-ink-500">
              Master switch — off means codes still generate but neither discounts nor cashback apply.
            </p>
          </div>
          <button
            onClick={() => update("program_enabled", !settings.program_enabled)}
            role="switch"
            aria-checked={settings.program_enabled}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
              settings.program_enabled ? "bg-emerald-500" : "bg-rose-500"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                settings.program_enabled ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </label>
      </div>

      <div className="rounded-xl border border-navy-700 bg-navy-850 p-4">
        <p className="mb-3 text-sm font-semibold text-ink-200">Referral Code</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Broker Code Prefix</label>
            <input
              value={settings.broker_code_prefix}
              onChange={(e) => update("broker_code_prefix", e.target.value.toUpperCase())}
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-1.5 text-sm text-ink-100 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Salesperson Code Prefix</label>
            <input
              value={settings.salesperson_code_prefix}
              onChange={(e) => update("salesperson_code_prefix", e.target.value.toUpperCase())}
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-1.5 text-sm text-ink-100 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Code Expiry (days, blank = never)</label>
            <input
              type="number"
              min={0}
              value={settings.code_expiry_days ?? ""}
              onChange={(e) => update("code_expiry_days", e.target.value === "" ? null : Number(e.target.value))}
              placeholder="Never expires"
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-1.5 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
            />
          </div>
        </div>
        <label className="mt-3 flex items-center gap-1.5 text-xs text-ink-300">
          <input
            type="checkbox"
            checked={settings.allow_reward_on_resubscription}
            onChange={(e) => update("allow_reward_on_resubscription", e.target.checked)}
            className="accent-gold-500"
          />
          Allow a fresh reward if a referred account cancels and later resubscribes (off = one-time reward, ever)
        </label>
      </div>

      <div className="rounded-xl border border-navy-700 bg-navy-850 p-4">
        <label className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-ink-200">
          <input
            type="checkbox"
            checked={settings.discount_enabled}
            onChange={(e) => update("discount_enabled", e.target.checked)}
            className="accent-emerald-500"
          />
          Referral Discount (for the new subscriber)
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Discount Percentage</label>
            <input
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={settings.discount_percent}
              onChange={(e) => update("discount_percent", Number(e.target.value))}
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-1.5 text-sm text-ink-100 focus:outline-none"
            />
          </div>
          <div className="flex items-end pb-1.5">
            <label className="flex items-center gap-1.5 text-xs text-ink-300">
              <input
                type="checkbox"
                checked={settings.discount_first_subscription_only}
                onChange={(e) => update("discount_first_subscription_only", e.target.checked)}
                className="accent-emerald-500"
              />
              Apply only to first subscription
            </label>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-navy-700 bg-navy-850 p-4">
        <label className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-ink-200">
          <input
            type="checkbox"
            checked={settings.cashback_enabled}
            onChange={(e) => update("cashback_enabled", e.target.checked)}
            className="accent-emerald-500"
          />
          Cashback Reward (for the referrer)
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Cashback Amount (AED)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={settings.cashback_amount_aed}
              onChange={(e) => update("cashback_amount_aed", Number(e.target.value))}
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-1.5 text-sm text-ink-100 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Minimum Subscription Amount (blank = none)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={settings.cashback_min_subscription_amount_aed ?? ""}
              onChange={(e) =>
                update("cashback_min_subscription_amount_aed", e.target.value === "" ? null : Number(e.target.value))
              }
              placeholder="No minimum"
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-1.5 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-navy-700 bg-navy-850 p-4">
        <label className="flex items-center gap-1.5 text-sm font-semibold text-ink-200">
          <input
            type="checkbox"
            checked={settings.wallet_new_purchase_enabled}
            onChange={(e) => update("wallet_new_purchase_enabled", e.target.checked)}
            className="accent-emerald-500"
          />
          Allow wallet balance to be used for new subscription purchases
        </label>
        <p className="mt-1 text-xs text-ink-500">
          Renewals can always be paid from wallet balance. This only controls whether it can also cover a brand-new
          (non-renewal) purchase.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save Settings"}
        </button>
        {saved && <span className="text-xs font-medium text-emerald-400">Saved</span>}
      </div>
    </div>
  );
}
