import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { GrantSubscriptionForm } from "@/components/admin/GrantSubscriptionForm";
import { RevokeGrantButton } from "@/components/admin/RevokeGrantButton";
import {
  DevelopersSubscriptionTable,
  BrokersSubscriptionTable,
  SalespersonsSubscriptionTable,
  BrokerAgenciesSubscriptionTable,
} from "@/components/admin/SubscriptionsTables";
import {
  getAllBankTransfersAdmin,
  getAllBrokerAgencyPaymentsAdmin,
  getAllBrokeragesAdmin,
  getAllBrokerPaymentsAdmin,
  getAllBrokersAdmin,
  getAllDevelopersAdmin,
  getAllSalespersonsAdmin,
  getAllSubscriptionPlansAdmin,
  getSubscriptionGrantsAdmin,
} from "@/lib/supabase/queries";
import type { SubscriptionGrantRow } from "@/types/database";

export const dynamic = "force-dynamic";

type GrantRow = SubscriptionGrantRow & {
  developers: { name: string } | null;
  brokers: { full_name: string } | null;
  salespersons: { full_name: string } | null;
  brokerages: { name: string } | null;
};

export default async function AdminSubscriptionsPage() {
  const [developers, brokers, salespersons, brokerAgencies, payments, agencyPayments, plans, grants, bankTransfers] = await Promise.all([
    getAllDevelopersAdmin(),
    getAllBrokersAdmin(),
    getAllSalespersonsAdmin(),
    getAllBrokeragesAdmin(),
    getAllBrokerPaymentsAdmin(),
    getAllBrokerAgencyPaymentsAdmin(),
    getAllSubscriptionPlansAdmin(),
    getSubscriptionGrantsAdmin(),
    getAllBankTransfersAdmin(),
  ]);

  const pendingTransfers = bankTransfers.filter((t) => t.status === "verification_pending");
  const pendingDeveloperIds = new Set(pendingTransfers.map((t) => t.developer_id).filter(Boolean));
  const pendingBrokerIds = new Set(pendingTransfers.map((t) => t.broker_id).filter(Boolean));
  const pendingSalespersonIds = new Set(pendingTransfers.map((t) => t.salesperson_id).filter(Boolean));
  const pendingBrokerAgencyIds = new Set(pendingTransfers.map((t) => t.brokerage_id).filter(Boolean));

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Subscriptions</h1>
        <p className="text-sm text-ink-400">
          Manage membership status for developers, brokers, salespersons, and broker agencies. Plan pricing lives
          in Packages & Plans.
        </p>
      </div>

      <GrantSubscriptionForm
        developers={developers.map((d) => ({ id: d.id, label: d.name }))}
        brokers={brokers.map((b) => ({ id: b.id, label: b.full_name }))}
        salespersons={salespersons.map((s) => ({ id: s.id, label: s.full_name }))}
        brokerAgencies={brokerAgencies.map((a) => ({ id: a.id, label: a.name }))}
        plans={plans.filter((p) => p.status === "active").map((p) => ({ key: p.key, name: p.name, plan_type: p.plan_type }))}
      />

      <div>
        <h2 className="mb-3 text-lg font-semibold text-ink-100">Developers</h2>
        <DevelopersSubscriptionTable developers={developers} pendingDeveloperIds={Array.from(pendingDeveloperIds) as string[]} />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-ink-100">Brokers</h2>
        <BrokersSubscriptionTable brokers={brokers} pendingBrokerIds={Array.from(pendingBrokerIds) as string[]} />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-ink-100">Salespersons</h2>
        <SalespersonsSubscriptionTable salespersons={salespersons} pendingSalespersonIds={Array.from(pendingSalespersonIds) as string[]} />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-ink-100">Broker Agencies</h2>
        <BrokerAgenciesSubscriptionTable brokerAgencies={brokerAgencies} pendingBrokerAgencyIds={Array.from(pendingBrokerAgencyIds) as string[]} />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-ink-100">Free Grant History</h2>
        <DataTable<GrantRow>
          columns={[
            {
              header: "Account",
              render: (g) => (
                <div>
                  <p className="font-medium text-ink-100">
                    {g.developers?.name ?? g.brokers?.full_name ?? g.salespersons?.full_name ?? g.brokerages?.name ?? "—"}
                  </p>
                  <p className="text-xs text-ink-500 capitalize">{g.account_type}</p>
                </div>
              ),
            },
            { header: "Plan", render: (g) => <span className="text-ink-200">{g.plan_key}</span> },
            { header: "Reason", render: (g) => <span className="text-xs text-ink-400">{g.reason ?? "—"}</span> },
            { header: "Start", render: (g) => new Date(g.start_date).toLocaleDateString() },
            { header: "Expiry", render: (g) => (g.expiry_date ? new Date(g.expiry_date).toLocaleDateString() : "—") },
            {
              header: "Status",
              render: (g) =>
                g.revoked_at ? (
                  <Badge tone="red">Revoked {new Date(g.revoked_at).toLocaleDateString()}</Badge>
                ) : (
                  <Badge tone="green">Active</Badge>
                ),
            },
            { header: "", render: (g) => (!g.revoked_at ? <RevokeGrantButton grantId={g.id} /> : null) },
          ]}
          rows={grants as GrantRow[]}
        />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-ink-100">Broker Payments</h2>
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

      <div>
        <h2 className="mb-3 text-lg font-semibold text-ink-100">Broker Agency Payments</h2>
        <DataTable
          columns={[
            { header: "Agency", render: (p) => p.brokerages?.name ?? "—" },
            { header: "Amount", render: (p) => `${p.currency.toUpperCase()} ${Number(p.amount).toLocaleString()}` },
            { header: "Status", render: (p) => <Badge tone={p.status === "paid" ? "green" : "red"}>{p.status}</Badge> },
            { header: "Date", render: (p) => new Date(p.created_at).toLocaleDateString() },
          ]}
          rows={agencyPayments}
        />
      </div>
    </div>
  );
}
