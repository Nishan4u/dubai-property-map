"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RevokeGrantButton({ grantId }: { grantId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRevoke() {
    if (!window.confirm("Revoke this free subscription grant?")) return;
    setLoading(true);
    await fetch("/api/admin/subscriptions/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grantId }),
    });
    router.refresh();
    setLoading(false);
  }

  return (
    <button disabled={loading} onClick={handleRevoke} className="text-xs font-medium text-rose-400 hover:text-rose-300 disabled:opacity-50">
      Revoke
    </button>
  );
}
