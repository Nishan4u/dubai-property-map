import { User } from "lucide-react";
import { BrokerProfileForm } from "@/components/broker/BrokerProfileForm";
import { BrokerVerificationCard } from "@/components/broker/BrokerVerificationCard";
import { createClient } from "@/lib/supabase/server";
import { requireBrokerProfile } from "@/lib/supabase/queries";
import type { BrokerRow } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function BrokerProfilePage() {
  const profile = await requireBrokerProfile();
  const supabase = await createClient();
  const [{ data: broker }, { data: feeSetting }] = await Promise.all([
    supabase.from("brokers").select("*").eq("id", profile.broker_id).single(),
    supabase.from("platform_settings").select("value").eq("key", "broker_verification_fee_aed").maybeSingle(),
  ]);

  if (!broker) return null;
  const feeAed = Number(feeSetting?.value) || 50;

  return (
    <div className="space-y-6 p-6">
      <h1 className="flex items-center gap-2 text-xl font-bold text-ink-100">
        <User className="h-5 w-5 text-gold-400" /> Profile
      </h1>
      {/* ?? "none" / ?? null guard against patch_127 not being applied yet
          -- select("*") on brokers just omits new columns rather than
          erroring, so these keep the card from crashing pre-migration. */}
      <BrokerVerificationCard
        verificationStatus={(broker as BrokerRow).verification_status ?? "none"}
        verificationExpiresAt={(broker as BrokerRow).verification_expires_at ?? null}
        feeAed={feeAed}
      />
      <BrokerProfileForm broker={broker as BrokerRow} />
    </div>
  );
}
