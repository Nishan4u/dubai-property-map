import { CalendarDays } from "lucide-react";
import { AgencyCalendarClient } from "@/components/broker-agency/AgencyCalendarClient";
import { getAppointmentsForBrokerAgency, getCrmClientsForBrokerAgency, requireBrokerAgencyProfile } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function BrokerAgencyCalendarPage() {
  const profile = await requireBrokerAgencyProfile();

  const [appointments, clients] = await Promise.all([
    getAppointmentsForBrokerAgency(profile.broker_agency_id),
    getCrmClientsForBrokerAgency(profile.broker_agency_id),
  ]);

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-ink-100">
          <CalendarDays className="h-5 w-5 text-gold-400" /> Calendar
        </h1>
        <p className="text-sm text-ink-400">Schedule appointments and meetings with your agency&apos;s clients.</p>
      </div>
      <AgencyCalendarClient brokerageId={profile.broker_agency_id} appointments={appointments} clients={clients} />
    </div>
  );
}
