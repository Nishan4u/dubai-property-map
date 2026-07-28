"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { logAudit } from "@/lib/auditLog";

export function BrokerAgencyBrokerActions({ brokerId, fullName }: { brokerId: string; fullName: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDisconnect() {
    if (
      !window.confirm(
        `Disconnect ${fullName} from your agency? Their account, subscription and request history stay intact — they'll just become an independent broker.`
      )
    ) {
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("disconnect_broker_from_agency", { p_broker_id: brokerId });
    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }
    await logAudit("broker.disconnected_from_agency", "broker", brokerId);
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      disabled={loading}
      onClick={handleDisconnect}
      className="text-xs font-medium text-rose-400 hover:text-rose-300 disabled:opacity-50"
    >
      {loading ? "Disconnecting…" : "Disconnect"}
    </button>
  );
}
