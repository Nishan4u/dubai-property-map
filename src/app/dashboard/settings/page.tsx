import { DeveloperSettingsForm } from "@/components/dashboard/DeveloperSettingsForm";
import { DeveloperStorageSyncPanel } from "@/components/dashboard/DeveloperStorageSyncPanel";
import { requireDeveloperProfile, getStorageConnectionForDeveloper } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DeveloperSettingsPage() {
  const profile = await requireDeveloperProfile();
  const developerId = profile.developer_id;

  const supabase = await createClient();
  const { data: developer } = await supabase
    .from("developers")
    .select("notification_prefs, lead_webhook_url")
    .eq("id", developerId)
    .single();

  const storageConnection = await getStorageConnectionForDeveloper(developerId);

  return (
    <div className="space-y-6">
      <DeveloperSettingsForm
        developerId={developerId}
        notificationPrefs={
          (developer?.notification_prefs as {
            new_leads?: boolean;
            new_messages?: boolean;
          }) ?? { new_leads: true, new_messages: true }
        }
        leadWebhookUrl={developer?.lead_webhook_url ?? ""}
      />
      <div className="max-w-2xl px-6">
        <DeveloperStorageSyncPanel connection={storageConnection} />
      </div>
    </div>
  );
}
