import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProjectForm } from "@/components/dashboard/ProjectForm";
import {
  getAmenitiesList,
  getCommunities,
  getPropertyTypes,
  requireDeveloperProfile,
} from "@/lib/supabase/queries";
import { mapCommunity, mapProject } from "@/lib/supabase/mappers";
import type { ProjectWithRelations } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: row }, profile, communityRows, { data: milestones }, propertyTypes, amenities] =
    await Promise.all([
      supabase
        .from("projects")
        .select("*, developers(*), communities(*)")
        .eq("id", id)
        .maybeSingle(),
      requireDeveloperProfile(),
      getCommunities(),
      supabase
        .from("construction_milestones")
        .select("*")
        .eq("project_id", id)
        .order("milestone_date", { ascending: true }),
      getPropertyTypes(),
      getAmenitiesList(),
    ]);

  if (!row) notFound();

  const project = mapProject(row as ProjectWithRelations);
  const communities = communityRows.map((c) => mapCommunity(c));

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">{project.name}</h1>
        <p className="text-sm text-ink-400">Edit project details.</p>
      </div>
      <ProjectForm
        project={project}
        developerId={profile.developer_id}
        communities={communities}
        constructionMilestones={milestones ?? []}
        propertyTypes={propertyTypes.map((p) => p.name)}
        amenityOptions={amenities.map((a) => a.name)}
      />
    </div>
  );
}
