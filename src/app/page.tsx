import { HomeClient } from "@/components/public/HomeClient";
import {
  getActiveHomepageBanner,
  getActiveSidebarBanner,
  getActiveSponsoredPinProjectIds,
  getCommunities,
  getDevelopers,
  getNavLinks,
  getPublishedProjects,
  getViewerProjectScope,
} from "@/lib/supabase/queries";
import { mapCommunity, mapDeveloper, mapProject } from "@/lib/supabase/mappers";
import { getCmsMetadata } from "@/components/public/CmsPage";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return getCmsMetadata("homepage_hero");
}

export default async function Home() {
  // A logged-in Developer or Salesperson only ever sees their own
  // developer's projects on this page — areas/communities stay unrestricted.
  // Resolved up front since getPublishedProjects needs it for its query.
  const viewerDeveloperId = await getViewerProjectScope();

  const [
    communityRows,
    developerRows,
    projectRows,
    banner,
    sidebarBanner,
    sponsoredPinIds,
    navLinks,
  ] = await Promise.all([
    getCommunities(),
    getDevelopers(),
    getPublishedProjects(viewerDeveloperId ?? undefined),
    getActiveHomepageBanner(),
    getActiveSidebarBanner(),
    getActiveSponsoredPinProjectIds(),
    getNavLinks("header"),
  ]);

  const communities = communityRows.map((c) => mapCommunity(c));
  const developers = developerRows.map((d) => mapDeveloper(d));
  const projects = projectRows.map((p) => mapProject(p));

  return (
    <HomeClient
      communities={communities}
      developers={developers}
      projects={projects}
      banner={
        banner
          ? { title: banner.title, targetUrl: banner.target_url, developerName: banner.developers?.name }
          : null
      }
      sidebarBanner={
        sidebarBanner
          ? {
              title: sidebarBanner.title,
              targetUrl: sidebarBanner.target_url,
              developerName: sidebarBanner.developers?.name,
            }
          : null
      }
      sponsoredPinIds={Array.from(sponsoredPinIds)}
      navLinks={navLinks
        .filter((l) => !viewerDeveloperId || l.url !== "/developers")
        .map((l) => ({ label: l.label, url: l.url }))}
      viewerDeveloperId={viewerDeveloperId}
    />
  );
}
