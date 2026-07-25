import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
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

      <form className="flex flex-wrap items-end gap-3 rounded-xl border border-navy-700 bg-navy-850 p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-400">Developer</label>
          <select
            name="developer"
            defaultValue={developerFilter ?? ""}
            className="rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
          >
            <option value="">All Developers</option>
            {developers.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-400">Status</label>
          <select
            name="status"
            defaultValue={statusFilter ?? ""}
            className="rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
          >
            <option value="">All Statuses</option>
            {Object.keys(statusTone).map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400">
          Filter
        </button>
      </form>

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
