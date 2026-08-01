import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { PropertyRequestsFilterBar } from "@/components/admin/PropertyRequestsFilterBar";
import { createClient } from "@/lib/supabase/server";
import { getAllDevelopersAdmin } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

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

export default async function AdminPropertyRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ developer?: string; status?: string }>;
}) {
  const { developer: developerFilter, status: statusFilter } = await searchParams;
  const supabase = await createClient();
  const developers = await getAllDevelopersAdmin();

  let query = supabase
    .from("property_requests")
    .select("*, brokers(full_name), salespersons(full_name), developers(name), projects(name)")
    .order("created_at", { ascending: false });

  if (developerFilter) query = query.eq("developer_id", developerFilter);
  if (statusFilter) query = query.eq("status", statusFilter);

  const { data: requests } = await query;

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Property Requests</h1>
        <p className="text-sm text-ink-400">Every broker property request across the platform. Client identity is never collected or shown.</p>
      </div>

      <PropertyRequestsFilterBar developers={developers} statuses={Object.keys(statusTone)} />

      <DataTable
        columns={[
          { header: "Request", render: (r) => <span className="font-mono text-xs text-ink-300">{r.request_id}</span> },
          { header: "Broker", render: (r) => r.brokers?.full_name ?? "—" },
          { header: "Developer", render: (r) => r.developers?.name ?? "—" },
          { header: "Salesperson", render: (r) => r.salespersons?.full_name ?? "—" },
          { header: "Project", render: (r) => r.projects?.name ?? "—" },
          {
            header: "Status",
            render: (r) => <Badge tone={statusTone[r.status] ?? "neutral"}>{r.status.replace(/_/g, " ")}</Badge>,
          },
          { header: "Budget", render: (r) => (r.budget_min || r.budget_max ? `AED ${r.budget_min?.toLocaleString() ?? "—"}–${r.budget_max?.toLocaleString() ?? "—"}` : "—") },
          { header: "Date", render: (r) => new Date(r.created_at).toLocaleDateString() },
        ]}
        rows={requests ?? []}
      />
    </div>
  );
}
