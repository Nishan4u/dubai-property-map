import { UserRound } from "lucide-react";
import { MyLeadsTable } from "@/components/salesperson/MyLeadsTable";
import { createClient } from "@/lib/supabase/server";
import { requireSalespersonProfile, getCrmClientsForSalesperson } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function SalespersonLeadsPage() {
  const profile = await requireSalespersonProfile();
  const supabase = await createClient();

  const { data: leads } = await supabase
    .from("property_requests")
    .select("*, brokers(full_name, brn, mobile, whatsapp, email), projects(name), crm_clients(id, full_name, phone, email)")
    .eq("salesperson_id", profile.salesperson_id)
    .order("created_at", { ascending: false });

  const clients = await getCrmClientsForSalesperson(profile.salesperson_id);

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-ink-100">
          <UserRound className="h-5 w-5 text-gold-400" /> My Leads
        </h1>
        <p className="text-sm text-ink-400">Property requests assigned to you.</p>
      </div>
      <MyLeadsTable leads={leads ?? []} clients={clients} />
    </div>
  );
}
