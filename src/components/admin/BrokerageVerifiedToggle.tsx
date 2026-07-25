"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { logAudit } from "@/lib/auditLog";

export function BrokerageVerifiedToggle({ brokerageId, verified }: { brokerageId: string; verified: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const supabase = createClient();
    await supabase.from("brokerages").update({ verified: !verified }).eq("id", brokerageId);
    await logAudit(verified ? "brokerage.unverified" : "brokerage.verified", "brokerage", brokerageId);
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      disabled={loading}
      onClick={toggle}
      className="text-xs font-medium text-gold-400 hover:text-gold-300 disabled:opacity-50"
    >
      {verified ? "Mark Unverified" : "Mark Verified"}
    </button>
  );
}
