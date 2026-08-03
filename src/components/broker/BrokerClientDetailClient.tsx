"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logAudit } from "@/lib/auditLog";
import { SectionCard } from "@/components/ui/SectionCard";
import { Badge } from "@/components/ui/Badge";
import { BrokerReservationsSection } from "@/components/broker/BrokerReservationsSection";
import type { getCrmClientDetailForBroker } from "@/lib/supabase/queries";

type ClientDetail = NonNullable<Awaited<ReturnType<typeof getCrmClientDetailForBroker>>>;

export function BrokerClientDetailClient({
  detail,
  projects,
}: {
  detail: ClientDetail;
  projects: { id: string; name: string }[];
}) {
  const router = useRouter();
  const { client, requests, notes, tasks, reservations } = detail;

  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(client.full_name);
  const [email, setEmail] = useState(client.email ?? "");
  const [phone, setPhone] = useState(client.phone ?? "");
  const [whatsapp, setWhatsapp] = useState(client.whatsapp ?? "");
  const [saving, setSaving] = useState(false);

  const [noteBody, setNoteBody] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [savingTask, setSavingTask] = useState(false);

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

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    setSavingTask(true);
    const supabase = createClient();
    await supabase.from("crm_tasks").insert({
      client_id: client.id,
      title: taskTitle.trim(),
      due_at: taskDue ? new Date(taskDue).toISOString() : null,
    });
    setTaskTitle("");
    setTaskDue("");
    setSavingTask(false);
    router.refresh();
  }

  async function handleToggleTask(taskId: string, currentStatus: string) {
    const supabase = createClient();
    await supabase
      .from("crm_tasks")
      .update({ status: currentStatus === "done" ? "pending" : "done", updated_at: new Date().toISOString() })
      .eq("id", taskId);
    router.refresh();
  }

  async function handleDeleteTask(taskId: string) {
    const supabase = createClient();
    await supabase.from("crm_tasks").delete().eq("id", taskId);
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

      <SectionCard title="Linked Requests">
        {requests.length === 0 ? (
          <p className="text-sm text-ink-500">No property requests linked to this client yet.</p>
        ) : (
          <div className="space-y-1.5">
            {requests.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-navy-700 bg-navy-900 px-3 py-2 text-sm">
                <span className="font-mono text-xs text-ink-300">{r.request_id}</span>
                <span className="text-ink-400">{(Array.isArray(r.projects) ? r.projects[0] : r.projects)?.name ?? "—"}</span>
                <Badge tone="blue">{r.status.replace(/_/g, " ")}</Badge>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <BrokerReservationsSection clientId={client.id} reservations={reservations} projects={projects} />

      <SectionCard title="Tasks & Follow-ups">
        <form onSubmit={handleAddTask} className="mb-3 flex flex-wrap items-end gap-2">
          <input
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="e.g. Call to confirm viewing"
            className="min-w-48 flex-1 rounded-lg border border-navy-600 bg-navy-800 px-3 py-1.5 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
          />
          <input
            type="date"
            value={taskDue}
            onChange={(e) => setTaskDue(e.target.value)}
            className="rounded-lg border border-navy-600 bg-navy-800 px-3 py-1.5 text-sm text-ink-100 focus:outline-none"
          />
          <button
            type="submit"
            disabled={savingTask}
            className="rounded-lg bg-gold-500 px-3 py-1.5 text-xs font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
          >
            Add
          </button>
        </form>
        {tasks.length === 0 ? (
          <p className="text-sm text-ink-500">No tasks yet.</p>
        ) : (
          <div className="space-y-1.5">
            {tasks.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-lg border border-navy-700 bg-navy-900 px-3 py-2 text-sm">
                <button
                  onClick={() => handleToggleTask(t.id, t.status)}
                  className="flex items-center gap-2 text-left"
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${t.status === "done" ? "border-emerald-500 bg-emerald-500/20" : "border-navy-600"}`}
                  >
                    {t.status === "done" && <Check className="h-3 w-3 text-emerald-400" />}
                  </span>
                  <span className={t.status === "done" ? "text-ink-500 line-through" : "text-ink-100"}>{t.title}</span>
                </button>
                <div className="flex items-center gap-3">
                  {t.due_at && <span className="text-xs text-ink-500">{new Date(t.due_at).toLocaleDateString()}</span>}
                  <button onClick={() => handleDeleteTask(t.id)} className="text-ink-600 hover:text-rose-400">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
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

      <Link href="/broker/clients" className="inline-block text-xs text-ink-500 hover:text-ink-300">
        ← Back to Clients
      </Link>
    </div>
  );
}
