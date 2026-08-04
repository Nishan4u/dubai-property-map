import { Plug } from "lucide-react";
import { IntegrationsPanel } from "@/components/account/IntegrationsPanel";
import { getCrmIntegrationsForOwner, requireSalespersonProfile } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function SalespersonIntegrationsPage() {
  const profile = await requireSalespersonProfile();
  const integrations = await getCrmIntegrationsForOwner("salesperson", profile.salesperson_id);

  return (
    <div className="space-y-4 p-6">
      <h1 className="flex items-center gap-2 text-xl font-bold text-ink-100">
        <Plug className="h-5 w-5" /> Integrations
      </h1>
      <IntegrationsPanel integrations={integrations} />
    </div>
  );
}
