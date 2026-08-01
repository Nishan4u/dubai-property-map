import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { EmailLogActions } from "@/components/admin/EmailLogActions";
import { EmailLogsFilterBar } from "@/components/admin/EmailLogsFilterBar";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const statusTone: Record<string, "gold" | "green" | "red" | "neutral"> = {
  pending: "gold",
  sent: "green",
  delivered: "green",
  failed: "red",
  bounced: "red",
  complained: "red",
};

export default async function AdminEmailLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("email_logs").select("*").order("created_at", { ascending: false }).limit(200);
  if (status) query = query.eq("status", status);
  if (q) query = query.or(`subject.ilike.%${q}%,to_email.ilike.%${q}%`);

  const { data: logs } = await query;

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Email Logs</h1>
        <p className="text-sm text-ink-400">Every transactional email the platform has attempted to send (broker approvals, property-request notifications, OTPs, reminders).</p>
      </div>

      <EmailLogsFilterBar />

      <DataTable
        columns={[
          { header: "Category", render: (l) => l.category },
          { header: "To", render: (l) => l.to_email },
          { header: "Subject", render: (l) => <span className="max-w-xs truncate">{l.subject}</span> },
          { header: "Reply-To", render: (l) => l.reply_to ?? "—" },
          { header: "Status", render: (l) => <Badge tone={statusTone[l.status] ?? "neutral"}>{l.status}</Badge> },
          { header: "Error", render: (l) => l.last_error ? <span className="text-xs text-rose-400">{l.last_error}</span> : "—" },
          { header: "Date", render: (l) => new Date(l.created_at).toLocaleString() },
          { header: "", render: (l) => <EmailLogActions logId={l.id} /> },
        ]}
        rows={logs ?? []}
      />
    </div>
  );
}
