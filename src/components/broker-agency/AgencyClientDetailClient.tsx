"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { logAudit } from "@/lib/auditLog";
import { SectionCard } from "@/components/ui/SectionCard";
import { Badge } from "@/components/ui/Badge";
import type { getCrmClientDetailForBrokerAgency } from "@/lib/supabase/queries";

type ClientDetail = NonNullable<Awaited<ReturnType<typeof getCrmClientDetailForBrokerAgency>>>;

// Scoped-down counterpart to BrokerClientDetailClient.tsx -- an agency's
// client record covers contact info + notes, not the full broker feature
// set (linked property requests, unit reservations, tasks, communication
// log): agency_property_requests deliberately never links to crm_clients
// (patch_68), so a "Linked Requests" section would only ever be empty and
// misleading here, and the rest is a reasonable, honestly-scoped first
// pass rather than a 1:1 port.
export function AgencyClientDetailClient({ detail }: { detail: ClientDetail }) {
  const router = useRouter();
  const { client, notes } = detail;

  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(client.full_name);
  const [email, setEmail] = useState(client.email ?? "");
  const [phone, setPhone] = useState(client.phone ?? "");
  const [whatsapp, setWhatsapp] = useState(client.whatsapp ?? "");
  const [saving, setSaving] = useState(false);

  const [noteBody, setNoteBody] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  async function handleSaveEdit() {
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("crm_clients")
      .update({
        full_name: fullName.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        whatsapp: whatsapp.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", client.id);
    await logAudit("crm_client.update", "crm_client", client.id, { fullName: fullName.trim() });
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteBody.trim()) return;
    setSavingNote(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from("crm_notes").insert({ client_id: client.id, body: noteBody.trim(), created_by: user?.id ?? null });
    setNoteBody("");
    setSavingNote(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <SectionCard
        title="Client"
        action={
          editing ? (
            <div className="flex gap-2">
              <button onClick={handleSaveEdit} disabled={saving} className="text-xs font-medium text-gold-400 hover:text-gold-300">
                {saving ? "Saving…" : "Save"}
              </button>
              <button onClick={() => setEditing(false)} className="text-xs font-medium text-ink-400 hover:text-ink-200">
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} className="text-xs font-medium text-gold-400 hover:text-gold-300">
              Edit
            </button>
          )
        }
      >
        {editing ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-400">Name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-1.5 text-sm text-ink-100 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-400">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-1.5 text-sm text-ink-100 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-400">Phone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-1.5 text-sm text-ink-100 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-400">WhatsApp</label>
              <input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-1.5 text-sm text-ink-100 focus:outline-none"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <p><span className="text-ink-500">Name:</span> <span className="text-ink-100">{client.full_name}</span></p>
            <p><span className="text-ink-500">Status:</span> <Badge tone={client.status === "active" ? "green" : "neutral"}>{client.status}</Badge></p>
            <p><span className="text-ink-500">Email:</span> <span className="text-ink-100">{client.email ?? "—"}</span></p>
            <p><span className="text-ink-500">Phone:</span> <span className="text-ink-100">{client.phone ?? "—"}</span></p>
            <p><span className="text-ink-500">WhatsApp:</span> <span className="text-ink-100">{client.whatsapp ?? "—"}</span></p>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Notes">
        <form onSubmit={handleAddNote} className="mb-3 flex flex-wrap items-end gap-2">
          <textarea
            value={noteBody}
            onChange={(e) => setNoteBody(e.target.value)}
            placeholder="Add a note…"
            rows={2}
            className="min-w-48 flex-1 rounded-lg border border-navy-600 bg-navy-800 px-3 py-1.5 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={savingNote}
            className="rounded-lg bg-gold-500 px-3 py-1.5 text-xs font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
          >
            Add Note
          </button>
        </form>
        {notes.length === 0 ? (
          <p className="text-sm text-ink-500">No notes yet.</p>
        ) : (
          <div className="space-y-1.5">
            {notes.map((n) => (
              <div key={n.id} className="rounded-lg border border-navy-700 bg-navy-900 px-3 py-2 text-sm">
                <p className="text-ink-200">{n.body}</p>
                <p className="mt-1 text-xs text-ink-500">{new Date(n.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <Link href="/broker-agency/clients" className="inline-block text-xs text-ink-500 hover:text-ink-300">
        ← Back to Clients
      </Link>
    </div>
  );
}
