"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { logAudit } from "@/lib/auditLog";

export function SalespersonActions({ salespersonId, fullName }: { salespersonId: string; fullName: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDisconnect() {
    if (
      !window.confirm(
        `Disconnect ${fullName} from your team? Their account, subscription and history stay intact — they just won't be on your roster anymore.`
      )
    ) {
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("disconnect_salesperson_from_developer", { p_salesperson_id: salespersonId });
    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }
    await logAudit("salesperson.disconnected", "salesperson", salespersonId);
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
