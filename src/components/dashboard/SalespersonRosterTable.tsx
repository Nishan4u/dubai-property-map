"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { SalespersonActions } from "@/components/dashboard/SalespersonActions";
import { SalespersonInvitationActions } from "@/components/dashboard/SalespersonInvitationActions";
import type { getSalespersonsForDeveloper } from "@/lib/supabase/queries";

type Salesperson = Awaited<ReturnType<typeof getSalespersonsForDeveloper>>[number];

// A row is either self-registered (already went through Supabase's own
// email confirmation) or developer-invited: pending_invitation until the
// salesperson accepts and sets their own password, at which point it
// becomes active the same as a self-registered row.
function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  return `${local.charAt(0)}***@${domain}`;
}

// Client component so the search box can filter interactively -- the
// column render functions have to live here rather than being passed in
// as props from the server page, since functions can't cross the
// Server -> Client Component boundary in React Server Components.
export function SalespersonRosterTable({ salespersons }: { salespersons: Salesperson[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return salespersons;
    return salespersons.filter(
      (s) => s.full_name.toLowerCase().includes(q) || (s.job_title ?? "").toLowerCase().includes(q)
    );
  }, [salespersons, query]);

  return (
    <div className="space-y-3">
      <div className="relative max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or job title…"
          className="w-full rounded-lg border border-navy-600 bg-navy-800 py-2 pl-9 pr-3 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
        />
      </div>

      <DataTable
        columns={[
          {
            header: "Salesperson",
            render: (s) => (
              <Link href={`/dashboard/salespersons/${s.id}`} className="flex items-center gap-2 hover:opacity-80">
                {s.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.photo_url} alt={s.full_name} className="h-6 w-6 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold-500 text-[10px] font-bold text-navy-950">
                    {s.full_name.charAt(0)}
                  </span>
                )}
                <span className="font-medium text-ink-100 underline-offset-2 hover:underline">{s.full_name}</span>
              </Link>
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
        rows={filtered}
      />
    </div>
  );
}
