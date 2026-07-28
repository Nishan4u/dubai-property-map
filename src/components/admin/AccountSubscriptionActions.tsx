"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AccountSubscriptionActions({
  accountType,
  accountId,
  currentStatus,
  autoRenew,
}: {
  accountType: "developer" | "salesperson" | "broker_agency";
  accountId: string;
  currentStatus?: string;
  autoRenew?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function runAction(action: "extend" | "complimentary" | "cancel" | "suspend" | "reactivate" | "toggle_auto_renew") {
    if (action === "cancel" && !window.confirm("Cancel this subscription?")) return;
    if (action === "suspend" && !window.confirm("Suspend this subscription? The account will lose paid-plan access until reactivated.")) return;
    setLoading(true);
    await fetch(`/api/admin/subscriptions/${accountType}/${accountId}`, {
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
      <button
        disabled={loading}
        onClick={() => runAction("toggle_auto_renew")}
        className={`text-xs font-medium disabled:opacity-50 ${autoRenew ? "text-sky-400 hover:text-sky-300" : "text-ink-500 hover:text-ink-300"}`}
      >
        Auto-Renew: {autoRenew ? "On" : "Off"}
      </button>
    </div>
  );
}
