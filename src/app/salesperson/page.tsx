import { Briefcase, CalendarCheck, CheckCircle2, ClipboardList, Users } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { createClient } from "@/lib/supabase/server";
import { requireSalespersonProfile } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function SalespersonDashboardPage() {
  const profile = await requireSalespersonProfile();
  const supabase = await createClient();

  const { data: requests } = await supabase
    .from("property_requests")
    .select("broker_id, status")
    .eq("salesperson_id", profile.salesperson_id);

  const rows = requests ?? [];
  const uniqueBrokers = new Set(rows.map((r) => r.broker_id)).size;
  const newCount = rows.filter((r) => r.status === "new").length;
  const activeCount = rows.filter((r) => !["new", "closed_won", "lost", "cancelled"].includes(r.status)).length;
  const viewingCount = rows.filter((r) => r.status === "viewing_scheduled").length;
  const closedCount = rows.filter((r) => r.status === "closed_won").length;

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-bold text-ink-100">Salesperson Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="My Brokers" value={String(uniqueBrokers)} icon={Users} />
        <StatCard label="New Requests" value={String(newCount)} icon={ClipboardList} />
        <StatCard label="Active Requests" value={String(activeCount)} icon={Briefcase} />
        <StatCard label="Viewings" value={String(viewingCount)} icon={CalendarCheck} />
        <StatCard label="Closed / Won" value={String(closedCount)} icon={CheckCircle2} />
      </div>
    </div>
  );
}
