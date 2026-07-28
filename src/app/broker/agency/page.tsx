import { createClient } from "@/lib/supabase/server";
import { ChangeAgencyForm } from "@/components/broker/ChangeAgencyForm";

export const dynamic = "force-dynamic";

export default async function BrokerAgencyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from("profiles").select("broker_id").eq("id", user!.id).single();

  const { data: broker } = await supabase
    .from("brokers")
    .select("brokerage_id, license_path, license_status, brokerages(name)")
    .eq("id", profile!.broker_id)
    .single();

  const { data: history } = await supabase
    .from("broker_agency_history")
    .select("started_at, ended_at, became_independent, brokerages(name)")
    .eq("broker_id", profile!.broker_id!)
    .order("started_at", { ascending: false });

  const { data: agencies } = await supabase.from("brokerages").select("id, name").not("company_email", "is", null).order("name");

  const currentAgency = broker?.brokerages as { name?: string } | { name?: string }[] | null;
  const agencyName = Array.isArray(currentAgency) ? currentAgency[0]?.name : currentAgency?.name;

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">My Agency</h1>
        <p className="text-sm text-ink-400">Your subscription stays active no matter which agency you&apos;re connected to.</p>
      </div>

      <div className="rounded-xl border border-navy-700 bg-navy-850 p-4">
        <p className="text-xs text-ink-500">Currently Connected To</p>
        <p className="mt-1 text-lg font-semibold text-ink-100">{agencyName ?? "Independent Broker"}</p>
      </div>

      <ChangeAgencyForm
        agencies={agencies ?? []}
        currentBrokerageId={broker?.brokerage_id ?? null}
        hasLicenseOnFile={!!broker?.license_path}
      />

      <div>
        <h2 className="mb-2 text-sm font-semibold text-ink-200">History</h2>
        <div className="divide-y divide-navy-800 rounded-xl border border-navy-700 bg-navy-850">
          {(history ?? []).map((h, i) => {
            const agency = h.brokerages as { name?: string } | { name?: string }[] | null;
            const name = Array.isArray(agency) ? agency[0]?.name : agency?.name;
            return (
              <div key={i} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-ink-100">{name ?? "Independent Broker"}</span>
                <span className="text-xs text-ink-500">
                  {new Date(h.started_at).toLocaleDateString()} — {h.ended_at ? new Date(h.ended_at).toLocaleDateString() : "Present"}
                </span>
              </div>
            );
          })}
          {(history ?? []).length === 0 && <p className="px-4 py-3 text-xs text-ink-500">No history yet.</p>}
        </div>
      </div>
    </div>
  );
}
