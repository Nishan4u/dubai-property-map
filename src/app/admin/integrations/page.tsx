import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { getAllCrmIntegrationsAdmin } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function AdminIntegrationsPage() {
  const integrations = await getAllCrmIntegrationsAdmin();

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">CRM Integrations</h1>
        <p className="text-sm text-ink-400">
          Read-only oversight of every broker/salesperson/developer/broker-agency-connected CRM webhook and feed.
          Owners manage their own integrations from their portal — nothing here is editable.
        </p>
      </div>

      <DataTable
        columns={[
          { header: "Name", render: (i) => <span className="font-medium text-ink-100">{i.name}</span> },
          {
            header: "Owner",
            render: (i) => i.brokers?.full_name ?? i.salespersons?.full_name ?? i.developers?.name ?? i.brokerages?.name ?? "—",
          },
          { header: "Type", render: (i) => <Badge tone="blue">{i.owner_type}</Badge> },
          { header: "Events", render: (i) => i.events.join(", ") },
          {
            header: "Status",
            render: (i) => <Badge tone={i.status === "active" ? "green" : "neutral"}>{i.status}</Badge>,
          },
          { header: "Created", render: (i) => new Date(i.created_at).toLocaleDateString() },
        ]}
        rows={integrations}
      />
      {integrations.length === 0 && <p className="text-sm text-ink-500">No integrations connected yet.</p>}
    </div>
  );
}
