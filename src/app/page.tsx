import { HomeClient } from "@/components/public/HomeClient";
import {
  getActiveHomepageBanner,
  getActiveSidebarBanner,
  getActiveSponsoredPinProjectIds,
  getCommunities,
  getCurrentProfile,
  getDevelopers,
  getMapAccessStatus,
  getNavLinks,
  getPublishedProjects,
  getSalespersonDeveloperAccess,
  getUpcomingProjectsPublic,
  getViewerProjectScope,
} from "@/lib/supabase/queries";
import type { SliderClickBehavior } from "@/components/public/PartnerDevelopersSlider";
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
  const { status: mapAccessStatus, subscriptionHref } = await getMapAccessStatus();
  // Separate from mapAccessStatus: a salesperson can have full Map access
  // via their own subscription while their specific developer's projects
  // are unavailable because THAT developer's account/subscription lapsed.
  const { blocked: developerInactiveForSalesperson } = await getSalespersonDeveloperAccess();
  const viewerProfile = await getCurrentProfile();
  const sliderClickBehavior: SliderClickBehavior = !viewerProfile
    ? "guest"
    : viewerProfile.role === "developer" || viewerProfile.role === "salesperson"
      ? "disabled"
      : "link";

  const [
    communityRows,
    developerRows,
    projectRows,
    banner,
    sidebarBanner,
    sponsoredPinIds,
    navLinks,
    upcomingProjects,
  ] = await Promise.all([
    getCommunities(),
    getDevelopers(),
    // The real project/pin dataset is the thing being protected — an
    // unauthorized viewer's page payload never contains it at all, so
    // there's nothing for devtools (or "view source") to recover once the
    // blur overlay is removed client-side.
    mapAccessStatus === "ok" && !developerInactiveForSalesperson
      ? getPublishedProjects(viewerDeveloperId ?? undefined)
      : Promise.resolve([]),
    getActiveHomepageBanner(),
    getActiveSidebarBanner(),
    getActiveSponsoredPinProjectIds(),
    getNavLinks("header"),
    // "Coming Soon" pins are deliberately public teasers (spec section 13)
    // -- unlike real listings, these are never gated behind mapAccessStatus.
    getUpcomingProjectsPublic(),
  ]);

  const communities = communityRows.map((c) => mapCommunity(c));
  const developers = developerRows.map((d) => mapDeveloper(d));
  const projects = projectRows.map((p) => mapProject(p));
  // "Developer sees ONLY own projects everywhere" also covers the "Coming
  // Soon" teaser layer -- a logged-in developer/salesperson shouldn't see
  // other developers' unlaunched pins on their own scoped view of the map.
  const scopedUpcomingProjects = viewerDeveloperId
    ? upcomingProjects.filter((u) => u.developer_id === viewerDeveloperId)
    : upcomingProjects;

  return (
    <HomeClient
      communities={communities}
      developers={developers}
      projects={projects}
      mapAccessStatus={mapAccessStatus}
      subscriptionHref={subscriptionHref}
      developerInactiveForSalesperson={developerInactiveForSalesperson}
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
      sliderClickBehavior={sliderClickBehavior}
      upcomingProjects={scopedUpcomingProjects}
    />
  );
}
