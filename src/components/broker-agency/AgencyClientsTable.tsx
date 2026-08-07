"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logAudit } from "@/lib/auditLog";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import type { CrmClientRow } from "@/lib/supabase/queries";

// Mirrors src/components/broker/BrokerClientsTable.tsx -- see it for
// context. Kept as its own copy rather than shared since broker/broker-
// agency portals are otherwise fully separate component trees in this
// codebase.
export function AgencyClientsTable({ brokerageId, clients }: { brokerageId: string; clients: CrmClientRow[] }) {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("crm_clients")
      .insert({
        owner_type: "broker_agency",
        brokerage_id: brokerageId,
        full_name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
      })
      .select("id")
      .single();

    if (insertError || !data) {
      setError(insertError?.message ?? "Could not create client.");
      setSaving(false);
      return;
    }

    await logAudit("crm_client.create", "crm_client", data.id, { fullName: name.trim() });
    setName("");
    setEmail("");
    setPhone("");
    setShowNew(false);
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg border border-rose-600/40 bg-rose-500/10 px-4 py-2 text-xs font-medium text-rose-300">{error}</p>
      )}

      {showNew ? (
        <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3 rounded-xl border border-navy-700 bg-navy-850 p-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Create"}
          </button>
          <button
            type="button"
            onClick={() => setShowNew(false)}
            className="rounded-lg border border-navy-600 px-4 py-2 text-sm font-medium text-ink-300 hover:text-ink-100"
          >
            Cancel
          </button>
        </form>
      ) : (
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400"
        >
          <Plus className="h-4 w-4" /> New Client
        </button>
      )}

      <DataTable
        columns={[
          {
            header: "Name",
            render: (c) => (
              <Link href={`/broker-agency/clients/${c.id}`} className="font-medium text-ink-100 hover:text-gold-400">
                {c.full_name}
              </Link>
            ),
          },
          { header: "Email", render: (c) => c.email ?? "—" },
          { header: "Phone", render: (c) => c.phone ?? "—" },
          { header: "Status", render: (c) => <Badge tone={c.status === "active" ? "green" : "neutral"}>{c.status}</Badge> },
          { header: "Added", render: (c) => new Date(c.created_at).toLocaleDateString() },
        ]}
        rows={clients}
      />
    </div>
  );
}
