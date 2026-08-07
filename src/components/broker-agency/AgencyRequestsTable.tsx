"use client";

import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";

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

interface AgencyRequestRow {
  id: string;
  request_id: string;
  status: string;
  property_type: string;
  bedrooms: string | null;
  budget_min: number | null;
  budget_max: number | null;
  created_at: string;
  projects: { name: string } | null;
  developers: { name: string } | null;
  salespersons: { full_name: string } | null;
}

// Read-only, mirroring BrokerRequestsTable's shape minus the client-link
// column -- agency_property_requests deliberately has no client_id (see
// patch_68), and status transitions are salesperson/developer-owned, same
// as the broker version.
export function AgencyRequestsTable({ requests }: { requests: AgencyRequestRow[] }) {
  return (
    <DataTable
      columns={[
        { header: "Request", render: (r) => <span className="font-mono text-xs text-ink-300">{r.request_id}</span> },
        { header: "Project", render: (r) => r.projects?.name ?? "—" },
        { header: "Developer", render: (r) => r.developers?.name ?? "—" },
        { header: "Salesperson", render: (r) => r.salespersons?.full_name ?? "—" },
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
          render: (r) => <Badge tone={statusTone[r.status] ?? "neutral"}>{r.status.replace(/_/g, " ")}</Badge>,
        },
        { header: "Date", render: (r) => new Date(r.created_at).toLocaleDateString() },
      ]}
      rows={requests}
    />
  );
}
