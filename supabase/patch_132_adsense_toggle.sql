-- A dedicated on/off switch for Google AdSense, separate from the
-- publisher ID itself -- lets admin turn every ad off site-wide without
-- losing the configured client id or any of the manual placements
-- (AdUnit.tsx call sites in AllProjectsClient/HomeClient/project/blog
-- pages), which stay wired and ready for whenever ads are switched back
-- on. Defaults to 'true' so existing behavior (ads showing, since patch_23
-- already had a real publisher id configured) is completely unchanged
-- until an admin explicitly flips this off.
insert into platform_settings (key, label, value)
values ('adsense_enabled', 'Google AdSense Enabled', 'true')
on conflict (key) do nothing;

notify pgrst, 'reload schema';
