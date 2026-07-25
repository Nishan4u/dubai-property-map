"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function EmailLogActions({ logId }: { logId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<"sent" | "failed" | null>(null);

  async function handleResend() {
    setLoading(true);
    setResult(null);
    const res = await fetch(`/api/admin/email-logs/${logId}/resend`, { method: "POST" });
    const data = await res.json();
    setResult(data.ok ? "sent" : "failed");
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        disabled={loading}
        onClick={handleResend}
        className="text-xs font-medium text-gold-400 hover:text-gold-300 disabled:opacity-50"
      >
        {loading ? "Sending…" : "Resend"}
      </button>
      {result === "sent" && <span className="text-xs text-emerald-400">Sent</span>}
      {result === "failed" && <span className="text-xs text-rose-400">Failed</span>}
    </div>
  );
}
