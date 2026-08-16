import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";
import { DeveloperProjectsTable } from "@/components/dashboard/DeveloperProjectsTable";
import { getProjectsForDeveloper, requireDeveloperProfile } from "@/lib/supabase/queries";
import { mapProject } from "@/lib/supabase/mappers";

export const dynamic = "force-dynamic";

export default async function DeveloperProjectsPage() {
  const profile = await requireDeveloperProfile();
  const rows = await getProjectsForDeveloper(profile.developer_id);
  const projects = rows.map((r) => mapProject(r));

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink-100">Projects</h1>
          <p className="text-sm text-ink-400">
            Manage all your listed developments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/projects/upload"
            className="flex items-center gap-2 rounded-lg border border-navy-600 px-4 py-2 text-sm font-medium text-ink-200 hover:text-ink-100"
          >
            <Sparkles className="h-4 w-4" /> Upload Brochure
          </Link>
          <Link
            href="/dashboard/projects/new"
            className="flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400"
          >
            <Plus className="h-4 w-4" /> Add Project
          </Link>
        </div>
      </div>

      <DeveloperProjectsTable projects={projects} />
    </div>
  );
}
