import { AdminInvestmentLeadsTable } from "@/components/admin/AdminInvestmentLeadsTable";
import { getAllInvestmentLeadsAdmin } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function AdminInvestmentLeadsPage() {
  const leads = await getAllInvestmentLeadsAdmin();

  return <AdminInvestmentLeadsTable leads={leads} />;
}
