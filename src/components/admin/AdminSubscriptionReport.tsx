import { SectionCard } from "@/components/ui/SectionCard";
import { DonutChart } from "@/components/ui/Charts";
import type { getSubscriptionReportAdmin } from "@/lib/supabase/queries";

const statusColor: Record<string, string> = {
  active: "#34d399",
  trialing: "#60a5fa",
  expired: "#e3ab3d",
  cancelled: "#f87171",
  none: "#626e8e",
};

function toDonutData(byStatus: Record<string, number>) {
  return Object.entries(byStatus).map(([status, value]) => ({
    name: status,
    value,
    color: statusColor[status] ?? "#626e8e",
  }));
}

export function AdminSubscriptionReport({ report }: { report: Awaited<ReturnType<typeof getSubscriptionReportAdmin>> }) {
  const sections: { title: string; data: (typeof report)[keyof typeof report] }[] = [
    { title: "Brokers", data: report.broker },
    { title: "Salespersons", data: report.salesperson },
    { title: "Developers", data: report.developer },
    { title: "Broker Agencies", data: report.brokerage },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {sections.map((s) => (
        <SectionCard key={s.title} title={`${s.title} — ${s.data.total} total`}>
          {s.data.total > 0 ? (
            <DonutChart data={toDonutData(s.data.byStatus)} />
          ) : (
            <p className="py-6 text-center text-sm text-ink-500">No accounts yet.</p>
          )}
        </SectionCard>
      ))}
    </div>
  );
}
