"use client";

import { useState } from "react";

export interface MonthCalendarItem {
  id: string;
  date: string;
  label: string;
}

// Generic month-grid primitive -- same visual shape as the bookings
// calendar (src/components/dashboard/BookingsTableClient.tsx), extracted
// as a standalone, business-logic-free component so it can be reused for
// appointments too without touching that already-shipped file.
export function MonthCalendar({ items }: { items: MonthCalendarItem[] }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const base = new Date();
  base.setDate(1);
  base.setMonth(base.getMonth() + monthOffset);
  const year = base.getFullYear();
  const month = base.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const byDate = new Map<string, MonthCalendarItem[]>();
  for (const item of items) {
    byDate.set(item.date, [...(byDate.get(item.date) ?? []), item]);
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
          const dayItems = byDate.get(key) ?? [];
          return (
            <div key={i} className="min-h-[64px] rounded-lg border border-navy-800 p-1 text-left">
              <p className="text-[10px] text-ink-500">{day}</p>
              {dayItems.slice(0, 2).map((item) => (
                <p
                  key={item.id}
                  className="mt-0.5 truncate rounded bg-gold-500/15 px-1 py-0.5 text-[9px] text-gold-300"
                  title={item.label}
                >
                  {item.label}
                </p>
              ))}
              {dayItems.length > 2 && <p className="text-[9px] text-ink-500">+{dayItems.length - 2} more</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
