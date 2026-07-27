import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { EmailLogActions } from "@/components/admin/EmailLogActions";
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

      <form className="flex flex-wrap items-end gap-3 rounded-xl border border-navy-700 bg-navy-850 p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-400">Search (Request ID, subject, or email)</label>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="REQ-000001"
            className="rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-400">Status</label>
          <select
            name="status"
            defaultValue={status ?? ""}
            className="rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
          >
            <option value="">All</option>
            <option value="sent">Sent</option>
            <option value="delivered">Delivered</option>
            <option value="failed">Failed</option>
            <option value="bounced">Bounced</option>
            <option value="complained">Complained</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        <button type="submit" className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400">
          Filter
        </button>
      </form>

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
