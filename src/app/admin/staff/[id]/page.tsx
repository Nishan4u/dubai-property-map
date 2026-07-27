import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { StaffManagementPanel } from "@/components/admin/StaffManagementPanel";
import { getStaffByIdAdmin } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

const statusTone: Record<string, "green" | "gold" | "neutral" | "red"> = {
  active: "green",
  inactive: "gold",
  archived: "neutral",
  pending: "gold",
  approved: "gold",
  paid: "green",
};

export default async function AdminStaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getStaffByIdAdmin(id);
  if (!result) notFound();
  const { staff, referrals, commissions, targets } = result;

  const totalCommission = commissions.reduce((sum, c) => sum + Number(c.commission_amount), 0);
  const pendingCommission = commissions.filter((c) => c.status === "pending").reduce((sum, c) => sum + Number(c.commission_amount), 0);
  const paidCommission = commissions.filter((c) => c.status === "paid").reduce((sum, c) => sum + Number(c.commission_amount), 0);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">{staff.full_name}</h1>
        <p className="text-sm text-ink-400">
          {staff.staff_code} · {staff.position ?? "No position set"} · Referral code{" "}
          <span className="font-mono text-gold-400">{staff.referral_code}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-navy-700 bg-navy-850 p-4">
          <p className="text-xs text-ink-500">Total Referrals</p>
          <p className="mt-1 text-xl font-bold text-ink-100">{referrals.length}</p>
        </div>
        <div className="rounded-xl border border-navy-700 bg-navy-850 p-4">
          <p className="text-xs text-ink-500">Commission Earned</p>
          <p className="mt-1 text-xl font-bold text-gold-400">AED {totalCommission.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-navy-700 bg-navy-850 p-4">
          <p className="text-xs text-ink-500">Pending</p>
          <p className="mt-1 text-xl font-bold text-ink-100">AED {pendingCommission.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-navy-700 bg-navy-850 p-4">
          <p className="text-xs text-ink-500">Paid</p>
          <p className="mt-1 text-xl font-bold text-emerald-400">AED {paidCommission.toLocaleString()}</p>
        </div>
      </div>

      <StaffManagementPanel staff={staff} />

      <div>
        <h2 className="mb-3 text-lg font-semibold text-ink-100">Monthly Targets</h2>
        <DataTable
          columns={[
            { header: "Month", render: (t) => `${t.year}-${String(t.month).padStart(2, "0")}` },
            { header: "New Subscription Target", render: (t) => t.new_subscription_target },
            { header: "Renewal Target", render: (t) => t.renewal_target },
            { header: "Revenue Target", render: (t) => `AED ${Number(t.revenue_target).toLocaleString()}` },
          ]}
          rows={targets}
        />
        {targets.length === 0 && <p className="mt-2 text-xs text-ink-500">No targets set yet — use the panel above.</p>}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-ink-100">Referred Customers</h2>
        <DataTable
          columns={[
            {
              header: "Customer",
              render: (r) => r.developers?.name ?? r.brokers?.full_name ?? r.salespersons?.full_name ?? "—",
            },
            { header: "Account Type", render: (r) => <span className="capitalize">{r.account_type}</span> },
            { header: "Referral Code Used", render: (r) => <span className="font-mono text-xs">{r.referral_code}</span> },
            { header: "First Subscribed", render: (r) => new Date(r.first_subscribed_at).toLocaleDateString() },
          ]}
          rows={referrals}
        />
        {referrals.length === 0 && <p className="mt-2 text-xs text-ink-500">No referred customers yet.</p>}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-ink-100">Commission History</h2>
        <DataTable
          columns={[
            { header: "Period", render: (c) => `${c.period_year}-${String(c.period_month).padStart(2, "0")}` },
            { header: "Account Type", render: (c) => <span className="capitalize">{c.account_type}</span> },
            { header: "Payment", render: (c) => `${c.payment_source} · ${c.payment_id.slice(0, 16)}…` },
            { header: "Subscription Amount", render: (c) => `AED ${Number(c.subscription_amount).toLocaleString()}` },
            { header: "Commission", render: (c) => `AED ${Number(c.commission_amount).toLocaleString()}` },
            { header: "Status", render: (c) => <Badge tone={statusTone[c.status] ?? "neutral"}>{c.status}</Badge> },
          ]}
          rows={commissions}
        />
        {commissions.length === 0 && <p className="mt-2 text-xs text-ink-500">No commission history yet.</p>}
      </div>
    </div>
  );
}
