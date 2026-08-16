import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProjectForm } from "@/components/dashboard/ProjectForm";
import { DeleteProjectButton } from "@/components/admin/DeleteProjectButton";
import { AiExtractionBanner } from "@/components/dashboard/AiExtractionBanner";
import {
  getAmenitiesList,
  getCommunities,
  getLatestProjectAiExtraction,
  getPropertyTypes,
} from "@/lib/supabase/queries";
import { mapCommunity, mapProject } from "@/lib/supabase/mappers";
import type { ProjectWithRelations } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function AdminEditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: row }, communityRows, { data: milestones }, { data: unitTypeRows }, propertyTypes, amenities, extraction] =
    await Promise.all([
      supabase
        .from("projects")
        .select("*, developers(*), communities(*)")
        .eq("id", id)
        .maybeSingle(),
      getCommunities(),
      supabase
        .from("construction_milestones")
        .select("*")
        .eq("project_id", id)
        .order("milestone_date", { ascending: true }),
      supabase
        .from("project_unit_types")
        .select("*")
        .eq("project_id", id)
        .order("sort_order", { ascending: true }),
      getPropertyTypes(),
      getAmenitiesList(),
      getLatestProjectAiExtraction(id),
    ]);

  if (!row) notFound();

  const project = mapProject(row as ProjectWithRelations);
  const communities = communityRows.map((c) => mapCommunity(c));

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink-100">{project.name}</h1>
          <p className="text-sm text-ink-400">
            by {project.developerName ?? "—"} — edit project details.
          </p>
        </div>
        <DeleteProjectButton
          projectId={project.id}
          projectName={project.name}
          redirectTo="/admin/projects"
        />
      </div>
      {project.dataSource === "ai_extracted" && extraction && <AiExtractionBanner extraction={extraction} />}
      <ProjectForm
        project={project}
        communities={communities}
        constructionMilestones={milestones ?? []}
        unitTypeRows={unitTypeRows ?? []}
        propertyTypes={propertyTypes.map((p) => p.name)}
        amenityOptions={amenities.map((a) => a.name)}
      />
    </div>
  );
}
