import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BrokerAgencyShellClient } from "@/components/broker-agency/BrokerAgencyShellClient";
import { BrokerAgencyLicenseUpload } from "@/components/broker-agency/BrokerAgencyLicenseUpload";

// Defense-in-depth against indexing -- robots.ts already disallows
// "/broker-agency", but a page-level noindex (same pattern already
// used on /embed/developer/[slug]) makes exclusion resilient even
// against a crawler that doesn't respect robots.txt.
export const metadata = { robots: { index: false, follow: false } };

export default async function BrokerAgencyLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  let { data: profile } = await supabase
    .from("profiles")
    .select("*, brokerages!profiles_broker_agency_id_fkey(*)")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "broker_agency") redirect("/");

  if (!profile.broker_agency_id) {
    const meta = (user.user_metadata ?? {}) as {
      agency_name?: string;
      agency_phone?: string;
      contact_person?: string;
      office_details?: string;
    };

    await supabase.rpc("claim_broker_agency_profile", {
      p_agency_name: meta.agency_name ?? "",
      p_phone: meta.agency_phone ?? "",
      p_contact_person: meta.contact_person ?? "",
      p_office_details: meta.office_details ?? "",
    });

    const refetched = await supabase
      .from("profiles")
      .select("*, brokerages!profiles_broker_agency_id_fkey(*)")
      .eq("id", user.id)
      .single();
    profile = refetched.data;
  }

  if (!profile || !profile.brokerages) redirect("/");

  const agency = profile.brokerages;

  if (!agency.license_path) {
    return <BrokerAgencyLicenseUpload agencyId={agency.id} />;
  }

  return (
    <BrokerAgencyShellClient userLabel={agency.name} userRole="Broker Agency">
      {children}
    </BrokerAgencyShellClient>
  );
}
