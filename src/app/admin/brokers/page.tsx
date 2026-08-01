import { BrokersTable } from "@/components/admin/BrokersTable";
import { getAllBrokersAdmin } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function AdminBrokersPage() {
  const brokers = await getAllBrokersAdmin();

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Brokers</h1>
        <p className="text-sm text-ink-400">{brokers.length} brokers registered on the platform.</p>
      </div>

      <BrokersTable brokers={brokers} />
    </div>
  );
}
