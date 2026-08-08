"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function BrokerListingModerationActions({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function act(action: "approve" | "reject" | "archive") {
    setLoading(action);
    await fetch(`/api/admin/broker-listings/${listingId}/moderate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setLoading(null);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <button onClick={() => act("approve")} disabled={!!loading} className="rounded-lg bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-400 hover:bg-emerald-500/25 disabled:opacity-50">
        Approve
      </button>
      <button onClick={() => act("reject")} disabled={!!loading} className="rounded-lg bg-rose-500/15 px-2.5 py-1 text-xs font-medium text-rose-400 hover:bg-rose-500/25 disabled:opacity-50">
        Reject
      </button>
      <button onClick={() => act("archive")} disabled={!!loading} className="rounded-lg bg-navy-700 px-2.5 py-1 text-xs font-medium text-ink-300 hover:text-ink-100 disabled:opacity-50">
        Archive
      </button>
    </div>
  );
}
