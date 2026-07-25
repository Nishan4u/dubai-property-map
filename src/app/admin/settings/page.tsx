import { SettingsTable } from "@/components/admin/SettingsTable";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("platform_settings")
    .select("key, label, value")
    .order("label");

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Settings</h1>
        <p className="text-sm text-ink-400">
          Platform integrations and API keys — stored in your database, edited
          here.
        </p>
      </div>
      <SettingsTable settings={settings ?? []} />
    </div>
  );
}
