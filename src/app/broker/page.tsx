import { Briefcase, CreditCard, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/server";
import { requireBrokerProfile } from "@/lib/supabase/queries";
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
};

export default async function BrokerDashboardPage() {
  const profile = await requireBrokerProfile();
  const supabase = await createClient();
  const { data: broker } = await supabase
    .from("brokers")
    .select("*, brokerages(name)")
    .eq("id", profile.broker_id)
    .single();

  if (!broker) return null;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Welcome, {broker.full_name}</h1>
        <p className="text-sm text-ink-400">{broker.brokerages?.name}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-navy-700 bg-navy-850 p-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-medium text-ink-300">
              <ShieldCheck className="h-4 w-4 text-ink-500" /> Account Status
            </span>
            <Badge tone={accountTone[broker.account_status as DbBrokerAccountStatus]}>
              {broker.account_status.replace(/_/g, " ")}
            </Badge>
          </div>
        </div>
        <div className="rounded-xl border border-navy-700 bg-navy-850 p-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-medium text-ink-300">
              <CreditCard className="h-4 w-4 text-ink-500" /> Subscription
            </span>
            <Badge tone={subscriptionTone[broker.subscription_status as DbBrokerSubscriptionStatus]}>
              {broker.subscription_status.replace(/_/g, " ")}
            </Badge>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-navy-700 bg-navy-850 p-6 text-sm text-ink-400">
        <p className="flex items-center gap-2 font-medium text-ink-200">
          <Briefcase className="h-4 w-4 text-gold-400" /> You&apos;re approved to browse the Property Map.
        </p>
        <p className="mt-2">
          Subscription checkout and property requests are rolling out next — this
          dashboard will show your request stats here once that&apos;s live.
        </p>
      </div>
    </div>
  );
}
