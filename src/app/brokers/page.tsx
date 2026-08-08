import { PublicShell } from "@/components/public/PublicShell";
import { BrokersDirectoryClient } from "@/components/public/BrokersDirectoryClient";
import { getBrokersDirectory, getCommunities } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return {
    title: "Brokers Directory | Dubai Property Map",
    description: "Browse verified real estate brokers in Dubai — their own property listings and the developer projects they represent.",
    alternates: { canonical: "/brokers" },
  };
}

// Deliberately NOT wrapped in ProjectAccessGate/getMapAccessStatus -- the
// spec's own guest/registered split (section 8) is the gate here: guests
// browse the full directory and every broker's real listings/projects,
// only the literal contact fields (phone/email/WhatsApp) are withheld
// until registered. See BrokerContactPanel.tsx.
export default async function BrokersDirectoryPage() {
  const [brokers, communities] = await Promise.all([getBrokersDirectory(), getCommunities()]);

  return (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-bold text-ink-100">Brokers</h1>
        <p className="mt-1 text-sm text-ink-400">{brokers.length} real estate brokers on Dubai Property Map.</p>
        <BrokersDirectoryClient brokers={brokers} communities={communities} />
      </div>
    </PublicShell>
  );
}
