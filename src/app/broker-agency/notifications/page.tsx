import { Bell } from "lucide-react";
import { NotificationsTab } from "@/components/account/NotificationsTab";
import { requireBrokerAgencyProfile } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function BrokerAgencyNotificationsPage() {
  const profile = await requireBrokerAgencyProfile();

  return (
    <div className="space-y-4 p-6">
      <h1 className="flex items-center gap-2 text-xl font-bold text-ink-100">
        <Bell className="h-5 w-5 text-gold-400" /> Notifications
      </h1>
      <div className="rounded-xl border border-navy-700 bg-navy-850">
        <NotificationsTab userId={profile.id} />
      </div>
    </div>
  );
}
