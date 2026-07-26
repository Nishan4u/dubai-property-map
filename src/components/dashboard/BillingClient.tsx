"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { BankTransferHistory } from "@/components/dashboard/BankTransferHistory";
import type { SubscriptionBankTransferRow } from "@/types/database";

export function BillingClient({
  planTier,
  subscriptionStatus,
  hasStripeCustomer,
  bankTransfers,
}: {
  planTier: string;
  subscriptionStatus: string;
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
        <Badge tone={subscriptionStatus === "active" ? "green" : "neutral"}>
          {subscriptionStatus}
        </Badge>
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

      {!hasStripeCustomer && (
        <p className="text-xs text-ink-500">
          Subscribe to a paid plan on the Packages page first — Stripe creates
          your billing account automatically at checkout.
        </p>
      )}
    </div>
  );
}
