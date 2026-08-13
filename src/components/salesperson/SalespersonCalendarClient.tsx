"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link2, MapPin, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SectionCard } from "@/components/ui/SectionCard";
import { Badge } from "@/components/ui/Badge";
import { MonthCalendar } from "@/components/ui/MonthCalendar";
import { CompactSelect } from "@/components/public/CompactSelect";
import type { CrmClientRow } from "@/lib/supabase/queries";

interface Appointment {
  id: string;
  title: string;
  scheduled_at: string;
  duration_minutes: number | null;
  location: string | null;
  meeting_link: string | null;
  status: string;
  client_id: string | null;
  crm_clients: { full_name: string } | { full_name: string }[] | null;
}

const statusTone: Record<string, "neutral" | "gold" | "green" | "red" | "blue"> = {
  scheduled: "gold",
  completed: "green",
  cancelled: "red",
};

// Mirrors src/components/broker/BrokerCalendarClient.tsx -- see it for
// context. Kept as its own copy rather than a shared component since
// broker/salesperson portals are otherwise fully separate component
// trees in this codebase.
export function SalespersonCalendarClient({
  salespersonId,
  appointments: initialAppointments,
  clients,
}: {
  salespersonId: string;
  appointments: Appointment[];
  clients: CrmClientRow[];
}) {
  const router = useRouter();
  const [appointments, setAppointments] = useState(initialAppointments);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [location, setLocation] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [clientId, setClientId] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !date || !time) return;
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("crm_appointments")
      .insert({
        owner_type: "salesperson",
        salesperson_id: salespersonId,
        client_id: clientId || null,
        title: title.trim(),
        scheduled_at: new Date(`${date}T${time}`).toISOString(),
        duration_minutes: durationMinutes ? Number(durationMinutes) : null,
        location: location.trim() || null,
        meeting_link: meetingLink.trim() || null,
      })
      .select("*, crm_clients(full_name)")
      .single();

    if (!error && data) {
      setAppointments((prev) => [...prev, data].sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at)));
      setShowForm(false);
      setTitle("");
      setDate("");
      setTime("");
      setDurationMinutes("");
      setLocation("");
      setMeetingLink("");
      setClientId("");
    }
    setSaving(false);
  }

  async function handleStatusChange(id: string, status: string) {
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    const supabase = createClient();
    await supabase.from("crm_appointments").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this appointment?")) return;
    setAppointments((prev) => prev.filter((a) => a.id !== id));
    const supabase = createClient();
    await supabase.from("crm_appointments").delete().eq("id", id);
  }

  const now = new Date();
  const upcoming = appointments.filter((a) => a.status === "scheduled" && new Date(a.scheduled_at) >= now);
  const calendarItems = appointments.map((a) => ({
    id: a.id,
    date: a.scheduled_at.slice(0, 10),
    label: a.title,
  }));

  return (
    <div className="space-y-4">
      <MonthCalendar items={calendarItems} />

      <SectionCard
        title="Appointments"
        action={
          !showForm && (
            <button onClick={() => setShowForm(true)} className="text-xs font-medium text-gold-400 hover:text-gold-300">
              + New Appointment
            </button>
          )
        }
      >
        {showForm && (
          <form onSubmit={handleCreate} className="mb-4 grid grid-cols-1 gap-3 rounded-lg border border-navy-700 bg-navy-900 p-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-ink-400">Title</label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Site visit with client"
                className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-1.5 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-400">Date</label>
              <input
                required
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-1.5 text-sm text-ink-100 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-400">Time</label>
              <input
                required
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-1.5 text-sm text-ink-100 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-400">Duration (minutes, optional)</label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-1.5 text-sm text-ink-100 focus:outline-none"
              />
            </div>
            <div>
              <CompactSelect
                label="Client (optional)"
                placeholder="No client"
                value={clientId}
                onChange={setClientId}
                options={clients.map((c) => ({ label: c.full_name, value: c.id }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-400">Location (optional)</label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Sales gallery"
                className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-1.5 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-400">Meeting Link (optional)</label>
              <input
                type="url"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="https://meet.google.com/…"
                className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-1.5 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
              />
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
              >
                {saving ? "Saving…" : "Create Appointment"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-navy-600 px-4 py-2 text-sm font-medium text-ink-300 hover:text-ink-100"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {upcoming.length === 0 ? (
          <p className="text-sm text-ink-500">No upcoming appointments.</p>
        ) : (
          <div className="space-y-1.5">
            {upcoming.map((a) => {
              const client = Array.isArray(a.crm_clients) ? a.crm_clients[0] : a.crm_clients;
              return (
                <div key={a.id} className="rounded-lg border border-navy-700 bg-navy-900 px-3 py-2 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-ink-100">
                        {a.title} {client && <span className="text-ink-500">· {client.full_name}</span>}
                      </p>
                      <p className="flex flex-wrap items-center gap-2 text-xs text-ink-500">
                        {new Date(a.scheduled_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                        {a.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {a.location}
                          </span>
                        )}
                        {a.meeting_link && (
                          <a
                            href={a.meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-gold-400 hover:text-gold-300"
                          >
                            <Link2 className="h-3 w-3" /> Join Meeting
                          </a>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={statusTone[a.status]}>{a.status}</Badge>
                      <button
                        onClick={() => handleStatusChange(a.id, "completed")}
                        className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
                      >
                        Complete
                      </button>
                      <button
                        onClick={() => handleStatusChange(a.id, "cancelled")}
                        className="text-xs font-medium text-rose-400 hover:text-rose-300"
                      >
                        Cancel
                      </button>
                      <button onClick={() => handleDelete(a.id)} className="text-ink-600 hover:text-rose-400">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
