"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { logAudit } from "@/lib/auditLog";
import { notifyDeveloperTeam } from "@/lib/notify";

const statusMessage: Record<"active" | "rejected" | "expired", (title: string) => string> = {
  active: (title) => `Your ad placement "${title}" has been approved and is now live.`,
  rejected: (title) => `Your ad placement "${title}" was rejected.`,
  expired: (title) => `Your ad placement "${title}" has expired.`,
};

export function AdPlacementActions({
  id,
  title,
  developerId,
}: {
  id: string;
  title: string;
  developerId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function updateStatus(status: "active" | "rejected" | "expired") {
    setLoading(true);
    const supabase = createClient();
    await supabase.from("ad_placements").update({ status }).eq("id", id);
    await logAudit(`ad_placement.${status}`, "ad_placement", id);
    await notifyDeveloperTeam(developerId, statusMessage[status](title));
    router.refresh();
    setLoading(false);
  }

  async function handleDelete() {
    if (!window.confirm(`Permanently delete the ad placement "${title}"? This cannot be undone.`)) return;
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("ad_placements").delete().eq("id", id);
    if (error) {
      window.alert("Failed to delete ad placement.");
      setLoading(false);
      return;
    }
    await logAudit("ad_placement.delete", "ad_placement", id);
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="flex gap-2">
      <button
        disabled={loading}
        onClick={() => updateStatus("active")}
        className="text-xs font-medium text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
      >
        Approve
      </button>
      <button
        disabled={loading}
        onClick={() => updateStatus("rejected")}
        className="text-xs font-medium text-rose-400 hover:text-rose-300 disabled:opacity-50"
      >
        Reject
      </button>
      <button
        disabled={loading}
        onClick={() => updateStatus("expired")}
        className="text-xs font-medium text-ink-400 hover:text-ink-200 disabled:opacity-50"
      >
        Expire
      </button>
      <button
        disabled={loading}
        onClick={handleDelete}
        className="text-xs font-medium text-rose-500 hover:text-rose-400 disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}
