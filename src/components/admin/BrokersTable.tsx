"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { SearchableDataTable } from "@/components/admin/SearchableDataTable";
import { BrokerStatusActions } from "@/components/admin/BrokerStatusActions";
import { BrokerForceLogoutButton } from "@/components/admin/BrokerForceLogoutButton";
import { DeleteBrokerButton } from "@/components/admin/DeleteBrokerButton";
import { createClient } from "@/lib/supabase/client";
import { logAudit } from "@/lib/auditLog";
import type { BrokerRow, DbBrokerAccountStatus, DbBrokerSubscriptionStatus } from "@/types/database";

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

export function BrokersTable({
  brokers,
}: {
  brokers: (BrokerRow & { brokerages: { name: string } | null })[];
}) {
  const router = useRouter();

  async function handleDeleteSelected(ids: string[]) {
    const names = ids.map((id) => brokers.find((b) => b.id === id)?.full_name).filter(Boolean);
    if (
      !window.confirm(
        `Delete ${ids.length} broker${ids.length === 1 ? "" : "s"}? This removes each broker account permanently. This cannot be undone.\n\n${names.join(", ")}`
      )
    ) {
      return;
    }
    const supabase = createClient();
    for (const id of ids) {
      const broker = brokers.find((b) => b.id === id);
      await logAudit("broker.deleted", "broker", id, { name: broker?.full_name });
      await supabase.from("brokers").delete().eq("id", id);
    }
    router.refresh();
  }

  return (
    <SearchableDataTable
      searchPlaceholder="Search brokers by name, email or BRN..."
      searchFields={(b) => [b.full_name, b.email, b.brn, b.brokerages?.name]}
      selectable
      onDeleteSelected={handleDeleteSelected}
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
              <DeleteBrokerButton brokerId={b.id} brokerName={b.full_name} />
            </div>
          ),
        },
      ]}
      rows={brokers}
    />
  );
}
