import { notFound } from "next/navigation";
import { AgencyClientDetailClient } from "@/components/broker-agency/AgencyClientDetailClient";
import { getCrmClientDetailForBrokerAgency, requireBrokerAgencyProfile } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function BrokerAgencyClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireBrokerAgencyProfile();
  const { id } = await params;
  const detail = await getCrmClientDetailForBrokerAgency(id, profile.broker_agency_id);
  if (!detail) notFound();

  return (
    <div className="space-y-4 p-6">
      <AgencyClientDetailClient detail={detail} />
    </div>
  );
}
