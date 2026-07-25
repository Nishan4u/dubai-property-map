import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { DeveloperStatusActions } from "@/components/admin/DeveloperStatusActions";
import { CreateDeveloperForm } from "@/components/admin/CreateDeveloperForm";
import { DeleteDeveloperButton } from "@/components/admin/DeleteDeveloperButton";
import { getAllDevelopersAdmin, getAllProjectsAdmin } from "@/lib/supabase/queries";
import type { DeveloperStatus } from "@/types/database";

export const dynamic = "force-dynamic";

const statusTone: Record<DeveloperStatus, "green" | "gold" | "red"> = {
  active: "green",
  pending: "gold",
  suspended: "red",
};

export default async function AdminDevelopersPage() {
  const [developers, projects] = await Promise.all([
    getAllDevelopersAdmin(),
    getAllProjectsAdmin(),
  ]);

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Developers</h1>
        <p className="text-sm text-ink-400">
          {developers.length} developers registered on the platform.
        </p>
      </div>

      <CreateDeveloperForm />

      <DataTable
        columns={[
          {
            header: "Developer",
            render: (d) => (
              <Link
                href={`/admin/developers/${d.id}`}
                className="flex items-center gap-2 font-medium text-ink-100 hover:text-gold-400"
              >
                {d.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={d.logo_url}
                    alt={d.name}
                    className="h-6 w-6 shrink-0 rounded-full object-contain"
                  />
                ) : (
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ background: d.color }}
                  >
                    {d.initial}
                  </span>
                )}
                {d.name}
                {d.verified && <BadgeCheck className="h-3.5 w-3.5 text-sky-400" />}
              </Link>
            ),
          },
          {
            header: "Projects",
            render: (d) => projects.filter((p) => p.developer_id === d.id).length,
          },
          { header: "Founded", render: (d) => d.founded ?? "—" },
          {
            header: "Status",
            render: (d) => <Badge tone={statusTone[d.status as DeveloperStatus]}>{d.status}</Badge>,
          },
          {
            header: "",
            render: (d) => (
              <div className="flex items-center gap-3">
                <DeveloperStatusActions developerId={d.id} status={d.status} />
                <Link
                  href={`/admin/developers/${d.id}`}
                  className="text-xs font-medium text-gold-400 hover:text-gold-300"
                >
                  View →
                </Link>
                <DeleteDeveloperButton developerId={d.id} developerName={d.name} />
              </div>
            ),
          },
        ]}
        rows={developers}
      />
    </div>
  );
}
