import { Bot, MessageSquare } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { TrendAreaChart } from "@/components/ui/Charts";
import { DataTable } from "@/components/ui/DataTable";
import type { getAiUsageReportAdmin } from "@/lib/supabase/queries";

const kindLabel: Record<string, string> = {
  mapai: "MapAI (public)",
  broker: "AI Broker Assistant",
  sales: "AI Sales Assistant",
};

export function AdminAiUsageReport({ report }: { report: Awaited<ReturnType<typeof getAiUsageReportAdmin>> }) {
  const { totalCalls, totalInputTokens, totalOutputTokens, byKind, usageTrend } = report;
  const rows = byKind.map((k) => ({ id: k.kind, ...k }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total AI Calls" value={totalCalls.toLocaleString()} icon={MessageSquare} />
        <StatCard label="Total Input Tokens" value={totalInputTokens.toLocaleString()} icon={Bot} />
        <StatCard label="Total Output Tokens" value={totalOutputTokens.toLocaleString()} icon={Bot} />
      </div>

      <SectionCard title="Token Usage Over Time">
        {usageTrend.length > 0 ? (
          <TrendAreaChart data={usageTrend} dataKey="tokens" color="#a78bfa" />
        ) : (
          <p className="py-10 text-center text-sm text-ink-500">No AI usage logged yet.</p>
        )}
      </SectionCard>

      <SectionCard title="Usage by Assistant">
        {rows.length > 0 ? (
          <DataTable
            columns={[
              { header: "Assistant", render: (r: (typeof rows)[number]) => kindLabel[r.kind] ?? r.kind },
              { header: "Calls", render: (r) => r.calls.toLocaleString() },
              { header: "Input Tokens", render: (r) => r.inputTokens.toLocaleString() },
              { header: "Output Tokens", render: (r) => r.outputTokens.toLocaleString() },
            ]}
            rows={rows}
          />
        ) : (
          <p className="py-6 text-center text-sm text-ink-500">No data yet.</p>
        )}
      </SectionCard>

      <p className="text-xs text-ink-500">
        These are real token counts recorded from each Anthropic API
        response, not a fabricated cost estimate — no pricing data is
        stored anywhere in this platform, so no dollar figure is shown
        here.
      </p>
    </div>
  );
}
