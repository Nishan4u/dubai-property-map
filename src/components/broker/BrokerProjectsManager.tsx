"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Project } from "@/types";

interface LinkedProject {
  linkId: string;
  linkedAt: string;
  project: { id: string; slug: string; name: string; developer_name: string | null; price_from_aed: number } | null;
}

export function BrokerProjectsManager({
  brokerId,
  allProjects,
  linked,
}: {
  brokerId: string;
  allProjects: Project[];
  linked: LinkedProject[];
}) {
  const [query, setQuery] = useState("");
  const [linkedIds, setLinkedIds] = useState<Set<string>>(new Set(linked.map((l) => l.project?.id).filter((v): v is string => !!v)));
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rows, setRows] = useState(linked);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allProjects.slice(0, 30);
    return allProjects.filter((p) => p.name.toLowerCase().includes(q) || (p.developerName ?? "").toLowerCase().includes(q)).slice(0, 30);
  }, [allProjects, query]);

  async function handleAdd(projectId: string) {
    setBusyId(projectId);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("broker_project_links")
      .insert({ broker_id: brokerId, project_id: projectId })
      .select("id, created_at")
      .single();
    setBusyId(null);
    if (error) return;
    const project = allProjects.find((p) => p.id === projectId);
    setLinkedIds((prev) => new Set(prev).add(projectId));
    setRows((prev) => [
      { linkId: data.id, linkedAt: data.created_at, project: project ? { id: project.id, slug: project.slug, name: project.name, developer_name: project.developerName ?? null, price_from_aed: project.priceFromAed } : null },
      ...prev,
    ]);
  }

  async function handleRemove(linkId: string, projectId: string) {
    setBusyId(projectId);
    const supabase = createClient();
    const { error } = await supabase.from("broker_project_links").delete().eq("id", linkId);
    setBusyId(null);
    if (error) return;
    setLinkedIds((prev) => {
      const next = new Set(prev);
      next.delete(projectId);
      return next;
    });
    setRows((prev) => prev.filter((r) => r.linkId !== linkId));
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <div>
        <h2 className="mb-2 text-sm font-semibold text-ink-100">On Your Profile ({rows.length})</h2>
        <div className="space-y-2">
          {rows.length === 0 && <p className="text-sm text-ink-500">No developer projects added yet.</p>}
          {rows.map((r) =>
            r.project ? (
              <div key={r.linkId} className="flex items-center justify-between rounded-lg border border-navy-700 bg-navy-850 px-4 py-3">
                <div className="min-w-0">
                  <Link href={`/projects/${r.project.slug}`} className="truncate text-sm font-medium text-ink-100 hover:text-gold-400">
                    {r.project.name}
                  </Link>
                  <p className="text-xs text-ink-500">by {r.project.developer_name} · From AED {r.project.price_from_aed.toLocaleString()}</p>
                </div>
                <button
                  onClick={() => handleRemove(r.linkId, r.project!.id)}
                  disabled={busyId === r.project.id}
                  className="shrink-0 text-ink-500 hover:text-rose-400 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ) : null
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-ink-100">Add a Developer Project</h2>
        <div className="flex items-center gap-2 rounded-lg border border-navy-700 bg-navy-850 px-3 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-ink-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects…"
            className="w-full bg-transparent text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
          />
        </div>
        <div className="mt-3 max-h-96 space-y-2 overflow-y-auto">
          {filtered.map((p) => {
            const isLinked = linkedIds.has(p.id);
            return (
              <div key={p.id} className="flex items-center justify-between rounded-lg border border-navy-700 bg-navy-850 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-100">{p.name}</p>
                  <p className="text-xs text-ink-500">by {p.developerName}</p>
                </div>
                <button
                  onClick={() => handleAdd(p.id)}
                  disabled={isLinked || busyId === p.id}
                  className="shrink-0 rounded-lg border border-gold-500/40 px-3 py-1.5 text-xs font-medium text-gold-400 hover:bg-gold-500/10 disabled:cursor-default disabled:border-navy-700 disabled:text-ink-500"
                >
                  {isLinked ? "Added" : "Add"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
