import { AdRequestSection } from "@/components/dashboard/AdRequestSection";
import { FeatureProjectSection } from "@/components/dashboard/FeatureProjectSection";
import {
  getAdPlacementsForDeveloper,
  getCommunities,
  getProjectsForDeveloper,
  requireDeveloperProfile,
} from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function DeveloperPackagesPage() {
  const profile = await requireDeveloperProfile();
  const developerId = profile.developer_id;

  const [placements, projects, communities] = await Promise.all([
    getAdPlacementsForDeveloper(developerId),
    getProjectsForDeveloper(developerId),
    getCommunities(),
  ]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Marketing & Promotion</h1>
        <p className="text-sm text-ink-400">Feature your projects and place ads to reach more buyers.</p>
      </div>

      <FeatureProjectSection
        projects={projects.map((p) => ({
          id: p.id,
          name: p.name,
          status: p.status,
          featured: p.featured,
          featured_until: p.featured_until,
        }))}
      />

      <AdRequestSection
        placements={placements}
        projects={projects.map((p) => ({ id: p.id, name: p.name }))}
        communities={communities.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
