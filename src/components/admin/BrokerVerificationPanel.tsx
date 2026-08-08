"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import type { DbBrokerVerificationStatus } from "@/types/database";

const tone: Record<DbBrokerVerificationStatus, "neutral" | "gold" | "green" | "red"> = {
  none: "neutral",
  pending_payment: "gold",
  active: "green",
  rejected: "red",
  revoked: "red",
  expired: "gold",
};

export function BrokerVerificationPanel({
  brokerId,
  verificationStatus,
  verificationExpiresAt,
  featured,
}: {
  brokerId: string;
  verificationStatus: DbBrokerVerificationStatus;
  verificationExpiresAt: string | null;
  featured: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function act(action: "approve" | "reject" | "renew" | "revoke" | "feature" | "unfeature") {
    setLoading(action);
    await fetch(`/api/admin/brokers/${brokerId}/verification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setLoading(null);
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-navy-700 bg-navy-850 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink-100">Verified Broker Status</h2>
        <Badge tone={tone[verificationStatus]}>{verificationStatus.replace("_", " ")}</Badge>
      </div>
      {verificationExpiresAt && (
        <p className="mt-1 text-xs text-ink-500">Expires {new Date(verificationExpiresAt).toLocaleDateString()}</p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={() => act("approve")} disabled={!!loading} className="rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/25 disabled:opacity-50">
          {loading === "approve" ? "…" : "Approve"}
        </button>
        <button onClick={() => act("reject")} disabled={!!loading} className="rounded-lg bg-rose-500/15 px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/25 disabled:opacity-50">
          {loading === "reject" ? "…" : "Reject"}
        </button>
        <button onClick={() => act("renew")} disabled={!!loading} className="rounded-lg bg-sky-500/15 px-3 py-1.5 text-xs font-medium text-sky-400 hover:bg-sky-500/25 disabled:opacity-50">
          {loading === "renew" ? "…" : "Renew (+1 year)"}
        </button>
        <button onClick={() => act("revoke")} disabled={!!loading} className="rounded-lg bg-navy-700 px-3 py-1.5 text-xs font-medium text-ink-300 hover:text-ink-100 disabled:opacity-50">
          {loading === "revoke" ? "…" : "Revoke"}
        </button>
        <button
          onClick={() => act(featured ? "unfeature" : "feature")}
          disabled={!!loading}
          className="rounded-lg bg-gold-500/15 px-3 py-1.5 text-xs font-medium text-gold-400 hover:bg-gold-500/25 disabled:opacity-50"
        >
          {loading === "feature" || loading === "unfeature" ? "…" : featured ? "Unfeature" : "Feature Broker"}
        </button>
      </div>
    </div>
  );
}
