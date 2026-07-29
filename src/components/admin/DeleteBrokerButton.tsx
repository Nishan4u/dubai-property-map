"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logAudit } from "@/lib/auditLog";

export function DeleteBrokerButton({
  brokerId,
  brokerName,
}: {
  brokerId: string;
  brokerName: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (
      !window.confirm(
        `Delete "${brokerName}"? This removes the broker account permanently. This cannot be undone.`
      )
    ) {
      return;
    }
    setLoading(true);
    const supabase = createClient();
    await logAudit("broker.deleted", "broker", brokerId, { name: brokerName });
    await supabase.from("brokers").delete().eq("id", brokerId);
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
