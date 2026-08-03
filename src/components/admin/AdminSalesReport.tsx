import { Award, DollarSign, Handshake } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { TrendAreaChart } from "@/components/ui/Charts";
import { DataTable } from "@/components/ui/DataTable";
import { formatAed } from "@/data/mock";
import type { getSalesReportAdmin } from "@/lib/supabase/queries";

type SalesRow = Awaited<ReturnType<typeof getSalesReportAdmin>>[number];

export function AdminSalesReport({ sales }: { sales: SalesRow[] }) {
  const totalValue = sales.reduce((sum, s) => sum + Number(s.price_aed), 0);

  const byMonth = new Map<string, number>();
  for (const s of sales) {
    if (!s.signed_at) continue;
    const d = new Date(s.signed_at);
    const sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    byMonth.set(sortKey, (byMonth.get(sortKey) ?? 0) + Number(s.price_aed));
  }
  const salesTrend = Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([sortKey, value]) => {
      const [year, month] = sortKey.split("-").map(Number);
      return {
        date: new Date(year, month - 1, 1).toLocaleDateString("en-GB", { month: "short", year: "numeric" }),
        value: Math.round(value),
      };
    });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Signed Deals" value={sales.length.toLocaleString()} icon={Handshake} />
        <StatCard label="Total Deal Value" value={formatAed(totalValue)} icon={DollarSign} />
        <StatCard
          label="Average Deal Size"
          value={sales.length > 0 ? formatAed(Math.round(totalValue / sales.length)) : formatAed(0)}
          icon={Award}
        />
      </div>

      <SectionCard title="Sales Over Time">
        {salesTrend.length > 0 ? (
          <TrendAreaChart data={salesTrend} dataKey="value" color="#34d399" />
        ) : (
          <p className="py-10 text-center text-sm text-ink-500">No signed reservations yet.</p>
        )}
      </SectionCard>

      <SectionCard title="Recent Signed Deals">
        {sales.length > 0 ? (
          <DataTable
            columns={[
              {
                header: "Project",
                render: (r: SalesRow) => (Array.isArray(r.projects) ? r.projects[0] : r.projects)?.name ?? "—",
              },
              {
                header: "Buyer",
                render: (r: SalesRow) => (Array.isArray(r.crm_clients) ? r.crm_clients[0] : r.crm_clients)?.full_name ?? "—",
              },
              { header: "Value", render: (r: SalesRow) => formatAed(Number(r.price_aed)) },
              {
                header: "Signed",
                render: (r: SalesRow) => (r.signed_at ? new Date(r.signed_at).toLocaleDateString() : "—"),
              },
            ]}
            rows={sales.slice(0, 20)}
          />
        ) : (
          <p className="py-6 text-center text-sm text-ink-500">No signed reservations yet.</p>
        )}
      </SectionCard>
    </div>
  );
}
