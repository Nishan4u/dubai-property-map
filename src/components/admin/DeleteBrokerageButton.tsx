"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logAudit } from "@/lib/auditLog";

export function DeleteBrokerageButton({
  brokerageId,
  brokerageName,
  brokerCount,
}: {
  brokerageId: string;
  brokerageName: string;
  /** Brokers still belong to this agency (brokers.brokerage_id is ON DELETE
   * RESTRICT) -- block deletion client-side with a clear message instead
   * of letting the DB reject it with a raw foreign-key error. */
  brokerCount: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (brokerCount > 0) {
      window.alert(`Can't delete "${brokerageName}" — it still has ${brokerCount} broker(s) assigned to it.`);
      return;
    }
    if (
      !window.confirm(
        `Delete "${brokerageName}"? This removes the brokerage account permanently. This cannot be undone.`
      )
    ) {
      return;
    }
    setLoading(true);
    const supabase = createClient();
    await logAudit("brokerage.deleted", "brokerage", brokerageId, { name: brokerageName });
    await supabase.from("brokerages").delete().eq("id", brokerageId);
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="flex items-center gap-1 text-xs font-medium text-rose-400 hover:text-rose-300 disabled:opacity-50"
    >
      <Trash2 className="h-3.5 w-3.5" />
      {loading ? "Deleting…" : "Delete"}
    </button>
  );
}
