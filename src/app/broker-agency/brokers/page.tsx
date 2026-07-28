import { BrokerAgencyRosterTable } from "@/components/broker-agency/BrokerAgencyRosterTable";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function BrokerAgencyBrokersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from("profiles").select("broker_agency_id").eq("id", user!.id).single();

  const { data: brokers } = await supabase
    .from("brokers")
    .select("id, full_name, email, mobile, account_status, subscription_status")
    .eq("brokerage_id", profile!.broker_agency_id)
    .order("full_name");

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">My Brokers</h1>
        <p className="text-sm text-ink-400">Brokers connected to your agency.</p>
      </div>

      <BrokerAgencyRosterTable brokers={brokers ?? []} />
    </div>
  );
}
