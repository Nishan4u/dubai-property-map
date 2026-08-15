import { PublicShell } from "@/components/public/PublicShell";
import { AllProjectsClient } from "@/components/public/AllProjectsClient";
import {
  getActiveProjectsInFeedBanner,
  getCommunities,
  getDevelopers,
  getMapAccessStatus,
  getPublishedProjects,
  getSalespersonDeveloperAccess,
  getViewerProjectScope,
} from "@/lib/supabase/queries";
import { mapCommunity, mapDeveloper, mapProject } from "@/lib/supabase/mappers";
import { isAdsEnabled } from "@/lib/adsEnabled";
import { buildOpenGraph } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const title = "All Projects | Dubai Property Map";
  const description = "Search and filter every off-plan and ready project on Dubai Property Map.";
  return {
    title,
    description,
    alternates: { canonical: "/projects" },
    openGraph: buildOpenGraph({ title, description, url: "/projects" }),
  };
}

export default async function AllProjectsPage() {
  // Same rules as the map/homepage (spec sections 17-19): a logged-in
  // Developer/Salesperson only ever sees their own developer's projects
  // here, and the real project data is withheld server-side entirely for
  // guests/unsubscribed brokers-salespersons-agencies rather than just
  // visually blurred.
  const viewerDeveloperId = await getViewerProjectScope();
  const { status: mapAccessStatus, subscriptionHref } = await getMapAccessStatus();
  const { blocked: developerInactiveForSalesperson } = await getSalespersonDeveloperAccess();

  const [communityRows, developerRows, projectRows, adsEnabled, inFeedBanner] = await Promise.all([
    getCommunities(),
    getDevelopers(),
    mapAccessStatus === "ok" && !developerInactiveForSalesperson
      ? getPublishedProjects(viewerDeveloperId ?? undefined)
      : Promise.resolve([]),
    isAdsEnabled(),
    getActiveProjectsInFeedBanner(),
  ]);

  return (
    <PublicShell>
      <AllProjectsClient
        projects={projectRows.map((p) => mapProject(p))}
        developers={developerRows.map((d) => mapDeveloper(d))}
        communities={communityRows.map((c) => mapCommunity(c))}
        mapAccessStatus={mapAccessStatus}
        subscriptionHref={subscriptionHref}
        viewerDeveloperId={viewerDeveloperId}
        adsEnabled={adsEnabled}
        inFeedBanner={
          inFeedBanner
            ? {
                id: inFeedBanner.id,
                title: inFeedBanner.title,
                targetUrl: inFeedBanner.target_url,
                developerName: inFeedBanner.developers?.name,
                imageUrl: inFeedBanner.image_url,
              }
            : null
        }
      />
    </PublicShell>
  );
}
