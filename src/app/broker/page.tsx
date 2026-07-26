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
  suspended: "red",
};

const OPEN_STATUSES = [
  "new",
  "broker_contacted",
  "requirement_confirmed",
  "units_shared",
  "viewing_scheduled",
  "negotiation",
  "booking",
  "on_hold",
];

export default async function BrokerDashboardPage() {
  const profile = await requireBrokerProfile();
  const supabase = await createClient();
  const { data: broker } = await supabase
    .from("brokers")
    .select("*, brokerages(name)")
    .eq("id", profile.broker_id)
    .single();

  if (!broker) return null;

  const { data: requests } = await supabase
    .from("property_requests")
    .select("status")
    .eq("broker_id", profile.broker_id);

  const totalRequests = requests?.length ?? 0;
  const openRequests = requests?.filter((r) => OPEN_STATUSES.includes(r.status)).length ?? 0;
  const wonRequests = requests?.filter((r) => r.status === "closed_won").length ?? 0;

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
          Submit a property request directly from any project page — look for
          &quot;Request Property&quot; and pick the developer&apos;s salesperson.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-navy-700 bg-navy-850 p-4 text-center">
          <p className="text-2xl font-bold text-ink-100">{totalRequests}</p>
          <p className="text-xs text-ink-500">Total Requests</p>
        </div>
        <div className="rounded-xl border border-navy-700 bg-navy-850 p-4 text-center">
          <p className="text-2xl font-bold text-gold-400">{openRequests}</p>
          <p className="text-xs text-ink-500">Open Requests</p>
        </div>
        <div className="rounded-xl border border-navy-700 bg-navy-850 p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">{wonRequests}</p>
          <p className="text-xs text-ink-500">Closed Won</p>
        </div>
      </div>
    </div>
  );
}
