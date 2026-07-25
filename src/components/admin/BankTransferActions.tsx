"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function BankTransferActions({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function runAction(action: "approve" | "reject", promptMsg?: string) {
    let reason: string | undefined;
    if (promptMsg) {
      const input = window.prompt(promptMsg);
      if (input === null) return; // cancelled
      reason = input || undefined;
    }

    setLoading(true);
    const res = await fetch(`/api/admin/bank-transfers/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      window.alert(data.error ?? "Something went wrong.");
    }
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        disabled={loading}
        onClick={() => runAction("approve")}
        className="text-xs font-medium text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
      >
        Approve
      </button>
      <button
        disabled={loading}
        onClick={() => runAction("reject", "Reason for rejection (optional):")}
        className="text-xs font-medium text-rose-400 hover:text-rose-300 disabled:opacity-50"
      >
        Reject
      </button>
    </div>
  );
}
