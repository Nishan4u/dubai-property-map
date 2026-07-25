import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { AdminLeadsExportButton } from "@/components/admin/AdminLeadsExportButton";
import { getAllLeadsAdmin } from "@/lib/supabase/queries";
import type { DbLeadStatus } from "@/types/database";

export const dynamic = "force-dynamic";

const statusTone: Record<DbLeadStatus, "gold" | "blue" | "green" | "neutral" | "red"> = {
  new: "gold",
  contacted: "blue",
  qualified: "green",
  won: "green",
  lost: "red",
};

export default async function AdminLeadsPage() {
  const leads = await getAllLeadsAdmin();

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink-100">All Leads</h1>
          <p className="text-sm text-ink-400">
            Aggregated leads across every developer on the platform.
          </p>
        </div>
        <AdminLeadsExportButton leads={leads} />
      </div>

      <DataTable
        columns={[
          { header: "Name", render: (l) => <span className="font-medium text-ink-100">{l.name}</span> },
          { header: "Country", render: (l) => l.country ?? "—" },
          { header: "Project", render: (l) => l.projects?.name ?? "—" },
          { header: "Source", render: (l) => l.source },
          { header: "Status", render: (l) => <Badge tone={statusTone[l.status as DbLeadStatus]}>{l.status}</Badge> },
          { header: "Date", render: (l) => new Date(l.created_at).toLocaleDateString() },
        ]}
        rows={leads}
      />
    </div>
  );
}
