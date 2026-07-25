import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminProjectsTable } from "@/components/admin/AdminProjectsTable";
import { getAllProjectsAdmin } from "@/lib/supabase/queries";
import { mapProject } from "@/lib/supabase/mappers";

export const dynamic = "force-dynamic";

export default async function AdminProjectsPage() {
  const rows = await getAllProjectsAdmin();
  const projects = rows.map((r) => mapProject(r));

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-100">Projects</h1>
          <p className="text-sm text-ink-400">
            Review new and updated project listings, or add one under any developer.
          </p>
        </div>
        <Link
          href="/admin/projects/new"
          className="flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400"
        >
          <Plus className="h-4 w-4" />
          Add Project
        </Link>
      </div>

      <AdminProjectsTable projects={projects} />
    </div>
  );
}
