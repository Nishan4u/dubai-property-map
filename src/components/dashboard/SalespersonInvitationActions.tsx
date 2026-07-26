"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SalespersonInvitationActions({ invitationId }: { invitationId: string | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function resend() {
    if (!invitationId) return;
    setLoading(true);
    await fetch(`/api/invitations/${invitationId}/resend`, { method: "POST" });
    router.refresh();
    setLoading(false);
  }

  async function cancel() {
    if (!invitationId || !window.confirm("Cancel this invitation?")) return;
    setLoading(true);
    await fetch(`/api/invitations/${invitationId}/cancel`, { method: "POST" });
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-3">
      <button disabled={loading} onClick={resend} className="text-xs font-medium text-gold-400 hover:text-gold-300 disabled:opacity-50">
        Resend
      </button>
      <button disabled={loading} onClick={cancel} className="text-xs font-medium text-rose-400 hover:text-rose-300 disabled:opacity-50">
        Cancel
      </button>
    </div>
  );
}
