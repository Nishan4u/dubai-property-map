"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { BankTransferHistory } from "@/components/dashboard/BankTransferHistory";
import { isExpiringSoon } from "@/lib/subscriptionStatus";
import type { SubscriptionBankTransferRow } from "@/types/database";

export function BillingClient({
  planTier,
  subscriptionStatus,
  subscriptionExpiresAt,
  hasStripeCustomer,
  bankTransfers,
}: {
  planTier: string;
  subscriptionStatus: string;
  subscriptionExpiresAt?: string | null;
  hasStripeCustomer: boolean;
  bankTransfers: SubscriptionBankTransferRow[];
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleManageBilling() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not open billing portal");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg space-y-4 rounded-xl border border-navy-700 bg-navy-850 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold capitalize text-ink-100">{planTier} Plan</p>
          <p className="text-xs text-ink-500">Subscription status</p>
        </div>
        <div className="flex items-center gap-2">
          {isExpiringSoon(subscriptionStatus, subscriptionExpiresAt) && (
            <Badge tone="gold">Expiring Soon</Badge>
          )}
          <Badge tone={subscriptionStatus === "active" ? "green" : "neutral"}>
            {subscriptionStatus}
          </Badge>
        </div>
      </div>

      {error && <p className="text-xs font-medium text-rose-400">{error}</p>}

      <button
        onClick={handleManageBilling}
        disabled={loading || !hasStripeCustomer}
        className="w-full rounded-lg bg-gold-500 py-2.5 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
      >
        {loading ? "Opening…" : "Manage Billing & Invoices"}
      </button>
      <BankTransferHistory transfers={bankTransfers} />
    </div>
  );
}
