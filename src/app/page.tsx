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
import { isAdsEnabled } from "@/lib/adsEnabled";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const cmsMetadata = await getCmsMetadata("homepage_hero");
  return {
    alternates: { canonical: "/" },
    ...cmsMetadata,
    // getCmsMetadata's own openGraph object (when an admin has customized
    // this page's SEO content) only sets title/description/type -- and
    // since Next.js replaces the whole openGraph object per metadata
    // level rather than deep-merging it, spreading cmsMetadata above was
    // silently dropping the root layout's siteName/url/locale from the
    // rendered <meta property="og:..."> tags whenever a homepage_hero CMS
    // row exists (confirmed live: og:site_name/og:url/og:locale were
    // missing, og:title/description/image were fine). Re-declared here so
    // they always render regardless of whether cmsMetadata.openGraph is
    // present.
    openGraph: {
      siteName: "Dubai Property Map",
      url: "https://dubaipropertymap.ae",
      locale: "en_AE",
      ...cmsMetadata.openGraph,
    },
  };
}

// Organization + WebSite structured data -- Organization/logo helps Google
// associate the site with a real business entity (a prerequisite for
// Knowledge Panel eligibility and for the developer/broker/community pages
// below to read as "part of" a coherent site rather than orphaned URLs);
// WebSite's SearchAction is what makes Google eligible to show the
// sitelinks search box directly in the SERP for this domain. Both are
// site-wide facts, so they belong on the homepage, not per-page.
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Dubai Property Map",
  url: "https://dubaipropertymap.ae",
  logo: "https://dubaipropertymap.ae/logo/dubai-property-map-logo.png",
  description:
    "Explore Dubai's premium property market on an interactive map — off-plan launches, ready homes, developers, and communities.",
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Dubai Property Map",
  url: "https://dubaipropertymap.ae",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://dubaipropertymap.ae/projects?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

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
  // A broker/broker-agency/salesperson with an active paid subscription
  // gets an ad-free homepage -- mapAccessStatus === "ok" for exactly these
  // 3 roles already means "resolveSubscriptionMapAccess confirmed an
  // active plan" (see getMapAccessStatus above), so this reuses that same
  // signal rather than re-querying subscription_status a second time.
  // Buyers/admins/developers always get "ok" too but aren't subscribers in
  // this sense, so they're excluded and keep seeing ads as before.
  const isSubscribedPortalAccount =
    !!viewerProfile &&
    (viewerProfile.role === "broker" ||
      viewerProfile.role === "broker_agency" ||
      viewerProfile.role === "salesperson") &&
    mapAccessStatus === "ok";

  const [
    communityRows,
    developerRows,
    projectRows,
    banner,
    sidebarBanner,
    sponsoredPinIds,
    navLinks,
    upcomingProjects,
    adsEnabled,
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
    isAdsEnabled(),
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
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <HomeClient
        communities={communities}
        developers={developers}
        projects={projects}
        mapAccessStatus={mapAccessStatus}
        subscriptionHref={subscriptionHref}
        developerInactiveForSalesperson={developerInactiveForSalesperson}
        banner={
          banner && !isSubscribedPortalAccount
            ? {
                id: banner.id,
                title: banner.title,
                targetUrl: banner.target_url,
                developerName: banner.developers?.name,
                imageUrl: banner.image_url,
              }
            : null
        }
        sidebarBanner={
          sidebarBanner && !isSubscribedPortalAccount
            ? {
                id: sidebarBanner.id,
                title: sidebarBanner.title,
                targetUrl: sidebarBanner.target_url,
                developerName: sidebarBanner.developers?.name,
                imageUrl: sidebarBanner.image_url,
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
        adsEnabled={adsEnabled && !isSubscribedPortalAccount}
      />
    </>
  );
}
