import { BrokeragesTable } from "@/components/admin/BrokeragesTable";
import { getAllBrokeragesAdmin, getAllBrokersAdmin } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function AdminBrokeragesPage() {
  const [brokerages, brokers] = await Promise.all([getAllBrokeragesAdmin(), getAllBrokersAdmin()]);

  const brokeragesWithCounts = brokerages.map((br) => ({
    ...br,
    brokerCount: brokers.filter((b) => b.brokerage_id === br.id).length,
  }));

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Brokerages</h1>
        <p className="text-sm text-ink-400">{brokerages.length} brokerage companies on the platform.</p>
      </div>

      <BrokeragesTable brokerages={brokeragesWithCounts} />
    </div>
  );
}
