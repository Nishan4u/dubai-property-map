"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Gift } from "lucide-react";

type AccountType = "developer" | "broker" | "salesperson" | "broker_agency";

interface AccountOption {
  id: string;
  label: string;
}

interface PlanOption {
  key: string;
  name: string;
  plan_type: AccountType;
}

export function GrantSubscriptionForm({
  developers,
  brokers,
  salespersons,
  brokerAgencies,
  plans,
}: {
  developers: AccountOption[];
  brokers: AccountOption[];
  salespersons: AccountOption[];
  brokerAgencies: AccountOption[];
  plans: PlanOption[];
}) {
  const router = useRouter();
  const [accountType, setAccountType] = useState<AccountType>("developer");
  const [accountId, setAccountId] = useState("");
  const [planKey, setPlanKey] = useState("");
  const [durationDays, setDurationDays] = useState(30);
  const [noExpiry, setNoExpiry] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const accounts =
    accountType === "developer" ? developers
    : accountType === "broker" ? brokers
    : accountType === "salesperson" ? salespersons
    : brokerAgencies;
  const availablePlans = useMemo(() => plans.filter((p) => p.plan_type === accountType), [plans, accountType]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accountId || !planKey) {
      setError("Choose an account and a plan.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/subscriptions/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountType,
          accountId,
          planKey,
          durationDays: noExpiry ? null : durationDays,
          reason,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not grant subscription");
      setSuccess("Free subscription granted.");
      setAccountId("");
      setPlanKey("");
      setReason("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not grant subscription");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-navy-700 bg-navy-850 p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-100">
        <Gift className="h-4 w-4 text-gold-400" /> Grant Free Subscription
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <select
          value={accountType}
          onChange={(e) => {
            setAccountType(e.target.value as AccountType);
            setAccountId("");
            setPlanKey("");
          }}
          className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-sm text-ink-100"
        >
          <option value="developer">Developer</option>
          <option value="broker">Broker</option>
          <option value="salesperson">Salesperson</option>
          <option value="broker_agency">Broker Agency</option>
        </select>
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-sm text-ink-100"
        >
          <option value="">Select account…</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>
        <select
          value={planKey}
          onChange={(e) => setPlanKey(e.target.value)}
          className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-sm text-ink-100"
        >
          <option value="">Select plan…</option>
          {availablePlans.map((p) => (
            <option key={p.key} value={p.key}>
              {p.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={1}
          value={durationDays}
          disabled={noExpiry}
          onChange={(e) => setDurationDays(Number(e.target.value))}
          placeholder="Duration (days)"
          className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-sm text-ink-100 disabled:opacity-40"
        />
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (optional)"
          className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-sm text-ink-100"
        />
      </div>
      <label className="flex items-center gap-1.5 text-xs text-ink-300">
        <input
          type="checkbox"
          checked={noExpiry}
          onChange={(e) => setNoExpiry(e.target.checked)}
          className="accent-gold-500"
        />
        No expiry (permanent, unlimited access — won&apos;t auto-renew reminders or lapse)
      </label>
      {error && <p className="text-xs font-medium text-rose-400">{error}</p>}
      {success && <p className="text-xs font-medium text-emerald-400">{success}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
      >
        {loading ? "Granting…" : "Grant Free Subscription"}
      </button>
    </form>
  );
}
