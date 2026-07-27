import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { getStaffSelfData } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

const statusTone: Record<string, "green" | "gold" | "neutral"> = {
  pending: "gold",
  approved: "gold",
  paid: "green",
};

export default async function StaffCommissionPage() {
  const { commissions } = await getStaffSelfData();

  const pending = commissions.filter((c) => c.status === "pending");
  const approved = commissions.filter((c) => c.status === "approved");
  const paid = commissions.filter((c) => c.status === "paid");

  const sum = (rows: typeof commissions) => rows.reduce((s, c) => s + Number(c.commission_amount), 0);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">My Commission</h1>
        <p className="text-sm text-ink-400">Commission is earned only for successful, paid subscription months.</p>
      </div>

      <div className="grid grid-cols-3 gap-4 sm:max-w-lg">
        <div className="rounded-xl border border-navy-700 bg-navy-850 p-4 text-center">
          <p className="text-xs text-ink-500">Pending</p>
          <p className="mt-1 text-lg font-bold text-gold-400">AED {sum(pending).toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-navy-700 bg-navy-850 p-4 text-center">
          <p className="text-xs text-ink-500">Approved</p>
          <p className="mt-1 text-lg font-bold text-gold-400">AED {sum(approved).toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-navy-700 bg-navy-850 p-4 text-center">
          <p className="text-xs text-ink-500">Paid</p>
          <p className="mt-1 text-lg font-bold text-emerald-400">AED {sum(paid).toLocaleString()}</p>
        </div>
      </div>

      <DataTable
        columns={[
          { header: "Period", render: (c) => `${c.period_year}-${String(c.period_month).padStart(2, "0")}` },
          { header: "Account Type", render: (c) => <span className="capitalize">{c.account_type}</span> },
          { header: "Subscription Amount", render: (c) => `AED ${Number(c.subscription_amount).toLocaleString()}` },
          { header: "Commission", render: (c) => `AED ${Number(c.commission_amount).toLocaleString()}` },
          { header: "Status", render: (c) => <Badge tone={statusTone[c.status] ?? "neutral"}>{c.status}</Badge> },
        ]}
        rows={commissions}
      />
      {commissions.length === 0 && <p className="text-xs text-ink-500">No commission history yet.</p>}
    </div>
  );
}
