import { BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { BrokerageVerifiedToggle } from "@/components/admin/BrokerageVerifiedToggle";
import { DeleteBrokerageButton } from "@/components/admin/DeleteBrokerageButton";
import { getAllBrokeragesAdmin, getAllBrokersAdmin } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function AdminBrokeragesPage() {
  const [brokerages, brokers] = await Promise.all([getAllBrokeragesAdmin(), getAllBrokersAdmin()]);

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Brokerages</h1>
        <p className="text-sm text-ink-400">{brokerages.length} brokerage companies on the platform.</p>
      </div>

      <DataTable
        columns={[
          {
            header: "Brokerage",
            render: (br) => (
              <span className="flex items-center gap-2 font-medium text-ink-100">
                {br.name}
                {br.verified && <BadgeCheck className="h-3.5 w-3.5 text-sky-400" />}
              </span>
            ),
          },
          {
            header: "Brokers",
            render: (br) => brokers.filter((b) => b.brokerage_id === br.id).length,
          },
          {
            header: "Status",
            render: (br) => <Badge tone={br.verified ? "green" : "neutral"}>{br.verified ? "Verified" : "Unverified"}</Badge>,
          },
          {
            header: "",
            render: (br) => <BrokerageVerifiedToggle brokerageId={br.id} verified={br.verified} />,
          },
          {
            header: "",
            render: (br) => (
              <DeleteBrokerageButton
                brokerageId={br.id}
                brokerageName={br.name}
                brokerCount={brokers.filter((b) => b.brokerage_id === br.id).length}
              />
            ),
          },
        ]}
        rows={brokerages}
      />
    </div>
  );
}
