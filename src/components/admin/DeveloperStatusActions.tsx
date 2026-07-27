"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notifyDeveloperTeam } from "@/lib/notify";
import type { DeveloperStatus } from "@/types/database";

const statusMessage: Record<DeveloperStatus, string> = {
  active: "Your developer account has been approved. You can now publish projects.",
  suspended: "Your developer account has been suspended. Contact support for details.",
  pending: "Your developer account is pending approval.",
};

export function DeveloperStatusActions({
  developerId,
  status,
}: {
  developerId: string;
  status: DeveloperStatus;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function updateStatus(next: "active" | "suspended", verified?: boolean) {
    setLoading(true);
    await fetch(`/api/admin/developers/${developerId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: next, verified }),
    });
    await notifyDeveloperTeam(developerId, statusMessage[next]);
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="flex gap-2">
      {status !== "active" && (
        <button
          disabled={loading}
          onClick={() => updateStatus("active", true)}
          className="text-xs font-medium text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
        >
          Approve
        </button>
      )}
      {status !== "suspended" && (
        <button
          disabled={loading}
          onClick={() => updateStatus("suspended")}
          className="text-xs font-medium text-rose-400 hover:text-rose-300 disabled:opacity-50"
        >
          Suspend
        </button>
      )}
      {status === "suspended" && (
        <button
          disabled={loading}
          onClick={() => updateStatus("active")}
          className="text-xs font-medium text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
        >
          Reinstate
        </button>
      )}
    </div>
  );
}
