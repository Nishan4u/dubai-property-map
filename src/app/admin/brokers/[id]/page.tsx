import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { BrokerForceLogoutButton } from "@/components/admin/BrokerForceLogoutButton";
import { BrokerVerificationPanel } from "@/components/admin/BrokerVerificationPanel";
import { BrokerListingModerationActions } from "@/components/admin/BrokerListingModerationActions";
import { createClient } from "@/lib/supabase/server";
import type { DbBrokerAccountStatus, DbBrokerSubscriptionStatus, DbBrokerListingModeration } from "@/types/database";

const listingModerationTone: Record<DbBrokerListingModeration, "green" | "gold" | "red" | "neutral"> = {
  pending: "gold",
  approved: "green",
  rejected: "red",
  archived: "neutral",
};

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

  const [{ data: sessions }, { data: requests }, { data: listings }] = await Promise.all([
    supabase.from("broker_sessions").select("*").eq("broker_id", id).order("created_at", { ascending: false }),
    supabase.from("property_requests").select("request_id, status, created_at, projects(name)").eq("broker_id", id).order("created_at", { ascending: false }),
    supabase.from("broker_listings").select("*").eq("broker_id", id).order("created_at", { ascending: false }),
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

      {/* Falls back safely before patch_127 is applied (new columns don't
          exist yet on the brokers table, so select("*") just omits them
          rather than erroring -- these defaults keep this page from
          crashing on undefined instead of "not configured yet"). */}
      <BrokerVerificationPanel
        brokerId={id}
        verificationStatus={broker.verification_status ?? "none"}
        verificationExpiresAt={broker.verification_expires_at ?? null}
        featured={broker.featured ?? false}
      />

      <div>
        <h2 className="mb-2 text-sm font-semibold text-ink-100">Property Listings ({(listings ?? []).length})</h2>
        <DataTable
          columns={[
            { header: "Title", render: (l) => l.title },
            { header: "Type", render: (l) => <span className="capitalize">{l.listing_type}</span> },
            { header: "Price", render: (l) => `AED ${l.price_aed.toLocaleString()}` },
            { header: "Review", render: (l) => <Badge tone={listingModerationTone[l.moderation_status as DbBrokerListingModeration]}>{l.moderation_status}</Badge> },
            { header: "Actions", render: (l) => <BrokerListingModerationActions listingId={l.id} /> },
          ]}
          rows={listings ?? []}
        />
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
