"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { List, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { createClient } from "@/lib/supabase/client";
import { notifyUser } from "@/lib/notify";
import type { DbBookingStatus } from "@/types/database";

interface BookingRow {
  id: string;
  client_name: string;
  scheduled_date: string;
  scheduled_time: string | null;
  agent: string | null;
  status: string;
  created_by: string | null;
  project_id: string;
  projects?: { name: string } | null;
}

const statusMessage: Record<DbBookingStatus, (projectName: string, date: string) => string> = {
  confirmed: (name, date) => `Your viewing for ${name} on ${date} has been confirmed.`,
  completed: (name) => `Your viewing for ${name} has been marked completed.`,
  cancelled: (name) => `Your viewing for ${name} has been cancelled.`,
};

const statusTone: Record<DbBookingStatus, "green" | "red" | "blue"> = {
  confirmed: "blue",
  completed: "green",
  cancelled: "red",
};

const statusOptions: DbBookingStatus[] = ["confirmed", "completed", "cancelled"];

export function BookingsTableClient({ bookings }: { bookings: BookingRow[] }) {
  const [rows, setRows] = useState(bookings);
  const [view, setView] = useState<"table" | "calendar">("table");

  async function updateStatus(id: string, status: DbBookingStatus) {
    setRows((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
    const supabase = createClient();
    await supabase.from("bookings").update({ status }).eq("id", id);

    const booking = rows.find((b) => b.id === id);
    if (booking?.created_by) {
      await notifyUser(
        booking.created_by,
        statusMessage[status](
          booking.projects?.name ?? "your project",
          new Date(booking.scheduled_date).toLocaleDateString()
        ),
        booking.project_id
      );
    }
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink-100">Bookings</h1>
          <p className="text-sm text-ink-400">
            Viewing appointments scheduled across your projects.
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border border-navy-700 p-1">
          <button
            onClick={() => setView("table")}
            className={clsx(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium",
              view === "table" ? "bg-gold-500 text-navy-950" : "text-ink-300 hover:text-ink-100"
            )}
          >
            <List className="h-3.5 w-3.5" /> Table
          </button>
          <button
            onClick={() => setView("calendar")}
            className={clsx(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium",
              view === "calendar" ? "bg-gold-500 text-navy-950" : "text-ink-300 hover:text-ink-100"
            )}
          >
            <CalendarDays className="h-3.5 w-3.5" /> Calendar
          </button>
        </div>
      </div>

      {view === "table" ? (
        <DataTable
          columns={[
            { header: "Project", render: (b) => <span className="font-medium text-ink-100">{b.projects?.name ?? "—"}</span> },
            { header: "Client", render: (b) => b.client_name },
            { header: "Date", render: (b) => new Date(b.scheduled_date).toLocaleDateString() },
            { header: "Time", render: (b) => b.scheduled_time ?? "—" },
            { header: "Agent", render: (b) => b.agent ?? "Unassigned" },
            {
              header: "Status",
              render: (b) => (
                <select
                  value={b.status}
                  onChange={(e) => updateStatus(b.id, e.target.value as DbBookingStatus)}
                  className="rounded-lg border border-navy-600 bg-navy-800 px-2 py-1 text-xs text-ink-100 focus:outline-none"
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              ),
            },
          ]}
          rows={rows}
        />
      ) : (
        <CalendarView bookings={rows} />
      )}
    </div>
  );
}

function CalendarView({ bookings }: { bookings: BookingRow[] }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const base = new Date();
  base.setDate(1);
  base.setMonth(base.getMonth() + monthOffset);
  const year = base.getFullYear();
  const month = base.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const byDate = new Map<string, BookingRow[]>();
  for (const b of bookings) {
    const key = b.scheduled_date;
    byDate.set(key, [...(byDate.get(key) ?? []), b]);
  }

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="rounded-xl border border-navy-700 bg-navy-850 p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => setMonthOffset((m) => m - 1)}
          className="rounded-lg border border-navy-600 px-2 py-1 text-xs text-ink-300 hover:text-ink-100"
        >
          ‹
        </button>
        <p className="text-sm font-semibold text-ink-100">
          {base.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </p>
        <button
          onClick={() => setMonthOffset((m) => m + 1)}
          className="rounded-lg border border-navy-600 px-2 py-1 text-xs text-ink-300 hover:text-ink-100"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase text-ink-500">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayBookings = byDate.get(key) ?? [];
          return (
            <div
              key={i}
              className="min-h-[64px] rounded-lg border border-navy-800 p-1 text-left"
            >
              <p className="text-[10px] text-ink-500">{day}</p>
              {dayBookings.slice(0, 2).map((b) => (
                <p
                  key={b.id}
                  className="mt-0.5 truncate rounded bg-gold-500/15 px-1 py-0.5 text-[9px] text-gold-300"
                  title={`${b.client_name} — ${b.projects?.name ?? ""}`}
                >
                  {b.client_name}
                </p>
              ))}
              {dayBookings.length > 2 && (
                <p className="text-[9px] text-ink-500">+{dayBookings.length - 2} more</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
