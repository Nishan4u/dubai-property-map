"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Row {
  id: string;
  created_at: string;
  projects: { name: string; slug: string } | null;
}

export function BrochuresTab({ userId }: { userId: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("brochure_downloads")
      .select("id, created_at, projects(name, slug)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setRows((data ?? []) as unknown as Row[]);
        setLoading(false);
      });
  }, [userId]);

  if (loading) {
    return <p className="p-6 text-sm text-ink-500">Loading brochure history…</p>;
  }

  if (rows.length === 0) {
    return (
      <p className="p-6 text-sm text-ink-500">
        No brochures downloaded yet — look for &quot;Download Brochure&quot;
        on any project page.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-navy-800 p-2">
      {rows.map((r) => (
        <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gold-400" />
            <div>
              <Link
                href={`/projects/${r.projects?.slug ?? ""}`}
                className="text-sm font-medium text-ink-100 hover:text-gold-400"
              >
                {r.projects?.name ?? "Unknown project"}
              </Link>
              <p className="text-xs text-ink-500">
                Downloaded {new Date(r.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
