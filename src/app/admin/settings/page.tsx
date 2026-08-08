import { headers } from "next/headers";
import { SettingsTable } from "@/components/admin/SettingsTable";
import { RegistrationTypeSettingsPanel } from "@/components/admin/RegistrationTypeSettingsPanel";
import { FreeAccessSettingsPanel } from "@/components/admin/FreeAccessSettingsPanel";
import { SiteAccessSettingsPanel } from "@/components/admin/SiteAccessSettingsPanel";
import { IpRestrictionsPanel } from "@/components/admin/IpRestrictionsPanel";
import { AdSenseTogglePanel } from "@/components/admin/AdSenseTogglePanel";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const [
    { data: settings },
    { data: registrationTypes },
    { data: freeAccessTypes },
    { data: siteAccess },
    { data: ipSettings },
    { data: ipAllowlist },
    profile,
  ] = await Promise.all([
    supabase.from("platform_settings").select("key, label, value").order("label"),
    supabase.from("registration_type_settings").select("account_type, enabled"),
    supabase.from("free_access_settings").select("account_type, enabled"),
    supabase.from("site_access_settings").select("restrictions_enabled").eq("id", true).maybeSingle(),
    supabase.from("admin_ip_restrictions_settings").select("enabled").eq("id", true).maybeSingle(),
    supabase.from("admin_ip_allowlist").select("id, ip_address, label").order("created_at"),
    getCurrentProfile(),
  ]);

  const headersList = await headers();
  const currentIp =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? headersList.get("x-real-ip") ?? null;

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Settings</h1>
        <p className="text-sm text-ink-400">
          Platform integrations and API keys — stored in your database, edited
          here.
        </p>
      </div>
      <SiteAccessSettingsPanel
        initialEnabled={siteAccess?.restrictions_enabled ?? true}
        canManage={Boolean(profile?.is_super_admin)}
      />
      <IpRestrictionsPanel
        initialEnabled={ipSettings?.enabled ?? false}
        initialEntries={ipAllowlist ?? []}
        currentIp={currentIp}
        canManage={Boolean(profile?.is_super_admin)}
      />
      <RegistrationTypeSettingsPanel settings={registrationTypes ?? []} />
      <FreeAccessSettingsPanel settings={freeAccessTypes ?? []} />
      <AdSenseTogglePanel
        initialEnabled={(settings ?? []).find((s) => s.key === "adsense_enabled")?.value !== "false"}
      />
      <div>
        <h2 className="mb-3 text-sm font-semibold text-ink-200">Integrations</h2>
        {/* adsense_enabled has its own toggle above -- excluded here so it
           doesn't also show up as a plain "true"/"false" text row below. */}
        <SettingsTable settings={(settings ?? []).filter((s) => s.key !== "adsense_enabled")} />
      </div>
    </div>
  );
}
