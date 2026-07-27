import { SettingsTable } from "@/components/admin/SettingsTable";
import { RegistrationTypeSettingsPanel } from "@/components/admin/RegistrationTypeSettingsPanel";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const [{ data: settings }, { data: registrationTypes }] = await Promise.all([
    supabase.from("platform_settings").select("key, label, value").order("label"),
    supabase.from("registration_type_settings").select("account_type, enabled"),
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
      <RegistrationTypeSettingsPanel settings={registrationTypes ?? []} />
      <div>
        <h2 className="mb-3 text-sm font-semibold text-ink-200">Integrations</h2>
        <SettingsTable settings={settings ?? []} />
      </div>
    </div>
  );
}
