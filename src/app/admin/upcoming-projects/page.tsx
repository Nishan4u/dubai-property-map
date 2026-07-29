import { Badge } from "@/components/ui/Badge";
import { DeleteUpcomingProjectButton } from "@/components/admin/DeleteUpcomingProjectButton";
import { getAllUpcomingProjectsAdmin } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function AdminUpcomingProjectsPage() {
  const upcomingProjects = await getAllUpcomingProjectsAdmin();

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Upcoming Projects</h1>
        <p className="text-sm text-ink-400">
          &quot;Coming Soon&quot; pins across all developers. Internal names
          are visible here to Admin only — the public map never shows them.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-navy-700">
        <table className="w-full text-left text-sm">
          <thead className="bg-navy-850 text-xs uppercase tracking-wide text-ink-500">
            <tr>
              <th className="px-4 py-3">Internal Name</th>
              <th className="px-4 py-3">Developer</th>
              <th className="px-4 py-3">Coordinates</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-800">
            {upcomingProjects.map((u) => (
              <tr key={u.id} className="text-ink-200">
                <td className="px-4 py-3 font-medium text-ink-100">{u.internal_name}</td>
                <td className="px-4 py-3 text-ink-400">{u.developers?.name ?? "—"}</td>
                <td className="px-4 py-3 text-xs tabular-nums text-ink-400">
                  {Number(u.lat).toFixed(4)}, {Number(u.lng).toFixed(4)}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={u.status === "active" ? "blue" : "green"}>
                    {u.status === "active" ? "Coming Soon" : "Launched"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-xs text-ink-500">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <DeleteUpcomingProjectButton upcomingProjectId={u.id} internalName={u.internal_name} />
                </td>
              </tr>
            ))}
            {upcomingProjects.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-ink-500">
                  No upcoming projects yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
