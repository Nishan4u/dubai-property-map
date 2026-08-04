import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { AdminCreateCampaignForm } from "@/components/admin/AdminCreateCampaignForm";
import { CampaignActions } from "@/components/admin/CampaignActions";
import { getAllMarketingCampaignsAdmin } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

const statusTone = {
  draft: "neutral",
  sending: "gold",
  sent: "green",
  failed: "red",
} as const;

export default async function AdminCampaignsPage() {
  const campaigns = await getAllMarketingCampaignsAdmin();

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Marketing Campaigns</h1>
        <p className="text-sm text-ink-400">
          Email and SMS campaigns sent to CRM clients. Email uses the same delivery pipeline as every other email
          on this platform (Resend). SMS needs TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM_NUMBER
          configured — without them, SMS sends are logged as failed with a clear reason rather than silently
          pretending to succeed.
        </p>
      </div>

      <AdminCreateCampaignForm />

      <DataTable
        columns={[
          { header: "Name", render: (c) => <span className="font-medium text-ink-100">{c.name}</span> },
          { header: "Channel", render: (c) => <Badge tone="blue">{c.channel.toUpperCase()}</Badge> },
          {
            header: "Status",
            render: (c) => <Badge tone={statusTone[c.status as keyof typeof statusTone]}>{c.status}</Badge>,
          },
          { header: "Recipients", render: (c) => c.recipient_count },
          { header: "Sent", render: (c) => c.sent_count },
          { header: "Failed", render: (c) => c.failed_count },
          { header: "Created", render: (c) => new Date(c.created_at).toLocaleDateString() },
          { header: "", render: (c) => <CampaignActions id={c.id} name={c.name} status={c.status} /> },
        ]}
        rows={campaigns}
      />
      {campaigns.length === 0 && <p className="text-sm text-ink-500">No campaigns yet.</p>}
    </div>
  );
}
