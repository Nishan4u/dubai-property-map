import { CalendarDays } from "lucide-react";
import { BrokerCalendarClient } from "@/components/broker/BrokerCalendarClient";
import { getAppointmentsForBroker, getCrmClientsForBroker, requireBrokerProfile } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function BrokerCalendarPage() {
  const profile = await requireBrokerProfile();

  const [appointments, clients] = await Promise.all([
    getAppointmentsForBroker(profile.broker_id),
    getCrmClientsForBroker(profile.broker_id),
  ]);

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-ink-100">
          <CalendarDays className="h-5 w-5 text-gold-400" /> Calendar
        </h1>
        <p className="text-sm text-ink-400">Schedule appointments and meetings with your clients.</p>
      </div>
      <BrokerCalendarClient brokerId={profile.broker_id} appointments={appointments} clients={clients} />
    </div>
  );
}
