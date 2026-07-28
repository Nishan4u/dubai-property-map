import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { BrokerForceLogoutButton } from "@/components/admin/BrokerForceLogoutButton";
import { createClient } from "@/lib/supabase/server";
import type { DbBrokerAccountStatus, DbBrokerSubscriptionStatus } from "@/types/database";

export const dynamic = "force-dynamic";

const accountTone: Record<DbBrokerAccountStatus, "green" | "gold" | "red"> = {
  pending_verification: "gold",
  approved: "green",
  rejected: "red",
  suspended: "red",
  blocked: "red",
};

const subscriptionTone: Record<DbBrokerSubscriptionStatus, "green" | "gold" | "red" | "neutral"> = {
  no_subscription: "neutral",
  payment_pending: "gold",
  active: "green",
  expired: "red",
  cancelled: "neutral",
  payment_failed: "red",
  suspended: "red",
};

export default async function AdminBrokerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: broker } = await supabase.from("brokers").select("*, brokerages(name)").eq("id", id).single();
  if (!broker) notFound();

  const [{ data: sessions }, { data: requests }] = await Promise.all([
    supabase.from("broker_sessions").select("*").eq("broker_id", id).order("created_at", { ascending: false }),
    supabase.from("property_requests").select("request_id, status, created_at, projects(name)").eq("broker_id", id).order("created_at", { ascending: false }),
  ]);

  let reraSignedUrl: string | null = null;
  if (broker.rera_card_path) {
    const { data } = await supabase.storage.from("broker-documents").createSignedUrl(broker.rera_card_path, 3600);
    reraSignedUrl = data?.signedUrl ?? null;
  }
  let licenseSignedUrl: string | null = null;
  if (broker.license_path) {
    const { data } = await supabase.storage.from("broker-documents").createSignedUrl(broker.license_path, 3600);
    licenseSignedUrl = data?.signedUrl ?? null;
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link href="/admin/brokers" className="text-xs text-ink-500 hover:text-ink-300">← Back to Brokers</Link>
        <h1 className="mt-1 text-xl font-bold text-ink-100">{broker.full_name}</h1>
        <p className="text-sm text-ink-400">{broker.brokerages?.name ?? "Independent Broker"} · BRN {broker.brn} · ORN {broker.orn}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-navy-700 bg-navy-850 p-4">
          <p className="text-xs text-ink-500">Account Status</p>
          <Badge tone={accountTone[broker.account_status as DbBrokerAccountStatus]}>{broker.account_status.replace(/_/g, " ")}</Badge>
        </div>
        <div className="rounded-xl border border-navy-700 bg-navy-850 p-4">
          <p className="text-xs text-ink-500">Subscription</p>
          <Badge tone={subscriptionTone[broker.subscription_status as DbBrokerSubscriptionStatus]}>{broker.subscription_status.replace(/_/g, " ")}</Badge>
        </div>
        <div className="rounded-xl border border-navy-700 bg-navy-850 p-4">
          <p className="text-xs text-ink-500">Contact</p>
          <p className="text-sm text-ink-100">{broker.mobile} · {broker.email}</p>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-ink-100">RERA Card</h2>
        {reraSignedUrl ? (
          <a href={reraSignedUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-gold-400 hover:underline">
            View document (signed link, expires in 1 hour)
          </a>
        ) : (
          <p className="text-sm text-ink-500">No document uploaded.</p>
        )}
      </div>

      {!broker.brokerage_id && (
        <div>
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-100">
            Broker License
            <Badge tone={broker.license_status === "approved" ? "green" : broker.license_status === "rejected" ? "red" : "gold"}>
              {broker.license_status.replace(/_/g, " ")}
            </Badge>
          </h2>
          {licenseSignedUrl ? (
            <a href={licenseSignedUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-gold-400 hover:underline">
              View document (signed link, expires in 1 hour)
            </a>
          ) : (
            <p className="text-sm text-ink-500">No document uploaded — required for independent brokers.</p>
          )}
        </div>
      )}

      <div>
        <h2 className="mb-2 text-sm font-semibold text-ink-100">Device Sessions</h2>
        <DataTable
          columns={[
            { header: "Device", render: (s) => s.device_label },
            { header: "IP", render: (s) => s.ip ?? "—" },
            { header: "Status", render: (s) => <Badge tone={s.status === "active" ? "green" : "neutral"}>{s.status}</Badge> },
            { header: "Last Active", render: (s) => new Date(s.last_active).toLocaleString() },
            { header: "", render: (s) => (s.status === "active" ? <BrokerForceLogoutButton brokerId={id} /> : null) },
          ]}
          rows={sessions ?? []}
        />
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-ink-100">Request History</h2>
        <DataTable
          columns={[
            { header: "Request", render: (r) => <span className="font-mono text-xs">{r.request_id}</span> },
            {
              header: "Project",
              render: (r) => {
                const project = r.projects as { name: string } | { name: string }[] | null;
                return (Array.isArray(project) ? project[0]?.name : project?.name) ?? "—";
              },
            },
            { header: "Status", render: (r) => r.status.replace(/_/g, " ") },
            { header: "Date", render: (r) => new Date(r.created_at).toLocaleDateString() },
          ]}
          rows={(requests ?? []).map((r, i) => ({ ...r, id: r.request_id ?? String(i) }))}
        />
      </div>
    </div>
  );
}
