import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const statusTone: Record<string, "green" | "gold" | "red" | "neutral"> = {
  approved: "green",
  pending_verification: "gold",
  rejected: "red",
  suspended: "red",
  blocked: "red",
};

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

      <DataTable
        columns={[
          { header: "Broker", render: (b) => b.full_name },
          { header: "Email", render: (b) => b.email },
          { header: "Mobile", render: (b) => b.mobile },
          { header: "Status", render: (b) => <Badge tone={statusTone[b.account_status] ?? "neutral"}>{b.account_status.replace(/_/g, " ")}</Badge> },
          { header: "Subscription", render: (b) => <span className="capitalize">{b.subscription_status.replace(/_/g, " ")}</span> },
        ]}
        rows={brokers ?? []}
      />
      {(brokers ?? []).length === 0 && <p className="text-xs text-ink-500">No brokers connected yet.</p>}
    </div>
  );
}
