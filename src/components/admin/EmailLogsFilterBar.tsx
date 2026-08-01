"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { CompactSelect } from "@/components/public/CompactSelect";

const STATUS_OPTIONS = [
  { label: "Sent", value: "sent" },
  { label: "Delivered", value: "delivered" },
  { label: "Failed", value: "failed" },
  { label: "Bounced", value: "bounced" },
  { label: "Complained", value: "complained" },
  { label: "Pending", value: "pending" },
];

export function EmailLogsFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setParam("q", q);
      }}
      className="flex flex-wrap items-end gap-3 rounded-xl border border-navy-700 bg-navy-850 p-4"
    >
      <div>
        <label className="mb-1 block text-xs font-medium text-ink-400">Search (Request ID, subject, or email)</label>
        <div className="flex items-center gap-2 rounded-lg border border-navy-600 bg-navy-800 px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-ink-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="REQ-000001"
            className="w-56 bg-transparent text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
          />
        </div>
      </div>
      <CompactSelect
        label="Status"
        placeholder="All"
        value={searchParams.get("status") ?? ""}
        onChange={(v) => setParam("status", v)}
        options={STATUS_OPTIONS}
        searchable={false}
        className="w-48"
      />
      <button type="submit" className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400">
        Search
      </button>
    </form>
  );
}
