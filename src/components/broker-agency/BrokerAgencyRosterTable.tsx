"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { BrokerAgencyBrokerActions } from "@/components/broker-agency/BrokerAgencyBrokerActions";

interface RosterBroker {
  id: string;
  full_name: string;
  email: string;
  mobile: string;
  account_status: string;
  subscription_status: string;
}

const statusTone: Record<string, "green" | "gold" | "red" | "neutral"> = {
  approved: "green",
  pending_verification: "gold",
  rejected: "red",
  suspended: "red",
  blocked: "red",
};

// Client component so the search box can filter interactively -- the
// column render functions have to live here rather than being passed in
// as props from the server page, since functions can't cross the
// Server -> Client Component boundary in React Server Components.
export function BrokerAgencyRosterTable({ brokers }: { brokers: RosterBroker[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return brokers;
    return brokers.filter((b) => b.full_name.toLowerCase().includes(q) || b.email.toLowerCase().includes(q));
  }, [brokers, query]);

  return (
    <div className="space-y-3">
      <div className="relative max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full rounded-lg border border-navy-600 bg-navy-800 py-2 pl-9 pr-3 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
        />
      </div>

      <DataTable
        columns={[
          { header: "Broker", render: (b) => b.full_name },
          { header: "Email", render: (b) => b.email },
          { header: "Mobile", render: (b) => b.mobile },
          { header: "Status", render: (b) => <Badge tone={statusTone[b.account_status] ?? "neutral"}>{b.account_status.replace(/_/g, " ")}</Badge> },
          { header: "Subscription", render: (b) => <span className="capitalize">{b.subscription_status.replace(/_/g, " ")}</span> },
          { header: "", render: (b) => <BrokerAgencyBrokerActions brokerId={b.id} fullName={b.full_name} /> },
        ]}
        rows={filtered}
      />
    </div>
  );
}
