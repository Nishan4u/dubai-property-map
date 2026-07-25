import { ProjectForm } from "@/components/dashboard/ProjectForm";
import {
  getAllDevelopersAdmin,
  getAmenitiesList,
  getCommunities,
  getPropertyTypes,
} from "@/lib/supabase/queries";
import { mapCommunity } from "@/lib/supabase/mappers";

export const dynamic = "force-dynamic";

export default async function AdminNewProjectPage() {
  const [developers, communityRows, propertyTypes, amenities] = await Promise.all([
    getAllDevelopersAdmin(),
    getCommunities(),
    getPropertyTypes(),
    getAmenitiesList(),
  ]);
  const communities = communityRows.map((c) => mapCommunity(c));

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Add Project</h1>
        <p className="text-sm text-ink-400">
          Create a project under any developer — it goes live immediately, no
          approval step needed.
        </p>
      </div>
      <ProjectForm
        developerOptions={developers.map((d) => ({ id: d.id, name: d.name }))}
        communities={communities}
        propertyTypes={propertyTypes.map((p) => p.name)}
        amenityOptions={amenities.map((a) => a.name)}
      />
    </div>
  );
}
