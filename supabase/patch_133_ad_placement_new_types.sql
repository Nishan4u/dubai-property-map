-- Adds two new custom-banner-image placement types, matching the two
-- AdSense locations (Projects Listing In-Feed, Blog Post In-Article) that
-- didn't yet have an admin-uploaded-image equivalent -- the other 4 AdSense
-- locations (homepage, sidebar, project page, developer page) already had
-- a matching custom placement type since patch_9/patch_24.
alter table ad_placements drop constraint if exists ad_placements_placement_type_check;
alter table ad_placements add constraint ad_placements_placement_type_check
  check (placement_type in (
    'homepage_banner',
    'sidebar_banner',
    'sponsored_pin',
    'community_banner',
    'project_page_banner',
    'developer_page_banner',
    'projects_infeed_banner',
    'blog_inarticle_banner'
  ));

notify pgrst, 'reload schema';
