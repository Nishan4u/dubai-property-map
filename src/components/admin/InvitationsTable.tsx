"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";

interface InvitationRow {
  id: string;
  email: string;
  role: string | null;
  status: "pending" | "sent" | "accepted" | "expired" | "failed" | "cancelled";
  sent_at: string | null;
  accepted_at: string | null;
  created_at: string;
  developers?: { name: string } | { name: string }[] | null;
}

const statusTone: Record<InvitationRow["status"], "green" | "gold" | "red" | "neutral"> = {
  pending: "gold",
  sent: "gold",
  accepted: "green",
  expired: "red",
  failed: "red",
  cancelled: "neutral",
};

export function InvitationsTable({ invitations, showDeveloper = false }: { invitations: InvitationRow[]; showDeveloper?: boolean }) {
  const router = useRouter();
  const [actioningId, setActioningId] = useState<string | null>(null);

  async function resend(id: string) {
    setActioningId(id);
    await fetch(`/api/invitations/${id}/resend`, { method: "POST" });
    router.refresh();
    setActioningId(null);
  }

  async function cancel(id: string) {
    if (!window.confirm("Cancel this invitation?")) return;
    setActioningId(id);
    await fetch(`/api/invitations/${id}/cancel`, { method: "POST" });
    router.refresh();
    setActioningId(null);
  }

  if (invitations.length === 0) {
    return <p className="text-xs text-ink-500">No invitations sent yet.</p>;
  }

  return (
    <DataTable
      columns={[
        { header: "Email", render: (i) => i.email },
        ...(showDeveloper
          ? [
              {
                header: "Developer",
                render: (i: InvitationRow) => (Array.isArray(i.developers) ? i.developers[0]?.name : i.developers?.name) ?? "—",
              },
            ]
          : []),
        { header: "Role", render: (i) => i.role ?? "—" },
        { header: "Sent Date", render: (i) => (i.sent_at ? new Date(i.sent_at).toLocaleDateString() : "—") },
        { header: "Delivery / Invitation Status", render: (i) => <Badge tone={statusTone[i.status]}>{i.status}</Badge> },
        { header: "Accepted Date", render: (i) => (i.accepted_at ? new Date(i.accepted_at).toLocaleDateString() : "—") },
        {
          header: "",
          render: (i) =>
            i.status === "sent" || i.status === "failed" || i.status === "expired" || i.status === "pending" ? (
              <div className="flex gap-3">
                <button
                  disabled={actioningId === i.id}
                  onClick={() => resend(i.id)}
                  className="text-xs font-medium text-gold-400 hover:text-gold-300 disabled:opacity-50"
                >
                  Resend
                </button>
                <button
                  disabled={actioningId === i.id}
                  onClick={() => cancel(i.id)}
                  className="text-xs font-medium text-rose-400 hover:text-rose-300 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            ) : null,
        },
      ]}
      rows={invitations}
    />
  );
}
