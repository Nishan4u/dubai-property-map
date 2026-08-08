"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FolderOpen, Mail, MessageCircle, Phone, Printer } from "lucide-react";
import { ProjectThumb } from "@/components/ui/ProjectThumb";
import { useLocale } from "@/components/i18n/LocaleProvider";

interface PresentationProject {
  name: string;
  slug: string;
  coverImageUrl: string | null;
  gradient: string;
  // null means the agent chose to hide this field on this collection --
  // shown as "Contact agent" rather than a fake/blank value.
  priceFromAed: number | null;
  bedroomsFrom: number;
  bedroomsTo: number;
  communityName: string | null;
  developerName: string | null;
}

interface Agent {
  name: string;
  photoUrl: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
}

export function PresentationClient({ token }: { token: string }) {
  const { formatPrice } = useLocale();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [agent, setAgent] = useState<Agent | null>(null);
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
        setAgent(data.agent ?? null);
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
      {/* Print stylesheet lives here (not globally) -- only this page is
          meant to be saved/printed as a branded PDF; every other page on
          the site keeps its normal on-screen chrome when printed. */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-gold-400" />
          <h1 className="text-xl font-bold text-ink-100">{title}</h1>
        </div>
        <button
          onClick={() => window.print()}
          className="no-print flex items-center gap-1.5 rounded-lg border border-navy-600 px-3 py-1.5 text-xs font-medium text-ink-300 hover:text-ink-100"
        >
          <Printer className="h-3.5 w-3.5" /> Download PDF
        </button>
      </div>

      {agent && (
        <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-gold-500/30 bg-gold-500/10 p-4">
          {agent.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={agent.photoUrl}
              alt={agent.name}
              className="h-14 w-14 shrink-0 rounded-full border-2 border-gold-500/40 object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-gold-500/40 bg-navy-800 text-lg font-semibold text-gold-400">
              {agent.name.charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-gold-400">Presented by</p>
            <p className="text-sm font-semibold text-ink-100">{agent.name}</p>
            <div className="mt-1 flex flex-wrap gap-3 text-xs text-ink-300">
              {agent.whatsapp && (
                <a
                  href={`https://wa.me/${agent.whatsapp.replace(/[^\d]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="no-print flex items-center gap-1 hover:text-gold-400"
                >
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                </a>
              )}
              {agent.phone && (
                <a href={`tel:${agent.phone}`} className="no-print flex items-center gap-1 hover:text-gold-400">
                  <Phone className="h-3.5 w-3.5" /> {agent.phone}
                </a>
              )}
              {agent.email && (
                <a href={`mailto:${agent.email}`} className="no-print flex items-center gap-1 hover:text-gold-400">
                  <Mail className="h-3.5 w-3.5" /> {agent.email}
                </a>
              )}
              {/* Print/PDF version shows plain text instead of tel:/mailto:/
                  wa.me links, which are meaningless on a printed page. */}
              <span className="hidden print:inline">
                {[agent.phone, agent.whatsapp && `WhatsApp ${agent.whatsapp}`, agent.email].filter(Boolean).join(" · ")}
              </span>
            </div>
          </div>
        </div>
      )}

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
              <ProjectThumb gradient={p.gradient} imageUrl={p.coverImageUrl} imageAlt={p.name} className="h-40 w-full" />
              <div className="p-4">
                <p className="text-sm font-semibold text-ink-100">{p.name}</p>
                <p className="mt-0.5 truncate text-xs text-ink-400">
                  {p.developerName ? `by ${p.developerName}` : "Developer on request"}
                  {p.communityName ? ` · ${p.communityName}` : p.developerName ? " · Location on request" : ""}
                </p>
                <p className="mt-2 text-sm font-semibold text-gold-400">
                  {p.priceFromAed != null ? `From ${formatPrice(p.priceFromAed)}` : "Contact agent for price"}
                </p>
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
