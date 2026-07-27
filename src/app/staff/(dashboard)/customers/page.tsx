import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { getStaffSelfData } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function StaffCustomersPage() {
  const { referrals } = await getStaffSelfData();

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">My Customers</h1>
        <p className="text-sm text-ink-400">{referrals.length} customer{referrals.length === 1 ? "" : "s"} referred by you.</p>
      </div>

      <DataTable
        columns={[
          {
            header: "Customer",
            render: (r) => r.developers?.name ?? r.brokers?.full_name ?? r.salespersons?.full_name ?? "—",
          },
          { header: "Account Type", render: (r) => <Badge tone="neutral">{r.account_type}</Badge> },
          { header: "First Subscribed", render: (r) => new Date(r.first_subscribed_at).toLocaleDateString() },
        ]}
        rows={referrals}
      />
      {referrals.length === 0 && (
        <p className="text-xs text-ink-500">No referred customers yet — share your referral code to get started.</p>
      )}
    </div>
  );
}
