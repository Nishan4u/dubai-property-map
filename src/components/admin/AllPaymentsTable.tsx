"use client";

import { Badge } from "@/components/ui/Badge";
import { SearchableDataTable } from "@/components/admin/SearchableDataTable";
import type { PaymentFeedRow } from "@/lib/supabase/queries";

const accountTypeLabel: Record<PaymentFeedRow["accountType"], string> = {
  developer: "Developer",
  broker: "Broker",
  salesperson: "Salesperson",
  broker_agency: "Broker Agency",
};

const accountTypeTone: Record<PaymentFeedRow["accountType"], "blue" | "gold" | "green" | "neutral"> = {
  developer: "blue",
  broker: "gold",
  salesperson: "green",
  broker_agency: "neutral",
};

const paymentMethodLabel: Record<PaymentFeedRow["paymentMethod"], string> = {
  stripe: "Stripe",
  bank_transfer: "Bank Transfer",
  wallet: "Referral Wallet",
  network_international: "Network International",
};

export function AllPaymentsTable({ rows }: { rows: PaymentFeedRow[] }) {
  return (
    <SearchableDataTable
      searchPlaceholder="Search by account name or plan..."
      searchFields={(r) => [r.accountName, r.plan]}
      columns={[
        { header: "Date", render: (r) => new Date(r.date).toLocaleDateString() },
        {
          header: "Account",
          render: (r) => <span className="font-medium text-ink-100">{r.accountName}</span>,
        },
        {
          header: "Type",
          render: (r) => <Badge tone={accountTypeTone[r.accountType]}>{accountTypeLabel[r.accountType]}</Badge>,
        },
        { header: "Plan", render: (r) => <span className="text-ink-300">{r.plan || "—"}</span> },
        { header: "Method", render: (r) => <span className="text-ink-400">{paymentMethodLabel[r.paymentMethod]}</span> },
        {
          header: "Amount",
          render: (r) => <span className="font-medium text-ink-100">AED {r.amountAed.toLocaleString()}</span>,
        },
      ]}
      rows={rows}
    />
  );
}
