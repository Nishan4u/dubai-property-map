import { ShieldCheck } from "lucide-react";
import { BrokerSecurityClient } from "@/components/broker/BrokerSecurityClient";
import { createClient } from "@/lib/supabase/server";
import { requireBrokerProfile } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function BrokerSecurityPage() {
  const profile = await requireBrokerProfile();
  const supabase = await createClient();
  const { data: session } = await supabase
    .from("broker_sessions")
    .select("id, device_label, ip, created_at, last_active")
    .eq("broker_id", profile.broker_id)
    .eq("status", "active")
    .maybeSingle();

  return (
    <div className="space-y-4 p-6">
      <h1 className="flex items-center gap-2 text-xl font-bold text-ink-100">
        <ShieldCheck className="h-5 w-5 text-gold-400" /> Security
      </h1>
      <BrokerSecurityClient session={session} />
    </div>
  );
}
