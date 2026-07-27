import Link from "next/link";
import { Copy } from "lucide-react";
import { getStaffSelfData } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function StaffDashboardPage() {
  const { staff, referrals, commissions } = await getStaffSelfData();
  if (!staff) return null;

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;

  const thisMonthCommissions = commissions.filter((c) => c.period_year === year && c.period_month === month);
  const newSubsThisMonth = referrals.filter((r) => {
    const d = new Date(r.first_subscribed_at);
    return d.getUTCFullYear() === year && d.getUTCMonth() + 1 === month;
  }).length;
  const renewalsThisMonth = thisMonthCommissions.length - newSubsThisMonth > 0 ? thisMonthCommissions.length - newSubsThisMonth : 0;
  const revenueThisMonth = thisMonthCommissions.reduce((sum, c) => sum + Number(c.subscription_amount), 0);

  const achieved = newSubsThisMonth;
  const target = staff.new_subscription_target || 0;
  const remaining = Math.max(target - achieved, 0);
  const targetPct = target > 0 ? Math.round((achieved / target) * 100) : 0;

  const activeCustomers = referrals.length;
  const commissionEarned = commissions.reduce((sum, c) => sum + Number(c.commission_amount), 0);
  const commissionPending = commissions.filter((c) => c.status === "pending").reduce((sum, c) => sum + Number(c.commission_amount), 0);
  const commissionPaid = commissions.filter((c) => c.status === "paid").reduce((sum, c) => sum + Number(c.commission_amount), 0);

  const cards = [
    { label: "Referral Code", value: staff.referral_code, mono: true },
    { label: "Monthly Target", value: target },
    { label: "Achieved", value: achieved },
    { label: "Remaining", value: remaining },
    { label: "Target %", value: `${targetPct}%` },
    { label: "New Subscriptions (This Month)", value: newSubsThisMonth },
    { label: "Renewals (This Month)", value: renewalsThisMonth },
    { label: "Active Subscribers", value: activeCustomers },
    { label: "Revenue Generated (This Month)", value: `AED ${revenueThisMonth.toLocaleString()}` },
    { label: "Commission Earned", value: `AED ${commissionEarned.toLocaleString()}` },
    { label: "Commission Pending", value: `AED ${commissionPending.toLocaleString()}` },
    { label: "Commission Paid", value: `AED ${commissionPaid.toLocaleString()}` },
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Welcome, {staff.full_name}</h1>
        <p className="text-sm text-ink-400">{staff.position ?? "Staff"} · {staff.staff_code}</p>
      </div>

      <div className="rounded-xl border border-gold-500/30 bg-gold-500/10 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-ink-400">Share this code with prospective customers</p>
            <p className="mt-1 font-mono text-lg font-bold text-gold-400">{staff.referral_code}</p>
          </div>
          <Link
            href="/staff/referral-code"
            className="flex items-center gap-1.5 rounded-lg border border-navy-600 px-3 py-1.5 text-xs font-medium text-ink-300 hover:text-ink-100"
          >
            <Copy className="h-3.5 w-3.5" /> View
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-navy-700 bg-navy-850 p-4">
            <p className="text-xs text-ink-500">{c.label}</p>
            <p className={`mt-1 text-xl font-bold text-ink-100 ${c.mono ? "font-mono text-gold-400" : ""}`}>{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
