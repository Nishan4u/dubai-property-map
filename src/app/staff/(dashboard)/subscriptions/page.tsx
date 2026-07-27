import Link from "next/link";
import { clsx } from "clsx";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { getStaffSelfData } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

type TabKey = "new" | "active" | "renewals" | "expired";
const tabLabels: Record<TabKey, string> = { new: "New", active: "Active", renewals: "Renewals", expired: "Expired" };

function accountName(r: { developers?: unknown; brokers?: unknown; salespersons?: unknown }) {
  const d = r.developers as { name?: string } | { name?: string }[] | null;
  const b = r.brokers as { full_name?: string } | { full_name?: string }[] | null;
  const s = r.salespersons as { full_name?: string } | { full_name?: string }[] | null;
  const pick = <T extends { name?: string; full_name?: string }>(v: T | T[] | null | undefined) => (Array.isArray(v) ? v[0] : v);
  return pick(d)?.name ?? pick(b)?.full_name ?? pick(s)?.full_name ?? "—";
}

function currentStatus(r: { developers?: unknown; brokers?: unknown; salespersons?: unknown }) {
  const pick = (v: unknown) => {
    const row = Array.isArray(v) ? v[0] : v;
    return (row as { subscription_status?: string } | undefined)?.subscription_status;
  };
  return pick(r.developers) ?? pick(r.brokers) ?? pick(r.salespersons);
}

export default async function StaffSubscriptionsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab: tabParam } = await searchParams;
  const tab = (["new", "active", "renewals", "expired"].includes(tabParam ?? "") ? tabParam : "active") as TabKey;

  const { referrals, commissions } = await getStaffSelfData();

  const commissionCountByReferral = new Map<string, number>();
  for (const c of commissions) {
    commissionCountByReferral.set(c.referral_id, (commissionCountByReferral.get(c.referral_id) ?? 0) + 1);
  }

  const filtered = referrals.filter((r) => {
    const status = currentStatus(r);
    const paymentCount = commissionCountByReferral.get(r.id) ?? 0;
    if (tab === "active") return status === "active";
    if (tab === "expired") return status === "expired";
    if (tab === "new") return paymentCount <= 1;
    if (tab === "renewals") return paymentCount > 1;
    return true;
  });

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">My Subscriptions</h1>
        <p className="text-sm text-ink-400">Customers you&apos;ve referred, grouped by subscription status.</p>
      </div>

      <div className="flex gap-2">
        {(Object.keys(tabLabels) as TabKey[]).map((t) => (
          <Link
            key={t}
            href={`/staff/subscriptions?tab=${t}`}
            className={clsx(
              "rounded-lg px-3 py-1.5 text-xs font-medium",
              tab === t ? "bg-gold-500 text-navy-950" : "border border-navy-600 text-ink-300 hover:text-ink-100"
            )}
          >
            {tabLabels[t]}
          </Link>
        ))}
      </div>

      <DataTable
        columns={[
          { header: "Customer", render: (r) => accountName(r) },
          { header: "Account Type", render: (r) => <Badge tone="neutral">{r.account_type}</Badge> },
          { header: "Status", render: (r) => currentStatus(r) ?? "—" },
          { header: "Payments Made", render: (r) => commissionCountByReferral.get(r.id) ?? 0 },
          { header: "First Subscribed", render: (r) => new Date(r.first_subscribed_at).toLocaleDateString() },
        ]}
        rows={filtered}
      />
      {filtered.length === 0 && <p className="text-xs text-ink-500">No {tabLabels[tab].toLowerCase()} subscriptions in this category yet.</p>}
    </div>
  );
}
