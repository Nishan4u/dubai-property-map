import Link from "next/link";
import { BadgeCheck, Clock, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function BrokerAgencyDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, brokerages!profiles_broker_agency_id_fkey(*)")
    .eq("id", user!.id)
    .single();
  const agency = profile!.brokerages;

  const { count: brokerCount } = await supabase
    .from("brokers")
    .select("*", { count: "exact", head: true })
    .eq("brokerage_id", agency.id);

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">{agency.name}</h1>
        <p className="text-sm text-ink-400">Broker Agency Dashboard</p>
      </div>

      {!agency.verified && (
        <div className="flex items-center gap-3 rounded-xl border border-gold-500/30 bg-gold-500/10 p-4">
          <Clock className="h-5 w-5 shrink-0 text-gold-400" />
          <p className="text-sm text-ink-200">
            Your license is under review. You&apos;ll have full access once an admin verifies your agency.
          </p>
        </div>
      )}
      {agency.verified && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-600/30 bg-emerald-500/10 p-4">
          <BadgeCheck className="h-5 w-5 shrink-0 text-emerald-400" />
          <p className="text-sm text-ink-200">Your agency is verified.</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Link href="/broker-agency/brokers" className="rounded-xl border border-navy-700 bg-navy-850 p-4 hover:border-gold-500/40">
          <Users className="h-5 w-5 text-gold-400" />
          <p className="mt-2 text-xs text-ink-500">My Brokers</p>
          <p className="mt-1 text-xl font-bold text-ink-100">{brokerCount ?? 0}</p>
        </Link>
        <div className="rounded-xl border border-navy-700 bg-navy-850 p-4">
          <p className="text-xs text-ink-500">Subscription</p>
          <p className="mt-1 text-sm font-semibold capitalize text-ink-100">{agency.subscription_status.replace(/_/g, " ")}</p>
        </div>
      </div>
    </div>
  );
}
