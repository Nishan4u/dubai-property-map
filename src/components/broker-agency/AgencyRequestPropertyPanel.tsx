import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveSalespersonsForDeveloper, getCurrentProfile, isFreeAccessEnabled } from "@/lib/supabase/queries";
import { AgencyPropertyRequestForm } from "./AgencyPropertyRequestForm";

// Agency counterpart to RequestPropertyPanel (broker). Renders nothing for
// non-agency accounts.
export async function AgencyRequestPropertyPanel({
  projectId,
  developerId,
}: {
  projectId: string;
  developerId: string;
}) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "broker_agency" || !profile.broker_agency_id) return null;

  const supabase = await createClient();
  const { data: agency } = await supabase
    .from("brokerages")
    .select("verified, subscription_status")
    .eq("id", profile.broker_agency_id)
    .single();
  if (!agency) return null;

  if (!agency.verified) {
    return (
      <div className="rounded-xl border border-navy-700 bg-navy-850 p-5 text-sm text-ink-400">
        Your agency account is pending admin approval — you&apos;ll be able to request this property once
        it&apos;s approved.
      </div>
    );
  }

  if (agency.subscription_status !== "active" && !(await isFreeAccessEnabled("broker_agency"))) {
    return (
      <div className="rounded-xl border border-navy-700 bg-navy-850 p-5 text-sm text-ink-400">
        <p>An active subscription is required to submit property requests.</p>
        <Link href="/broker-agency/subscription" className="mt-2 inline-block text-sm font-medium text-gold-400 hover:underline">
          Subscribe →
        </Link>
      </div>
    );
  }

  const salespersons = await getActiveSalespersonsForDeveloper(developerId);

  return <AgencyPropertyRequestForm projectId={projectId} salespersons={salespersons} />;
}
