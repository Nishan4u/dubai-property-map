import { notFound } from "next/navigation";
import { BrokerListingForm } from "@/components/broker/BrokerListingForm";
import { getBrokerListingForOwner, getCommunities, requireBrokerProfile } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function EditBrokerListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireBrokerProfile();
  const [listing, communities, { data: broker }] = await Promise.all([
    getBrokerListingForOwner(profile.broker_id, id),
    getCommunities(),
    (await createClient()).from("brokers").select("whatsapp").eq("id", profile.broker_id).single(),
  ]);
  if (!listing) notFound();

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">{listing.title}</h1>
        <p className="text-sm text-ink-400">Editing this listing resubmits it for review.</p>
      </div>
      <BrokerListingForm listing={listing} brokerId={profile.broker_id} communities={communities} brokerWhatsapp={broker?.whatsapp ?? ""} />
    </div>
  );
}
