import { ClipboardCheck } from "lucide-react";
import { DeveloperReservationsClient } from "@/components/dashboard/DeveloperReservationsClient";
import { getPublishedProjects, getReservationsForDeveloper, requireDeveloperProfile } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function DeveloperReservationsPage() {
  const profile = await requireDeveloperProfile();
  const developerId = profile.developer_id;

  const [reservations, projectRows] = await Promise.all([
    getReservationsForDeveloper(developerId),
    getPublishedProjects(developerId),
  ]);

  return (
    <div className="space-y-4 p-6">
      <h1 className="flex items-center gap-2 text-xl font-bold text-ink-100">
        <ClipboardCheck className="h-5 w-5 text-gold-400" /> Reservations
      </h1>
      <p className="text-sm text-ink-400">
        Reserve a unit for a buyer and send them a Unit Reservation Agreement to sign electronically.
      </p>
      <DeveloperReservationsClient
        developerId={developerId}
        reservations={reservations}
        projects={projectRows.map((p) => ({ id: p.id, name: p.name }))}
      />
    </div>
  );
}
