"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/client";

interface Row {
  id: string;
  scheduled_date: string;
  status: string;
  projects: { name: string; slug: string } | null;
}

const statusTone: Record<string, "gold" | "blue" | "green" | "neutral" | "red"> = {
  confirmed: "blue",
  completed: "green",
  cancelled: "red",
};

export function ViewingRequestsTab({ userId }: { userId: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("bookings")
      .select("id, scheduled_date, status, projects(name, slug)")
      .eq("created_by", userId)
      .order("scheduled_date", { ascending: false })
      .then(({ data }) => {
        setRows((data ?? []) as unknown as Row[]);
        setLoading(false);
      });
  }, [userId]);

  if (loading) {
    return <p className="p-6 text-sm text-ink-500">Loading viewing requests…</p>;
  }

  if (rows.length === 0) {
    return (
      <p className="p-6 text-sm text-ink-500">
        No viewing requests yet — book a viewing from any project page.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-navy-800 p-2">
      {rows.map((r) => (
        <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
          <div>
            <Link
              href={`/projects/${r.projects?.slug ?? ""}`}
              className="text-sm font-medium text-ink-100 hover:text-gold-400"
            >
              {r.projects?.name ?? "Unknown project"}
            </Link>
            <p className="text-xs text-ink-500">
              {new Date(r.scheduled_date).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
          <Badge tone={statusTone[r.status] ?? "neutral"}>{r.status}</Badge>
        </li>
      ))}
    </ul>
  );
}
