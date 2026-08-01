"use client";

import { Badge } from "@/components/ui/Badge";
import { SearchableDataTable } from "@/components/admin/SearchableDataTable";

const planTone = {
  free: "neutral",
  starter: "blue",
  professional: "gold",
  enterprise: "green",
} as const;

interface PaymentRow {
  id: string;
  name: string;
  plan_tier: string;
  subscription_status: string;
  stripe_customer_id: string | null;
}

const planPrice: Record<string, number> = {
  free: 0,
  starter: 999,
  professional: 2999,
  enterprise: 0,
};

export function PaymentsTable({ rows }: { rows: PaymentRow[] }) {
  return (
    <SearchableDataTable
      searchPlaceholder="Search by developer name or Stripe customer ID..."
      searchFields={(d) => [d.name, d.stripe_customer_id]}
      columns={[
        { header: "Developer", render: (d) => <span className="font-medium text-ink-100">{d.name}</span> },
        {
          header: "Plan",
          render: (d) => <Badge tone={planTone[d.plan_tier as keyof typeof planTone]}>{d.plan_tier}</Badge>,
        },
        {
          header: "Status",
          render: (d) => (
            <Badge tone={d.subscription_status === "active" ? "green" : "neutral"}>
              {d.subscription_status}
            </Badge>
          ),
        },
        {
          header: "Subtotal",
          render: (d) => {
            const price = planPrice[d.plan_tier] ?? 0;
            return price > 0 ? `AED ${price.toLocaleString()}` : "—";
          },
        },
        {
          header: "VAT (5%)",
          render: (d) => {
            const price = planPrice[d.plan_tier] ?? 0;
            return price > 0 ? `AED ${(price * 0.05).toLocaleString()}` : "—";
          },
        },
        {
          header: "Total (incl. VAT)",
          render: (d) => {
            const price = planPrice[d.plan_tier] ?? 0;
            return price > 0 ? (
              <span className="font-medium text-ink-100">
                AED {(price * 1.05).toLocaleString()}
              </span>
            ) : (
              "—"
            );
          },
        },
        {
          header: "Stripe Customer",
          render: (d) => d.stripe_customer_id ?? "—",
        },
      ]}
      rows={rows}
    />
  );
}
