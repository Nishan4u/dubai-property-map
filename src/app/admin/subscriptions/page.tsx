import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { BrokerSubscriptionActions } from "@/components/admin/BrokerSubscriptionActions";
import { getAllBrokerPaymentsAdmin, getAllBrokersAdmin } from "@/lib/supabase/queries";
import type { DbBrokerSubscriptionStatus } from "@/types/database";

export const dynamic = "force-dynamic";

const subscriptionTone: Record<DbBrokerSubscriptionStatus, "green" | "gold" | "red" | "neutral"> = {
  no_subscription: "neutral",
  payment_pending: "gold",
  active: "green",
  expired: "red",
  cancelled: "neutral",
  payment_failed: "red",
};

export default async function AdminSubscriptionsPage() {
  const [brokers, payments] = await Promise.all([getAllBrokersAdmin(), getAllBrokerPaymentsAdmin()]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Broker Subscriptions</h1>
        <p className="text-sm text-ink-400">Manage broker membership status. Plan pricing lives in Packages & Plans.</p>
      </div>

      <DataTable
        columns={[
          { header: "Broker", render: (b) => <span className="font-medium text-ink-100">{b.full_name}</span> },
          { header: "Plan", render: (b) => b.plan_key ?? "—" },
          {
            header: "Status",
            render: (b) => (
              <div className="flex items-center gap-2">
                <Badge tone={subscriptionTone[b.subscription_status as DbBrokerSubscriptionStatus]}>
                  {b.subscription_status.replace(/_/g, " ")}
                </Badge>
                {b.is_complimentary && <Badge tone="blue">complimentary</Badge>}
              </div>
            ),
          },
          { header: "Expires", render: (b) => (b.subscription_expires_at ? new Date(b.subscription_expires_at).toLocaleDateString() : "—") },
          { header: "", render: (b) => <BrokerSubscriptionActions brokerId={b.id} /> },
        ]}
        rows={brokers}
      />

      <div>
        <h2 className="mb-3 text-lg font-semibold text-ink-100">Payments</h2>
        <DataTable
          columns={[
            { header: "Broker", render: (p) => p.brokers?.full_name ?? "—" },
            { header: "Amount", render: (p) => `${p.currency.toUpperCase()} ${Number(p.amount).toLocaleString()}` },
            { header: "Status", render: (p) => <Badge tone={p.status === "paid" ? "green" : "red"}>{p.status}</Badge> },
            { header: "Date", render: (p) => new Date(p.created_at).toLocaleDateString() },
          ]}
          rows={payments}
        />
      </div>
    </div>
  );
}
