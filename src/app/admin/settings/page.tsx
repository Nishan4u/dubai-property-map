import { SettingsTable } from "@/components/admin/SettingsTable";
import { RegistrationTypeSettingsPanel } from "@/components/admin/RegistrationTypeSettingsPanel";
import { FreeAccessSettingsPanel } from "@/components/admin/FreeAccessSettingsPanel";
import { SiteAccessSettingsPanel } from "@/components/admin/SiteAccessSettingsPanel";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const [{ data: settings }, { data: registrationTypes }, { data: freeAccessTypes }, { data: siteAccess }] =
    await Promise.all([
      supabase.from("platform_settings").select("key, label, value").order("label"),
      supabase.from("registration_type_settings").select("account_type, enabled"),
      supabase.from("free_access_settings").select("account_type, enabled"),
      supabase.from("site_access_settings").select("restrictions_enabled").eq("id", true).maybeSingle(),
    ]);

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Settings</h1>
        <p className="text-sm text-ink-400">
          Platform integrations and API keys — stored in your database, edited
          here.
        </p>
      </div>
      <SiteAccessSettingsPanel initialEnabled={siteAccess?.restrictions_enabled ?? true} />
      <RegistrationTypeSettingsPanel settings={registrationTypes ?? []} />
      <FreeAccessSettingsPanel settings={freeAccessTypes ?? []} />
      <div>
        <h2 className="mb-3 text-sm font-semibold text-ink-200">Integrations</h2>
        <SettingsTable settings={settings ?? []} />
      </div>
    </div>
  );
}
