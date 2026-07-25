"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DbBrokerAccountStatus } from "@/types/database";

export function BrokerStatusActions({
  brokerId,
  status,
}: {
  brokerId: string;
  status: DbBrokerAccountStatus;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function runAction(action: "approve" | "reject" | "suspend" | "block", promptMsg?: string) {
    let reason: string | undefined;
    if (promptMsg) {
      const input = window.prompt(promptMsg);
      if (input === null) return; // cancelled
      reason = input || undefined;
    }

    setLoading(true);
    await fetch(`/api/admin/brokers/${brokerId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason }),
    });
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status !== "approved" && (
        <button
          disabled={loading}
          onClick={() => runAction("approve")}
          className="text-xs font-medium text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
        >
          Approve
        </button>
      )}
      {status === "pending_verification" && (
        <button
          disabled={loading}
          onClick={() => runAction("reject", "Reason for rejection (optional):")}
          className="text-xs font-medium text-rose-400 hover:text-rose-300 disabled:opacity-50"
        >
          Reject
        </button>
      )}
      {status !== "suspended" && status !== "blocked" && status !== "pending_verification" && (
        <button
          disabled={loading}
          onClick={() => runAction("suspend", "Reason for suspension (optional):")}
          className="text-xs font-medium text-amber-400 hover:text-amber-300 disabled:opacity-50"
        >
          Suspend
        </button>
      )}
      {status !== "blocked" && (
        <button
          disabled={loading}
          onClick={() => {
            if (window.confirm("Block this broker? This is more severe than suspend and should be reserved for policy violations.")) {
              runAction("block");
            }
          }}
          className="text-xs font-medium text-rose-500 hover:text-rose-400 disabled:opacity-50"
        >
          Block
        </button>
      )}
    </div>
  );
}
