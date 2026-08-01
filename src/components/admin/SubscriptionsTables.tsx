"use client";

import { Badge } from "@/components/ui/Badge";
import { SearchableDataTable } from "@/components/admin/SearchableDataTable";
import { BrokerSubscriptionActions } from "@/components/admin/BrokerSubscriptionActions";
import { AccountSubscriptionActions } from "@/components/admin/AccountSubscriptionActions";
import { isExpiringSoon } from "@/lib/subscriptionStatus";
import type {
  BrokerageRow,
  BrokerRow,
  DeveloperRow,
  DbBrokerSubscriptionStatus,
  DbDeveloperSubscriptionStatus,
  DbPaymentType,
  SalespersonRow,
} from "@/types/database";

const brokerStatusTone: Record<DbBrokerSubscriptionStatus, "green" | "gold" | "red" | "neutral"> = {
  no_subscription: "neutral",
  payment_pending: "gold",
  active: "green",
  expired: "red",
  cancelled: "neutral",
  payment_failed: "red",
  suspended: "red",
};

const developerStatusTone: Record<DbDeveloperSubscriptionStatus, "green" | "gold" | "red" | "neutral"> = {
  inactive: "neutral",
  active: "green",
  past_due: "red",
  expired: "red",
  cancelled: "neutral",
  suspended: "red",
};

const paymentTypeLabel: Record<DbPaymentType, string> = {
  stripe: "Stripe",
  bank_transfer: "Bank Transfer",
  admin_free: "Admin Granted",
};

type WithAutoRenew<T> = T & { auto_renew?: boolean };

export function DevelopersSubscriptionTable({
  developers,
  pendingDeveloperIds,
}: {
  developers: WithAutoRenew<DeveloperRow>[];
  pendingDeveloperIds: string[];
}) {
  const pending = new Set(pendingDeveloperIds);
  return (
    <SearchableDataTable
      searchPlaceholder="Search developers by name..."
      searchFields={(d) => [d.name]}
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
              {pending.has(d.id) && <Badge tone="gold">Pending Bank Approval</Badge>}
              {d.is_complimentary && <Badge tone="blue">complimentary</Badge>}
              {d.payment_type && <Badge tone="purple">{paymentTypeLabel[d.payment_type as DbPaymentType]}</Badge>}
            </div>
          ),
        },
        { header: "Expires", render: (d) => (d.subscription_expires_at ? new Date(d.subscription_expires_at).toLocaleDateString() : "—") },
        {
          header: "",
          render: (d) => (
            <AccountSubscriptionActions accountType="developer" accountId={d.id} currentStatus={d.subscription_status} autoRenew={d.auto_renew} />
          ),
        },
      ]}
      rows={developers}
    />
  );
}

export function BrokersSubscriptionTable({
  brokers,
  pendingBrokerIds,
}: {
  brokers: WithAutoRenew<BrokerRow>[];
  pendingBrokerIds: string[];
}) {
  const pending = new Set(pendingBrokerIds);
  return (
    <SearchableDataTable
      searchPlaceholder="Search brokers by name..."
      searchFields={(b) => [b.full_name]}
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
              {pending.has(b.id) && <Badge tone="gold">Pending Bank Approval</Badge>}
              {b.is_complimentary && <Badge tone="blue">complimentary</Badge>}
              {b.payment_type && <Badge tone="purple">{paymentTypeLabel[b.payment_type as DbPaymentType]}</Badge>}
            </div>
          ),
        },
        { header: "Expires", render: (b) => (b.subscription_expires_at ? new Date(b.subscription_expires_at).toLocaleDateString() : "—") },
        {
          header: "",
          render: (b) => <BrokerSubscriptionActions brokerId={b.id} currentStatus={b.subscription_status} autoRenew={b.auto_renew} />,
        },
      ]}
      rows={brokers}
    />
  );
}

export function SalespersonsSubscriptionTable({
  salespersons,
  pendingSalespersonIds,
}: {
  salespersons: WithAutoRenew<SalespersonRow>[];
  pendingSalespersonIds: string[];
}) {
  const pending = new Set(pendingSalespersonIds);
  return (
    <SearchableDataTable
      searchPlaceholder="Search salespersons by name..."
      searchFields={(s) => [s.full_name]}
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
              {pending.has(s.id) && <Badge tone="gold">Pending Bank Approval</Badge>}
              {s.is_complimentary && <Badge tone="blue">complimentary</Badge>}
              {s.payment_type && <Badge tone="purple">{paymentTypeLabel[s.payment_type as DbPaymentType]}</Badge>}
            </div>
          ),
        },
        { header: "Expires", render: (s) => (s.subscription_expires_at ? new Date(s.subscription_expires_at).toLocaleDateString() : "—") },
        {
          header: "",
          render: (s) => (
            <AccountSubscriptionActions accountType="salesperson" accountId={s.id} currentStatus={s.subscription_status} autoRenew={s.auto_renew} />
          ),
        },
      ]}
      rows={salespersons}
    />
  );
}

export function BrokerAgenciesSubscriptionTable({
  brokerAgencies,
  pendingBrokerAgencyIds,
}: {
  brokerAgencies: WithAutoRenew<
    BrokerageRow & {
      plan_key: string | null;
      subscription_status: DbBrokerSubscriptionStatus;
      subscription_expires_at: string | null;
      is_complimentary: boolean;
      payment_type: DbPaymentType | null;
    }
  >[];
  pendingBrokerAgencyIds: string[];
}) {
  const pending = new Set(pendingBrokerAgencyIds);
  return (
    <SearchableDataTable
      searchPlaceholder="Search broker agencies by name..."
      searchFields={(a) => [a.name]}
      columns={[
        { header: "Agency", render: (a) => <span className="font-medium text-ink-100">{a.name}</span> },
        { header: "Plan", render: (a) => a.plan_key ?? "—" },
        {
          header: "Status",
          render: (a) => (
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={brokerStatusTone[a.subscription_status as DbBrokerSubscriptionStatus]}>
                {a.subscription_status.replace(/_/g, " ")}
              </Badge>
              {isExpiringSoon(a.subscription_status, a.subscription_expires_at) && (
                <Badge tone="gold">Expiring Soon</Badge>
              )}
              {pending.has(a.id) && <Badge tone="gold">Pending Bank Approval</Badge>}
              {a.is_complimentary && <Badge tone="blue">complimentary</Badge>}
              {a.payment_type && <Badge tone="purple">{paymentTypeLabel[a.payment_type as DbPaymentType]}</Badge>}
            </div>
          ),
        },
        { header: "Expires", render: (a) => (a.subscription_expires_at ? new Date(a.subscription_expires_at).toLocaleDateString() : "—") },
        {
          header: "",
          render: (a) => (
            <AccountSubscriptionActions accountType="broker_agency" accountId={a.id} currentStatus={a.subscription_status} autoRenew={a.auto_renew} />
          ),
        },
      ]}
      rows={brokerAgencies}
    />
  );
}
