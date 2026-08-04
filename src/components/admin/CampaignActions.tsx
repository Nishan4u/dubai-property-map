"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { logAudit } from "@/lib/auditLog";

export function CampaignActions({ id, name, status }: { id: string; name: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    if (!window.confirm(`Send "${name}" now? This delivers immediately to every matching CRM client and can't be undone.`)) return;
    setLoading(true);
    const res = await fetch(`/api/admin/campaigns/${id}/send`, { method: "POST" });
    const body = await res.json();
    if (!res.ok) {
      window.alert(`Failed to send: ${body.error}`);
      setLoading(false);
      return;
    }
    await logAudit("marketing_campaign.send", "marketing_campaign", id, body);
    window.alert(`Sent to ${body.recipientCount} recipient(s) — ${body.sentCount} succeeded, ${body.failedCount} failed.`);
    router.refresh();
    setLoading(false);
  }

  async function handleDelete() {
    if (!window.confirm(`Delete the draft campaign "${name}"? This cannot be undone.`)) return;
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("marketing_campaigns").delete().eq("id", id);
    if (error) {
      window.alert("Failed to delete campaign.");
      setLoading(false);
      return;
    }
    await logAudit("marketing_campaign.delete", "marketing_campaign", id);
    router.refresh();
    setLoading(false);
  }

  if (status !== "draft") {
    return <span className="text-xs text-ink-600">—</span>;
  }

  return (
    <div className="flex gap-2">
      <button
        disabled={loading}
        onClick={handleSend}
        className="text-xs font-medium text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
      >
        Send
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
