"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { Check } from "lucide-react";

interface Plan {
  key: string;
  name: string;
  price_label: string;
  features: string[];
}

export function PlanCards({
  plans,
  currentPlan,
}: {
  plans: Plan[];
  currentPlan: string;
}) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleUpgrade(plan: string) {
    setLoadingPlan(plan);
    setError("");
    try {
      const res = await fetch("/api/stripe/checkout", {
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

  return (
    <div>
      {error && (
        <p className="mb-3 rounded-lg border border-rose-600/40 bg-rose-500/10 px-4 py-2 text-xs font-medium text-rose-300">
          {error}
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => {
          const isCurrent = plan.key === currentPlan;
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
                onClick={() => handleUpgrade(plan.key)}
                disabled={isCurrent || plan.key === "free" || loadingPlan !== null}
                className={clsx(
                  "mt-5 w-full rounded-lg py-2 text-sm font-semibold",
                  isCurrent
                    ? "bg-navy-700 text-ink-400"
                    : "bg-gold-500 text-navy-950 hover:bg-gold-400 disabled:opacity-60"
                )}
              >
                {isCurrent
                  ? "Current Plan"
                  : loadingPlan === plan.key
                    ? "Redirecting…"
                    : plan.key === "free"
                      ? "Downgrade in Billing"
                      : "Upgrade"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
