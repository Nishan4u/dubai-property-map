import { Check } from "lucide-react";
import { clsx } from "clsx";

const plans = [
  { name: "Free", price: "AED 0", features: ["3 active listings", "Basic analytics", "Email support"], current: false },
  { name: "Starter", price: "AED 999/mo", features: ["15 active listings", "Lead management", "Priority support"], current: false },
  { name: "Professional", price: "AED 2,999/mo", features: ["Unlimited listings", "Advanced analytics", "Featured pins (2)", "CRM integration"], current: true },
  { name: "Enterprise", price: "Custom", features: ["Unlimited everything", "Dedicated account manager", "API access", "Homepage banner"], current: false },
];

export default function DeveloperPackagesPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Packages & Subscription</h1>
        <p className="text-sm text-ink-400">
          You&apos;re currently on the <span className="text-gold-400">Professional</span> plan.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={clsx(
              "rounded-xl border p-5",
              plan.current
                ? "border-gold-500 bg-gold-500/5"
                : "border-navy-700 bg-navy-850"
            )}
          >
            <h3 className="text-sm font-semibold text-ink-100">{plan.name}</h3>
            <p className="mt-1 text-xl font-bold text-ink-100">{plan.price}</p>
            <ul className="mt-4 space-y-2 text-xs text-ink-300">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400" /> {f}
                </li>
              ))}
            </ul>
            <button
              className={clsx(
                "mt-5 w-full rounded-lg py-2 text-sm font-semibold",
                plan.current
                  ? "bg-navy-700 text-ink-400"
                  : "bg-gold-500 text-navy-950 hover:bg-gold-400"
              )}
              disabled={plan.current}
            >
              {plan.current ? "Current Plan" : "Upgrade"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
