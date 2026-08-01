import { notFound } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { DeveloperStatusActions } from "@/components/admin/DeveloperStatusActions";
import { EditDeveloperForm } from "@/components/admin/EditDeveloperForm";
import { DeleteDeveloperButton } from "@/components/admin/DeleteDeveloperButton";
import { createClient } from "@/lib/supabase/server";
import { getProjectsForDeveloper } from "@/lib/supabase/queries";
import { mapProject, currentYear } from "@/lib/supabase/mappers";
import type { DeveloperRow } from "@/types/database";
import type { ApprovalStatus, ProjectStatus } from "@/types";

export const dynamic = "force-dynamic";

const statusTone: Record<ProjectStatus, "neutral" | "green" | "gold" | "red" | "purple"> = {
  draft: "neutral",
  published: "green",
  featured: "purple",
  expired: "gold",
  rejected: "red",
  archived: "neutral",
};

const approvalTone: Record<ApprovalStatus, "gold" | "blue" | "green" | "red"> = {
  pending: "gold",
  review: "blue",
  approved: "green",
  rejected: "red",
};

export default async function AdminDeveloperDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: developer } = await supabase
    .from("developers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!developer) notFound();

  const devProjectRows = await getProjectsForDeveloper(developer.id);
  const devProjects = devProjectRows.map((p) => mapProject(p));
  const completedCount = devProjectRows.filter(
    (p) => (p.handover_year ?? currentYear()) < currentYear()
  ).length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-navy-700 bg-navy-850 p-5">
        <div className="flex items-center gap-4">
          {developer.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={developer.logo_url}
              alt={developer.name}
              className="h-14 w-14 shrink-0 rounded-2xl border border-navy-700 bg-navy-900 object-contain p-1.5"
            />
          ) : (
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white"
              style={{ background: developer.color }}
            >
              {developer.initial}
            </div>
          )}
          <div>
            <h1 className="flex items-center gap-2 text-lg font-bold text-ink-100">
              {developer.name}
              {developer.verified && <BadgeCheck className="h-4 w-4 text-sky-400" />}
            </h1>
            {developer.founded && (
              <p className="text-xs text-ink-500">Since {developer.founded}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <DeveloperStatusActions developerId={developer.id} status={developer.status} />
          <DeleteDeveloperButton
            developerId={developer.id}
            developerName={developer.name}
            redirectTo="/admin/developers"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MiniStat label="Total Projects" value={devProjectRows.length} />
        <MiniStat label="Completed" value={completedCount} />
        <MiniStat label="Under Construction" value={devProjectRows.length - completedCount} />
        <MiniStat label="Status" value={developer.status} isText />
      </div>

      <EditDeveloperForm developer={developer as DeveloperRow} />

      <div>
        <h2 className="mb-3 text-lg font-semibold text-ink-100">Projects</h2>
        <DataTable
          columns={[
            { header: "Project", render: (p) => <span className="font-medium text-ink-100">{p.name}</span> },
            { header: "Status", render: (p) => <Badge tone={statusTone[p.status]}>{p.status}</Badge> },
            { header: "Approval", render: (p) => <Badge tone={approvalTone[p.approvalStatus]}>{p.approvalStatus}</Badge> },
            { header: "Views", render: (p) => p.views.toLocaleString() },
          ]}
          rows={devProjects}
        />
        {devProjects.length === 0 && (
          <p className="mt-3 text-sm text-ink-500">No projects yet.</p>
        )}
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  isText,
}: {
  label: string;
  value: string | number;
  isText?: boolean;
}) {
  return (
    <div className="rounded-xl border border-navy-700 bg-navy-850 p-4">
      <p className="text-xs text-ink-400">{label}</p>
      <p className={`mt-1 font-semibold text-ink-100 capitalize ${isText ? "text-sm" : "text-xl"}`}>
        {value}
      </p>
    </div>
  );
}
