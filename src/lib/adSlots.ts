// Manual Google AdSense placements -- distinct from the site-wide Auto ads
// script in AnalyticsScripts.tsx (which reads its client id from
// platform_settings, since it's a single global toggle). These are
// structural, per-component placement decisions rather than an admin-
// editable setting, so they're plain constants here rather than another
// platform_settings row -- matching how e.g. nav link ordering vs. actual
// page layout are handled differently elsewhere in this codebase. None of
// this is secret: a data-ad-slot id is only ever meaningful embedded in a
// page's own HTML, exactly like the client id already is.
export const AD_CLIENT = "ca-pub-7382466714804424";

export const AD_SLOTS = {
  projectsListingInFeed: "3949735289",
  projectDetailSidebar: "9585919358",
  blogPostInArticle: "9996268887",
  homepageBanner: "2908116356",
} as const;
