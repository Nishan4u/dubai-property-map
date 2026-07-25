"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Row {
  id: string;
  label: string;
  created_at: string;
}

export function SavedSearchesTab({ userId }: { userId: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [userId]);

  function load() {
    const supabase = createClient();
    supabase
      .from("saved_searches")
      .select("id, label, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setRows(data ?? []);
        setLoading(false);
      });
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    await supabase.from("saved_searches").delete().eq("id", id);
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  if (loading) {
    return <p className="p-6 text-sm text-ink-500">Loading saved searches…</p>;
  }

  if (rows.length === 0) {
    return (
      <p className="p-6 text-sm text-ink-500">
        No saved searches yet — use &quot;Save This Search&quot; in the
        homepage filters sidebar.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-navy-800 p-2">
      {rows.map((r) => (
        <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-ink-100">{r.label}</p>
            <p className="text-xs text-ink-500">
              Saved {new Date(r.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/?saved=${r.id}`}
              className="flex items-center gap-1.5 rounded-lg border border-navy-600 px-3 py-1.5 text-xs font-medium text-ink-300 hover:text-ink-100"
            >
              <Search className="h-3.5 w-3.5" /> Search Again
            </Link>
            <button
              onClick={() => handleDelete(r.id)}
              className="text-ink-500 hover:text-rose-400"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
