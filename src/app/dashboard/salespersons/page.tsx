import { SalespersonRosterTable } from "@/components/dashboard/SalespersonRosterTable";
import { getSalespersonsForDeveloper, requireDeveloperProfile } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function DeveloperSalespersonsPage() {
  const profile = await requireDeveloperProfile();
  const salespersons = await getSalespersonsForDeveloper(profile.developer_id);

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Salespersons</h1>
        <p className="text-sm text-ink-400">
          {salespersons.length} salesperson{salespersons.length === 1 ? "" : "s"} on your sales team.
          Brokers select from this roster when submitting a property request.
        </p>
      </div>

      <SalespersonRosterTable salespersons={salespersons} />
    </div>
  );
}
