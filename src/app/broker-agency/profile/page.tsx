import { createClient } from "@/lib/supabase/server";
import { BrokerAgencyLogoUpload } from "@/components/broker-agency/BrokerAgencyLogoUpload";
import { AgencySubdomainForm } from "@/components/broker-agency/AgencySubdomainForm";

export const dynamic = "force-dynamic";

export default async function BrokerAgencyProfilePage() {
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

  const fields: [string, string | null][] = [
    ["Agency Name", agency.name],
    ["Company Email", agency.company_email],
    ["Phone", agency.phone],
    ["Contact Person", agency.contact_person],
    ["Office Details", agency.office_details],
  ];

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">My Profile</h1>
        <p className="text-sm text-ink-400">Your agency&apos;s registration details.</p>
      </div>
      <BrokerAgencyLogoUpload brokerageId={agency.id} name={agency.name} logoUrl={agency.logo_url ?? null} />
      <AgencySubdomainForm currentSubdomain={agency.subdomain ?? null} />
      <div className="divide-y divide-navy-800 rounded-xl border border-navy-700 bg-navy-850">
        {fields.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between px-4 py-3">
            <span className="text-xs text-ink-500">{label}</span>
            <span className="text-sm text-ink-100">{value || "—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
