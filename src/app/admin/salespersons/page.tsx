import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { getAllSalespersonsAdmin } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function AdminSalespersonsPage() {
  const salespersons = await getAllSalespersonsAdmin();

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Salespersons</h1>
        <p className="text-sm text-ink-400">{salespersons.length} salespersons across every developer on the platform.</p>
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
          { header: "Developer", render: (s) => s.developers?.name ?? "—" },
          { header: "Job Title", render: (s) => s.job_title ?? "—" },
          { header: "Email", render: (s) => s.email },
          {
            header: "Status",
            render: (s) => <Badge tone={s.status === "active" ? "green" : "neutral"}>{s.status}</Badge>,
          },
        ]}
        rows={salespersons}
      />
    </div>
  );
}
