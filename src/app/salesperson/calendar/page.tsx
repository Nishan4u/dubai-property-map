import { CalendarDays } from "lucide-react";
import { SalespersonCalendarClient } from "@/components/salesperson/SalespersonCalendarClient";
import { getAppointmentsForSalesperson, getCrmClientsForSalesperson, requireSalespersonProfile } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function SalespersonCalendarPage() {
  const profile = await requireSalespersonProfile();

  const [appointments, clients] = await Promise.all([
    getAppointmentsForSalesperson(profile.salesperson_id),
    getCrmClientsForSalesperson(profile.salesperson_id),
  ]);

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-ink-100">
          <CalendarDays className="h-5 w-5 text-gold-400" /> Calendar
        </h1>
        <p className="text-sm text-ink-400">Schedule appointments and meetings with your clients.</p>
      </div>
      <SalespersonCalendarClient salespersonId={profile.salesperson_id} appointments={appointments} clients={clients} />
    </div>
  );
}
