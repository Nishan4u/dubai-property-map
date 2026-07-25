"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface Plan {
  key: string;
  name: string;
  price_label: string;
  features: string[];
}

export function BrokerSubscriptionClient({
  plans,
  currentPlanKey,
  subscriptionStatus,
  hasStripeCustomer,
}: {
  plans: Plan[];
  currentPlanKey: string | null;
  subscriptionStatus: string;
  hasStripeCustomer: boolean;
}) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubscribe(plan: string) {
    setLoadingPlan(plan);
    setError("");
    try {
      const res = await fetch("/api/broker/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
      setLoadingPlan(null);
    }
  }

  async function handleManageBilling() {
    setPortalLoading(true);
    setError("");
    try {
      const res = await fetch("/api/broker/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not open billing portal");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setPortalLoading(false);
    }
  }

  const isActive = subscriptionStatus === "active";

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg border border-rose-600/40 bg-rose-500/10 px-4 py-2 text-xs font-medium text-rose-300">
          {error}
        </p>
      )}

      {isActive && (
        <div className="flex max-w-lg items-center justify-between rounded-xl border border-navy-700 bg-navy-850 p-4">
          <div>
            <p className="text-sm font-semibold text-ink-100">Current subscription</p>
            <Badge tone="green">Active</Badge>
          </div>
          <button
            onClick={handleManageBilling}
            disabled={portalLoading || !hasStripeCustomer}
            className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
          >
            {portalLoading ? "Opening…" : "Manage Billing"}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {plans.map((plan) => {
          const isCurrent = plan.key === currentPlanKey && isActive;
          return (
            <div
              key={plan.key}
              className={clsx(
                "rounded-xl border p-5",
                isCurrent ? "border-gold-500 bg-gold-500/5" : "border-navy-700 bg-navy-850"
              )}
            >
              <h3 className="text-sm font-semibold text-ink-100">{plan.name}</h3>
              <p className="mt-1 text-xl font-bold text-ink-100">{plan.price_label}</p>
              <ul className="mt-4 space-y-2 text-xs text-ink-300">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400" /> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe(plan.key)}
                disabled={isCurrent || loadingPlan !== null}
                className={clsx(
                  "mt-5 w-full rounded-lg py-2 text-sm font-semibold",
                  isCurrent
                    ? "bg-navy-700 text-ink-400"
                    : "bg-gold-500 text-navy-950 hover:bg-gold-400 disabled:opacity-60"
                )}
              >
                {isCurrent ? "Current Plan" : loadingPlan === plan.key ? "Redirecting…" : "Subscribe"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
