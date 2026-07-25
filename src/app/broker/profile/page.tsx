import { User } from "lucide-react";
import { BrokerProfileForm } from "@/components/broker/BrokerProfileForm";
import { createClient } from "@/lib/supabase/server";
import { requireBrokerProfile } from "@/lib/supabase/queries";
import type { BrokerRow } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function BrokerProfilePage() {
  const profile = await requireBrokerProfile();
  const supabase = await createClient();
  const { data: broker } = await supabase
    .from("brokers")
    .select("*")
    .eq("id", profile.broker_id)
    .single();

  if (!broker) return null;

  return (
    <div className="space-y-4 p-6">
      <h1 className="flex items-center gap-2 text-xl font-bold text-ink-100">
        <User className="h-5 w-5 text-gold-400" /> Profile
      </h1>
      <BrokerProfileForm broker={broker as BrokerRow} />
    </div>
  );
}
