"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function BrokerSubscriptionActions({ brokerId, currentStatus }: { brokerId: string; currentStatus?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function runAction(action: "extend" | "complimentary" | "cancel" | "suspend" | "reactivate") {
    if (action === "cancel" && !window.confirm("Cancel this broker's subscription?")) return;
    if (action === "suspend" && !window.confirm("Suspend this broker's subscription? They'll lose paid-plan access until reactivated.")) return;
    setLoading(true);
    await fetch(`/api/admin/brokers/${brokerId}/subscription`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, days: 30 }),
    });
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button disabled={loading} onClick={() => runAction("extend")} className="text-xs font-medium text-gold-400 hover:text-gold-300 disabled:opacity-50">
        Extend 30d
      </button>
      <button disabled={loading} onClick={() => runAction("complimentary")} className="text-xs font-medium text-emerald-400 hover:text-emerald-300 disabled:opacity-50">
        Give Complimentary
      </button>
      {currentStatus === "suspended" ? (
        <button disabled={loading} onClick={() => runAction("reactivate")} className="text-xs font-medium text-emerald-400 hover:text-emerald-300 disabled:opacity-50">
          Reactivate
        </button>
      ) : (
        <button disabled={loading} onClick={() => runAction("suspend")} className="text-xs font-medium text-amber-400 hover:text-amber-300 disabled:opacity-50">
          Suspend
        </button>
      )}
      <button disabled={loading} onClick={() => runAction("cancel")} className="text-xs font-medium text-rose-400 hover:text-rose-300 disabled:opacity-50">
        Cancel
      </button>
    </div>
  );
}
