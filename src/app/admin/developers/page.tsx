import { DevelopersTable } from "@/components/admin/DevelopersTable";
import { CreateDeveloperForm } from "@/components/admin/CreateDeveloperForm";
import { getAllDevelopersAdmin, getAllProjectsAdmin } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function AdminDevelopersPage() {
  const [developers, projects] = await Promise.all([
    getAllDevelopersAdmin(),
    getAllProjectsAdmin(),
  ]);

  const developersWithCounts = developers.map((d) => ({
    ...d,
    projectCount: projects.filter((p) => p.developer_id === d.id).length,
  }));

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Developers</h1>
        <p className="text-sm text-ink-400">
          {developers.length} developers registered on the platform.
        </p>
      </div>

      <CreateDeveloperForm />

      <DevelopersTable developers={developersWithCounts} />
    </div>
  );
}
