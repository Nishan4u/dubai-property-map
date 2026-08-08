import { createAdminClient } from "@/lib/supabase/admin";

// Single source of truth for the admin AdSense on/off switch
// (platform_settings.adsense_enabled, patch_132) -- used by every server
// component that renders a manual <AdUnit> (AllProjectsClient's parent
// page, the homepage, project/blog detail pages) so flipping the switch
// off in /admin/settings turns off every placement, not just the
// site-wide auto script in AnalyticsScripts.tsx (which reads the same
// setting independently, since it already has its own service-role read
// in place).
export async function isAdsEnabled(): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "adsense_enabled")
      .maybeSingle();
    // Missing row (pre-migration) or any other value defaults to enabled,
    // matching the setting's own 'true' default in patch_132 -- never
    // silently turn ads off just because the toggle hasn't been seeded yet.
    return data?.value !== "false";
  } catch {
    return true;
  }
}
