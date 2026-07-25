import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { CreateSalespersonForm } from "@/components/dashboard/CreateSalespersonForm";
import { SalespersonActions } from "@/components/dashboard/SalespersonActions";
import { getSalespersonsForDeveloper, requireDeveloperProfile } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

// Every row in this table already went through Supabase's own email
// confirmation (self-registration) or was created directly by this
// developer with a known-good address (admin-invite flow) — there's no
// "pending verification" state to represent here, since a salesperson row
// only ever exists once one of those two is already true.
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

      <CreateSalespersonForm />

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
          { header: "Verification", render: () => <Badge tone="green">Verified</Badge> },
          {
            header: "Status",
            render: (s) => <Badge tone={s.status === "active" ? "green" : "neutral"}>{s.status}</Badge>,
          },
          {
            header: "",
            render: (s) => <SalespersonActions salespersonId={s.id} status={s.status as "active" | "inactive"} />,
          },
        ]}
        rows={salespersons}
      />
    </div>
  );
}
