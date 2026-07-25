import { ProjectForm } from "@/components/dashboard/ProjectForm";
import {
  getAmenitiesList,
  getCommunities,
  getPropertyTypes,
  requireDeveloperProfile,
} from "@/lib/supabase/queries";
import { mapCommunity } from "@/lib/supabase/mappers";

export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
  const [profile, communityRows, propertyTypes, amenities] = await Promise.all([
    requireDeveloperProfile(),
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
          Fill in your project details for review and publishing.
        </p>
      </div>
      <ProjectForm
        developerId={profile.developer_id}
        communities={communities}
        propertyTypes={propertyTypes.map((p) => p.name)}
        amenityOptions={amenities.map((a) => a.name)}
      />
    </div>
  );
}
