"use client";

import { Badge } from "@/components/ui/Badge";
import { SearchableDataTable } from "@/components/admin/SearchableDataTable";
import { DeleteSalespersonButton } from "@/components/admin/DeleteSalespersonButton";
import type { SalespersonRow } from "@/types/database";

export function SalespersonsTable({
  salespersons,
}: {
  salespersons: (SalespersonRow & { developers: { name: string } | null })[];
}) {
  return (
    <SearchableDataTable
      searchPlaceholder="Search salespersons by name, email or developer..."
      searchFields={(s) => [s.full_name, s.email, s.job_title, s.developers?.name]}
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
          render: (s) => (
            <Badge tone={s.status === "active" ? "green" : s.status === "pending_invitation" ? "gold" : "neutral"}>
              {s.status.replace(/_/g, " ")}
            </Badge>
          ),
        },
        {
          header: "",
          render: (s) => <DeleteSalespersonButton salespersonId={s.id} salespersonName={s.full_name} />,
        },
      ]}
      rows={salespersons}
    />
  );
}
