"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import type { CrmClientRow } from "@/lib/supabase/queries";

const statusTone: Record<string, "gold" | "blue" | "green" | "red" | "neutral"> = {
  new: "gold",
  broker_contacted: "blue",
  requirement_confirmed: "blue",
  units_shared: "blue",
  viewing_scheduled: "blue",
  negotiation: "blue",
  booking: "green",
  closed_won: "green",
  on_hold: "neutral",
  lost: "red",
  cancelled: "red",
};

interface RequestRow {
  id: string;
  request_id: string;
  status: string;
  property_type: string;
  bedrooms: string | null;
  budget_min: number | null;
  budget_max: number | null;
  client_id: string | null;
  created_at: string;
  projects: { name: string } | null;
  developers: { name: string } | null;
  crm_clients: { id: string; full_name: string; phone: string | null; email: string | null } | null;
}

// Brokers can't change status here (property_requests gives them no UPDATE
// policy at all -- see patch_35 -- status transitions are deliberately
// salesperson/developer-owned), so status renders as a read-only badge.
// The only write this table does is linking a client, via the narrow
// service-role route since RLS can't scope that column-by-column.
export function BrokerRequestsTable({ requests, clients }: { requests: RequestRow[]; clients: CrmClientRow[] }) {
  const router = useRouter();
  const [savingId, setSavingId] = useState<string | null>(null);

  async function handleClientChange(request: RequestRow, nextClientId: string) {
    setSavingId(request.id);
    await fetch(`/api/broker/property-requests/${request.id}/client`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: nextClientId || null }),
    });
    router.refresh();
    setSavingId(null);
  }

  return (
    <DataTable
      columns={[
        { header: "Request", render: (r) => <span className="font-mono text-xs text-ink-300">{r.request_id}</span> },
        { header: "Project", render: (r) => r.projects?.name ?? "—" },
        { header: "Developer", render: (r) => r.developers?.name ?? "—" },
        {
          header: "Requirement",
          render: (r) => (
            <span className="text-xs text-ink-400">
              {r.property_type} · {r.bedrooms ?? "—"}
              {r.budget_min || r.budget_max ? (
                <>
                  {" "}
                  · AED {r.budget_min?.toLocaleString() ?? "—"}–{r.budget_max?.toLocaleString() ?? "—"}
                </>
              ) : null}
            </span>
          ),
        },
        {
          header: "Status",
          render: (r) => (
            <Badge tone={statusTone[r.status] ?? "neutral"}>
              {r.status.replace(/_/g, " ")}
            </Badge>
          ),
        },
        {
          header: "Client",
          render: (r) => (
            <select
              disabled={savingId === r.id}
              value={r.client_id ?? ""}
              onChange={(e) => handleClientChange(r, e.target.value)}
              className="rounded-md border border-navy-600 bg-navy-800 px-1.5 py-1 text-[11px] text-ink-300 focus:outline-none"
            >
              <option value="">Unlinked</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </select>
          ),
        },
        { header: "Date", render: (r) => new Date(r.created_at).toLocaleDateString() },
      ]}
      rows={requests}
    />
  );
}
