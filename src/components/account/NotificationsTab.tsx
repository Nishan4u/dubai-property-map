"use client";

import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { createClient } from "@/lib/supabase/client";

interface Row {
  id: string;
  message: string;
  read: boolean;
  created_at: string;
  project_id: string | null;
}

export function NotificationsTab({ userId }: { userId: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("notifications")
      .select("id, message, read, created_at, project_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setRows(data ?? []);
        setLoading(false);
      });
  }, [userId]);

  async function markRead(id: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, read: true } : r)));
    const supabase = createClient();
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  }

  if (loading) {
    return <p className="p-6 text-sm text-ink-500">Loading notifications…</p>;
  }

  if (rows.length === 0) {
    return (
      <p className="p-6 text-sm text-ink-500">
        No notifications yet — you&apos;ll see updates here when you enquire
        about or book a viewing for a project.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-navy-800 p-2">
      {rows.map((r) => (
        <li
          key={r.id}
          onClick={() => !r.read && markRead(r.id)}
          className={clsx(
            "cursor-pointer px-4 py-3 text-sm",
            r.read ? "text-ink-400" : "font-medium text-ink-100"
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <p>{r.message}</p>
            {!r.read && (
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-gold-400" />
            )}
          </div>
          <p className="mt-1 text-xs text-ink-500">
            {new Date(r.created_at).toLocaleString()}
          </p>
        </li>
      ))}
    </ul>
  );
}
