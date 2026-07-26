import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { BrokerSubscriptionActions } from "@/components/admin/BrokerSubscriptionActions";
import { AccountSubscriptionActions } from "@/components/admin/AccountSubscriptionActions";
import { GrantSubscriptionForm } from "@/components/admin/GrantSubscriptionForm";
import { RevokeGrantButton } from "@/components/admin/RevokeGrantButton";
import {
  getAllBankTransfersAdmin,
  getAllBrokerPaymentsAdmin,
  getAllBrokersAdmin,
  getAllDevelopersAdmin,
  getAllSalespersonsAdmin,
  getAllSubscriptionPlansAdmin,
  getSubscriptionGrantsAdmin,
} from "@/lib/supabase/queries";
import { isExpiringSoon } from "@/lib/subscriptionStatus";
import type {
  DbBrokerSubscriptionStatus,
  DbDeveloperSubscriptionStatus,
  DbPaymentType,
  SubscriptionGrantRow,
} from "@/types/database";

export const dynamic = "force-dynamic";

const brokerStatusTone: Record<DbBrokerSubscriptionStatus, "green" | "gold" | "red" | "neutral"> = {
  no_subscription: "neutral",
  payment_pending: "gold",
  active: "green",
  expired: "red",
  cancelled: "neutral",
  payment_failed: "red",
};

const developerStatusTone: Record<DbDeveloperSubscriptionStatus, "green" | "gold" | "red" | "neutral"> = {
  inactive: "neutral",
  active: "green",
  past_due: "red",
  expired: "red",
  cancelled: "neutral",
};

const paymentTypeLabel: Record<DbPaymentType, string> = {
  stripe: "Stripe",
  bank_transfer: "Bank Transfer",
  admin_free: "Admin Granted",
};

type GrantRow = SubscriptionGrantRow & {
  developers: { name: string } | null;
  brokers: { full_name: string } | null;
  salespersons: { full_name: string } | null;
};

export default async function AdminSubscriptionsPage() {
  const [developers, brokers, salespersons, payments, plans, grants, bankTransfers] = await Promise.all([
    getAllDevelopersAdmin(),
    getAllBrokersAdmin(),
    getAllSalespersonsAdmin(),
    getAllBrokerPaymentsAdmin(),
    getAllSubscriptionPlansAdmin(),
    getSubscriptionGrantsAdmin(),
    getAllBankTransfersAdmin(),
  ]);

  const pendingTransfers = bankTransfers.filter((t) => t.status === "verification_pending");
  const pendingDeveloperIds = new Set(pendingTransfers.map((t) => t.developer_id).filter(Boolean));
  const pendingBrokerIds = new Set(pendingTransfers.map((t) => t.broker_id).filter(Boolean));
  const pendingSalespersonIds = new Set(pendingTransfers.map((t) => t.salesperson_id).filter(Boolean));

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Subscriptions</h1>
        <p className="text-sm text-ink-400">
          Manage membership status for developers, brokers, and salespersons. Plan pricing lives in Packages & Plans.
        </p>
      </div>

      <GrantSubscriptionForm
        developers={developers.map((d) => ({ id: d.id, label: d.name }))}
        brokers={brokers.map((b) => ({ id: b.id, label: b.full_name }))}
        salespersons={salespersons.map((s) => ({ id: s.id, label: s.full_name }))}
        plans={plans.filter((p) => p.status === "active").map((p) => ({ key: p.key, name: p.name, plan_type: p.plan_type }))}
      />

      <div>
        <h2 className="mb-3 text-lg font-semibold text-ink-100">Developers</h2>
        <DataTable
          columns={[
            { header: "Developer", render: (d) => <span className="font-medium text-ink-100">{d.name}</span> },
            { header: "Plan", render: (d) => d.plan_tier ?? "—" },
            {
              header: "Status",
              render: (d) => (
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={developerStatusTone[d.subscription_status as DbDeveloperSubscriptionStatus]}>
                    {d.subscription_status.replace(/_/g, " ")}
                  </Badge>
                  {isExpiringSoon(d.subscription_status, d.subscription_expires_at) && (
                    <Badge tone="gold">Expiring Soon</Badge>
                  )}
                  {pendingDeveloperIds.has(d.id) && <Badge tone="gold">Pending Bank Approval</Badge>}
                  {d.is_complimentary && <Badge tone="blue">complimentary</Badge>}
                  {d.payment_type && <Badge tone="purple">{paymentTypeLabel[d.payment_type as DbPaymentType]}</Badge>}
                </div>
              ),
            },
            { header: "Expires", render: (d) => (d.subscription_expires_at ? new Date(d.subscription_expires_at).toLocaleDateString() : "—") },
            { header: "", render: (d) => <AccountSubscriptionActions accountType="developer" accountId={d.id} /> },
          ]}
          rows={developers}
        />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-ink-100">Brokers</h2>
        <DataTable
          columns={[
            { header: "Broker", render: (b) => <span className="font-medium text-ink-100">{b.full_name}</span> },
            { header: "Plan", render: (b) => b.plan_key ?? "—" },
            {
              header: "Status",
              render: (b) => (
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={brokerStatusTone[b.subscription_status as DbBrokerSubscriptionStatus]}>
                    {b.subscription_status.replace(/_/g, " ")}
                  </Badge>
                  {isExpiringSoon(b.subscription_status, b.subscription_expires_at) && (
                    <Badge tone="gold">Expiring Soon</Badge>
                  )}
                  {pendingBrokerIds.has(b.id) && <Badge tone="gold">Pending Bank Approval</Badge>}
                  {b.is_complimentary && <Badge tone="blue">complimentary</Badge>}
                  {b.payment_type && <Badge tone="purple">{paymentTypeLabel[b.payment_type as DbPaymentType]}</Badge>}
                </div>
              ),
            },
            { header: "Expires", render: (b) => (b.subscription_expires_at ? new Date(b.subscription_expires_at).toLocaleDateString() : "—") },
            { header: "", render: (b) => <BrokerSubscriptionActions brokerId={b.id} /> },
          ]}
          rows={brokers}
        />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-ink-100">Salespersons</h2>
        <DataTable
          columns={[
            { header: "Salesperson", render: (s) => <span className="font-medium text-ink-100">{s.full_name}</span> },
            { header: "Plan", render: (s) => s.plan_key ?? "—" },
            {
              header: "Status",
              render: (s) => (
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={brokerStatusTone[s.subscription_status as DbBrokerSubscriptionStatus]}>
                    {s.subscription_status.replace(/_/g, " ")}
                  </Badge>
                  {isExpiringSoon(s.subscription_status, s.subscription_expires_at) && (
                    <Badge tone="gold">Expiring Soon</Badge>
                  )}
                  {pendingSalespersonIds.has(s.id) && <Badge tone="gold">Pending Bank Approval</Badge>}
                  {s.is_complimentary && <Badge tone="blue">complimentary</Badge>}
                  {s.payment_type && <Badge tone="purple">{paymentTypeLabel[s.payment_type as DbPaymentType]}</Badge>}
                </div>
              ),
            },
            { header: "Expires", render: (s) => (s.subscription_expires_at ? new Date(s.subscription_expires_at).toLocaleDateString() : "—") },
            { header: "", render: (s) => <AccountSubscriptionActions accountType="salesperson" accountId={s.id} /> },
          ]}
          rows={salespersons}
        />
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
                    {g.developers?.name ?? g.brokers?.full_name ?? g.salespersons?.full_name ?? "—"}
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
    </div>
  );
}
