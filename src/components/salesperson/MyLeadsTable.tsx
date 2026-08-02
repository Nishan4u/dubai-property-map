"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import type { CrmClientRow } from "@/lib/supabase/queries";

const statusOptions = [
  "new",
  "broker_contacted",
  "requirement_confirmed",
  "units_shared",
  "viewing_scheduled",
  "negotiation",
  "booking",
  "closed_won",
  "on_hold",
  "lost",
  "cancelled",
] as const;

const statusTone: Record<(typeof statusOptions)[number], "gold" | "blue" | "green" | "red" | "neutral"> = {
  new: "gold",
  broker_contacted: "blue",
  requirement_confirmed: "blue",
  units_shared: "blue",
  viewing_scheduled: "blue",
  negotiation: "blue",
  booking: "green",
  closed_won: "green",
  on_hold: "neutral",
  lost: "red",
  cancelled: "red",
};

interface LeadRow {
  id: string;
  request_id: string;
  status: string;
  property_type: string;
  bedrooms: string | null;
  budget_min: number | null;
  budget_max: number | null;
  broker_notes: string | null;
  client_id: string | null;
  created_at: string;
  brokers: { full_name: string; brn: string; mobile: string; whatsapp: string; email: string } | null;
  projects: { name: string } | null;
}

export function MyLeadsTable({ leads, clients }: { leads: LeadRow[]; clients: CrmClientRow[] }) {
  const router = useRouter();
  const [savingId, setSavingId] = useState<string | null>(null);

  async function handleStatusChange(lead: LeadRow, nextStatus: string) {
    setSavingId(lead.id);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.from("property_requests").update({ status: nextStatus, updated_at: new Date().toISOString() }).eq("id", lead.id);
    await supabase.from("property_request_status_history").insert({
      request_id: lead.id,
      from_status: lead.status,
      to_status: nextStatus,
      changed_by: user?.id ?? null,
    });

    router.refresh();
    setSavingId(null);
  }

  // Unlike the broker side, no dedicated route is needed here -- the
  // existing "salesperson updates assigned" RLS policy on property_requests
  // has no column restriction (it's the same policy handleStatusChange
  // above already relies on), so setting client_id is just another direct
  // update.
  async function handleClientChange(lead: LeadRow, nextClientId: string) {
    setSavingId(lead.id);
    const supabase = createClient();
    await supabase
      .from("property_requests")
      .update({ client_id: nextClientId || null, updated_at: new Date().toISOString() })
      .eq("id", lead.id);
    router.refresh();
    setSavingId(null);
  }

  return (
    <DataTable
      columns={[
        { header: "Request", render: (l) => <span className="font-mono text-xs text-ink-300">{l.request_id}</span> },
        {
          header: "Broker",
          render: (l) =>
            l.brokers ? (
              <div>
                <p className="font-medium text-ink-100">{l.brokers.full_name}</p>
                <div className="mt-0.5 flex items-center gap-2 text-ink-500">
                  <a href={`tel:${l.brokers.mobile}`} title="Call" className="hover:text-gold-400"><Phone className="h-3 w-3" /></a>
                  <a href={`https://wa.me/${l.brokers.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" title="WhatsApp" className="hover:text-gold-400"><MessageCircle className="h-3 w-3" /></a>
                  <a href={`mailto:${l.brokers.email}`} title="Email" className="hover:text-gold-400"><Mail className="h-3 w-3" /></a>
                </div>
              </div>
            ) : (
              "—"
            ),
        },
        { header: "Project", render: (l) => l.projects?.name ?? "—" },
        {
          header: "Requirement",
          render: (l) => (
            <span className="text-xs text-ink-400">
              {l.property_type} · {l.bedrooms ?? "—"}
              {l.budget_min || l.budget_max ? (
                <>
                  {" "}
                  · AED {l.budget_min?.toLocaleString() ?? "—"}–{l.budget_max?.toLocaleString() ?? "—"}
                </>
              ) : null}
            </span>
          ),
        },
        {
          header: "Status",
          render: (l) => (
            <div className="flex items-center gap-2">
              <Badge tone={statusTone[l.status as (typeof statusOptions)[number]] ?? "neutral"}>
                {l.status.replace(/_/g, " ")}
              </Badge>
              <select
                disabled={savingId === l.id}
                value={l.status}
                onChange={(e) => handleStatusChange(l, e.target.value)}
                className="rounded-md border border-navy-600 bg-navy-800 px-1.5 py-1 text-[11px] text-ink-300 focus:outline-none"
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
          ),
        },
        {
          header: "Client",
          render: (l) => (
            <select
              disabled={savingId === l.id}
              value={l.client_id ?? ""}
              onChange={(e) => handleClientChange(l, e.target.value)}
              className="rounded-md border border-navy-600 bg-navy-800 px-1.5 py-1 text-[11px] text-ink-300 focus:outline-none"
            >
              <option value="">Unlinked</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </select>
          ),
        },
        { header: "Date", render: (l) => new Date(l.created_at).toLocaleDateString() },
      ]}
      rows={leads}
    />
  );
}
