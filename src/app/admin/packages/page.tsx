"use client";

import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";

const plans = [
  { id: "pl1", name: "Free", price: "AED 0/mo", subscribers: 62, tone: "neutral" as const },
  { id: "pl2", name: "Starter", price: "AED 999/mo", subscribers: 48, tone: "blue" as const },
  { id: "pl3", name: "Professional", price: "AED 2,999/mo", subscribers: 34, tone: "gold" as const },
  { id: "pl4", name: "Enterprise", price: "Custom", subscribers: 12, tone: "green" as const },
];

export default function AdminPackagesPage() {
  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink-100">Packages & Plans</h1>
          <p className="text-sm text-ink-400">
            Manage subscription tiers and featured listing add-ons.
          </p>
        </div>
        <button className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400">
          + New Plan
        </button>
      </div>

      <DataTable
        columns={[
          { header: "Plan", render: (p) => <span className="font-medium text-ink-100">{p.name}</span> },
          { header: "Price", render: (p) => p.price },
          { header: "Subscribers", render: (p) => p.subscribers },
          { header: "Status", render: (p) => <Badge tone={p.tone}>Active</Badge> },
          {
            header: "",
            render: () => (
              <button className="text-xs font-medium text-gold-400 hover:text-gold-300">
                Edit
              </button>
            ),
          },
        ]}
        rows={plans}
      />

      <div className="rounded-xl border border-navy-700 bg-navy-850 p-4 text-sm text-ink-400">
        Add-ons: Featured Project ($), Premium Pin ($), Homepage Banner ($) — managed per developer under Ads.
      </div>
    </div>
  );
}
