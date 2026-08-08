import { UpcomingProjectsManager } from "@/components/dashboard/UpcomingProjectsManager";
import {
  getUpcomingProjectInterestsForDeveloper,
  getUpcomingProjectsForDeveloper,
  requireDeveloperProfile,
} from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function UpcomingProjectsPage() {
  const profile = await requireDeveloperProfile();
  const [upcomingProjects, interests] = await Promise.all([
    getUpcomingProjectsForDeveloper(profile.developer_id),
    getUpcomingProjectInterestsForDeveloper(profile.developer_id),
  ]);

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Upcoming Projects</h1>
        <p className="text-sm text-ink-400">
          Pre-publish a &quot;Coming Soon&quot; pin on the public map before a
          project&apos;s full listing is ready. When you create the real
          project, link it to one of these to auto-hide the pin and carry
          the location and logo over.
        </p>
      </div>

      <UpcomingProjectsManager
        developerId={profile.developer_id}
        initialUpcomingProjects={upcomingProjects}
        interests={interests}
      />
    </div>
  );
}
