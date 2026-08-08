import { BrokerListingForm } from "@/components/broker/BrokerListingForm";
import { getCommunities, requireBrokerProfile } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function NewBrokerListingPage() {
  const profile = await requireBrokerProfile();
  const supabase = await createClient();
  const [communities, { data: broker }] = await Promise.all([
    getCommunities(),
    supabase.from("brokers").select("whatsapp").eq("id", profile.broker_id).single(),
  ]);

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Add Listing</h1>
        <p className="text-sm text-ink-400">List your own property for Sale, Rent, or Lease.</p>
      </div>
      <BrokerListingForm brokerId={profile.broker_id} communities={communities} brokerWhatsapp={broker?.whatsapp ?? ""} />
    </div>
  );
}
