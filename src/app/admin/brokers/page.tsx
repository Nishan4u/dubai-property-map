import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { BrokerStatusActions } from "@/components/admin/BrokerStatusActions";
import { BrokerForceLogoutButton } from "@/components/admin/BrokerForceLogoutButton";
import { getAllBrokersAdmin } from "@/lib/supabase/queries";
import type { DbBrokerAccountStatus, DbBrokerSubscriptionStatus } from "@/types/database";

export const dynamic = "force-dynamic";

const accountTone: Record<DbBrokerAccountStatus, "green" | "gold" | "red"> = {
  pending_verification: "gold",
  approved: "green",
  rejected: "red",
  suspended: "red",
  blocked: "red",
};

const subscriptionTone: Record<DbBrokerSubscriptionStatus, "green" | "gold" | "red" | "neutral"> = {
  no_subscription: "neutral",
  payment_pending: "gold",
  active: "green",
  expired: "red",
  cancelled: "neutral",
  payment_failed: "red",
  suspended: "red",
};

export default async function AdminBrokersPage() {
  const brokers = await getAllBrokersAdmin();

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Brokers</h1>
        <p className="text-sm text-ink-400">{brokers.length} brokers registered on the platform.</p>
      </div>

      <DataTable
        columns={[
          {
            header: "Broker",
            render: (b) => (
              <div className="flex items-center gap-2">
                {b.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.photo_url} alt={b.full_name} className="h-6 w-6 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold-500 text-[10px] font-bold text-navy-950">
                    {b.full_name.charAt(0)}
                  </span>
                )}
                <span className="font-medium text-ink-100">{b.full_name}</span>
              </div>
            ),
          },
          { header: "Brokerage", render: (b) => b.brokerages?.name ?? "—" },
          { header: "BRN", render: (b) => b.brn },
          { header: "Email", render: (b) => b.email },
          {
            header: "Account",
            render: (b) => (
              <Badge tone={accountTone[b.account_status as DbBrokerAccountStatus]}>
                {b.account_status.replace(/_/g, " ")}
              </Badge>
            ),
          },
          {
            header: "Subscription",
            render: (b) => (
              <Badge tone={subscriptionTone[b.subscription_status as DbBrokerSubscriptionStatus]}>
                {b.subscription_status.replace(/_/g, " ")}
              </Badge>
            ),
          },
          {
            header: "",
            render: (b) => (
              <div className="flex items-center gap-3">
                <BrokerStatusActions brokerId={b.id} status={b.account_status as DbBrokerAccountStatus} />
                <BrokerForceLogoutButton brokerId={b.id} />
                <Link href={`/admin/brokers/${b.id}`} className="text-xs font-medium text-gold-400 hover:text-gold-300">
                  View →
                </Link>
              </div>
            ),
          },
        ]}
        rows={brokers}
      />
    </div>
  );
}
