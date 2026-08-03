import { CalendarDays } from "lucide-react";
import { DeveloperCalendarClient } from "@/components/dashboard/DeveloperCalendarClient";
import { getAppointmentsForDeveloper, getCrmClientsForDeveloper, requireDeveloperProfile } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function DeveloperCalendarPage() {
  const profile = await requireDeveloperProfile();

  const [appointments, clients] = await Promise.all([
    getAppointmentsForDeveloper(profile.developer_id),
    getCrmClientsForDeveloper(profile.developer_id),
  ]);

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-ink-100">
          <CalendarDays className="h-5 w-5 text-gold-400" /> Calendar
        </h1>
        <p className="text-sm text-ink-400">Schedule appointments and meetings with your buyers.</p>
      </div>
      <DeveloperCalendarClient developerId={profile.developer_id} appointments={appointments} clients={clients} />
    </div>
  );
}
