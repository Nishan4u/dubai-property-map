"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FolderOpen } from "lucide-react";
import { ProjectThumb } from "@/components/ui/ProjectThumb";
import { formatAed } from "@/data/mock";

interface PresentationProject {
  name: string;
  slug: string;
  coverImageUrl: string | null;
  gradient: string;
  priceFromAed: number;
  bedroomsFrom: number;
  bedroomsTo: number;
  communityName: string | null;
  developerName: string | null;
}

export function PresentationClient({ token }: { token: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [projects, setProjects] = useState<PresentationProject[]>([]);

  useEffect(() => {
    fetch(`/api/presentations/${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "This link isn't valid.");
          setLoading(false);
          return;
        }
        setTitle(data.title);
        setProjects(data.projects);
        setLoading(false);
      })
      .catch(() => {
        setError("Something went wrong loading this collection.");
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return <div className="mx-auto max-w-4xl px-6 py-20 text-center text-sm text-ink-400">Loading…</div>;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <div className="rounded-2xl border border-rose-700/40 bg-navy-850 p-8">
          <h1 className="text-lg font-semibold text-rose-400">Link not available</h1>
          <p className="mt-2 text-sm text-ink-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center gap-2">
        <FolderOpen className="h-5 w-5 text-gold-400" />
        <h1 className="text-xl font-bold text-ink-100">{title}</h1>
      </div>
      {projects.length === 0 ? (
        <p className="text-sm text-ink-500">This collection has no projects yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Link
              key={p.slug}
              href={`/projects/${p.slug}`}
              className="overflow-hidden rounded-xl border border-navy-700 bg-navy-850 transition-colors hover:border-gold-500/40"
            >
              <ProjectThumb gradient={p.gradient} imageUrl={p.coverImageUrl} className="h-40 w-full" />
              <div className="p-4">
                <p className="text-sm font-semibold text-ink-100">{p.name}</p>
                <p className="mt-0.5 truncate text-xs text-ink-400">
                  {p.developerName && `by ${p.developerName}`} {p.communityName && `· ${p.communityName}`}
                </p>
                <p className="mt-2 text-sm font-semibold text-gold-400">From {formatAed(p.priceFromAed)}</p>
                <p className="mt-1 text-xs text-ink-500">
                  {p.bedroomsFrom === 0 ? "Studio" : `${p.bedroomsFrom}`}
                  {p.bedroomsTo > p.bedroomsFrom ? `-${p.bedroomsTo} Bed` : p.bedroomsFrom > 0 ? " Bed" : ""}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
