import { DataTable } from "@/components/ui/DataTable";
import { getAuditLog } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function AdminAuditLogPage() {
  const entries = await getAuditLog();

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Audit Log</h1>
        <p className="text-sm text-ink-400">
          A record of admin actions — approvals, rejections, deletions and
          content changes made from the Super Admin Panel.
        </p>
      </div>

      <DataTable
        columns={[
          {
            header: "When",
            render: (e) => new Date(e.created_at).toLocaleString(),
          },
          { header: "Admin", render: (e) => e.actor_email ?? "—" },
          { header: "Action", render: (e) => <span className="font-medium text-ink-100">{e.action}</span> },
          { header: "Entity", render: (e) => `${e.entity_type}${e.entity_id ? ` (${e.entity_id.slice(0, 8)}…)` : ""}` },
          {
            header: "Details",
            render: (e) =>
              Object.keys(e.details ?? {}).length > 0 ? (
                <span className="text-xs text-ink-400">{JSON.stringify(e.details)}</span>
              ) : (
                "—"
              ),
          },
        ]}
        rows={entries}
      />
      {entries.length === 0 && (
        <p className="text-sm text-ink-500">
          No actions logged yet — approve a project, suspend a developer, or
          edit a community to see entries appear here.
        </p>
      )}
    </div>
  );
}
