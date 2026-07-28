import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { SalespersonActions } from "@/components/dashboard/SalespersonActions";
import { SalespersonInvitationActions } from "@/components/dashboard/SalespersonInvitationActions";
import { getSalespersonsForDeveloper, requireDeveloperProfile } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

// A row is either self-registered (already went through Supabase's own
// email confirmation) or developer-invited: pending_invitation until the
// salesperson accepts and sets their own password, at which point it
// becomes active the same as a self-registered row.
function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  return `${local.charAt(0)}***@${domain}`;
}

export default async function DeveloperSalespersonsPage() {
  const profile = await requireDeveloperProfile();
  const salespersons = await getSalespersonsForDeveloper(profile.developer_id);

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Salespersons</h1>
        <p className="text-sm text-ink-400">
          {salespersons.length} salesperson{salespersons.length === 1 ? "" : "s"} on your sales team.
          Brokers select from this roster when submitting a property request.
        </p>
      </div>

      <DataTable
        columns={[
          {
            header: "Salesperson",
            render: (s) => (
              <div className="flex items-center gap-2">
                {s.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.photo_url} alt={s.full_name} className="h-6 w-6 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold-500 text-[10px] font-bold text-navy-950">
                    {s.full_name.charAt(0)}
                  </span>
                )}
                <span className="font-medium text-ink-100">{s.full_name}</span>
              </div>
            ),
          },
          { header: "Job Title", render: (s) => s.job_title ?? "—" },
          { header: "Developer Email", render: (s) => maskEmail(s.email) },
          {
            header: "Verification",
            render: (s) => {
              if (s.status !== "pending_invitation") return <Badge tone="green">Verified</Badge>;
              const invitationStatus = s.invitations?.status ?? "sent";
              if (invitationStatus === "failed") return <Badge tone="red">Send Failed</Badge>;
              if (invitationStatus === "expired") return <Badge tone="red">Invitation Expired</Badge>;
              return <Badge tone="gold">Invitation Sent</Badge>;
            },
          },
          {
            header: "Status",
            render: (s) => (
              <Badge tone={s.status === "active" ? "green" : s.status === "pending_invitation" ? "gold" : "neutral"}>
                {s.status.replace(/_/g, " ")}
              </Badge>
            ),
          },
          {
            header: "",
            render: (s) =>
              s.status === "pending_invitation" ? (
                <SalespersonInvitationActions invitationId={s.invitation_id} />
              ) : (
                <SalespersonActions salespersonId={s.id} fullName={s.full_name} />
              ),
          },
        ]}
        rows={salespersons}
      />
    </div>
  );
}
