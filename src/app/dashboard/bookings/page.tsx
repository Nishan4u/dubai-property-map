"use client";

import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { bookings } from "@/data/mock";
import type { Booking } from "@/types";

const statusTone: Record<Booking["status"], "green" | "red" | "blue"> = {
  confirmed: "blue",
  completed: "green",
  cancelled: "red",
};

export default function DeveloperBookingsPage() {
  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Bookings</h1>
        <p className="text-sm text-ink-400">
          Viewing appointments scheduled across your projects.
        </p>
      </div>

      <DataTable<Booking>
        columns={[
          { header: "Project", render: (b) => <span className="font-medium text-ink-100">{b.projectName}</span> },
          { header: "Client", render: (b) => b.clientName },
          { header: "Date", render: (b) => b.date },
          { header: "Time", render: (b) => b.time },
          { header: "Agent", render: (b) => b.agent },
          { header: "Status", render: (b) => <Badge tone={statusTone[b.status]}>{b.status}</Badge> },
        ]}
        rows={bookings}
      />
    </div>
  );
}
