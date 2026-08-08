"use client";

import { useEffect, useState } from "react";
import { Building2, Mail, MessageCircle, Phone } from "lucide-react";
import { ProjectThumb } from "@/components/ui/ProjectThumb";
import { useLocale } from "@/components/i18n/LocaleProvider";

interface StorefrontProject {
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

interface Agency {
  name: string;
  logoUrl: string | null;
  contactName: string;
  phone: string | null;
  email: string | null;
}

// Standalone branded page -- deliberately no PublicShell (no Dubai
// Property Map header/footer/nav), mirroring PresentationClient.tsx's
// same "this page is meant to read as the agent's own material, not
// ours" precedent. Project links are absolute (this page is served on
// the agency's own subdomain, a different host from the main site where
// /projects/[slug] actually lives), and unlike a private Collection
// there's no price/developer/location hiding -- a public storefront
// always shows its picks in full.
export function AgencyStorefrontClient({ subdomain }: { subdomain: string }) {
  const { formatPrice } = useLocale();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [agency, setAgency] = useState<Agency | null>(null);
  const [projects, setProjects] = useState<StorefrontProject[]>([]);

  useEffect(() => {
    fetch(`/api/agency-storefront/${subdomain}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "This agency page isn't available.");
          setLoading(false);
          return;
        }
        setAgency(data.agency);
        setProjects(data.projects);
        setLoading(false);
      })
      .catch(() => {
        setError("Something went wrong loading this page.");
        setLoading(false);
      });
  }, [subdomain]);

  if (loading) {
    return <div className="mx-auto max-w-4xl px-6 py-20 text-center text-sm text-ink-400">Loading…</div>;
  }

  if (error || !agency) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-6">
        <div className="w-full max-w-md rounded-2xl border border-navy-700 bg-navy-850 p-8 text-center">
          <Building2 className="mx-auto h-8 w-8 text-ink-600" />
          <h1 className="mt-3 text-lg font-semibold text-ink-100">Page not found</h1>
          <p className="mt-2 text-sm text-ink-400">{error || "This agency page isn't available."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-navy-950">
      <header className="border-b border-navy-800 bg-navy-900">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-6">
          <div className="flex items-center gap-3">
            {agency.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- agency-supplied arbitrary URL, same as every other user-supplied image in this codebase
              <img
                src={agency.logoUrl}
                alt={agency.name}
                className="h-14 w-14 shrink-0 rounded-xl border border-navy-700 bg-navy-800 object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-navy-700 bg-navy-800 text-xl font-semibold text-gold-400">
                {agency.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold text-ink-100 sm:text-xl">{agency.name}</h1>
              <p className="text-xs text-ink-500">Featured properties</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-ink-300">
            {agency.phone && (
              <a href={`https://wa.me/${agency.phone.replace(/[^\d]/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg border border-navy-700 px-3 py-1.5 hover:border-gold-500/40 hover:text-gold-400">
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
              </a>
            )}
            {agency.phone && (
              <a href={`tel:${agency.phone}`} className="flex items-center gap-1.5 rounded-lg border border-navy-700 px-3 py-1.5 hover:border-gold-500/40 hover:text-gold-400">
                <Phone className="h-3.5 w-3.5" /> {agency.phone}
              </a>
            )}
            {agency.email && (
              <a href={`mailto:${agency.email}`} className="flex items-center gap-1.5 rounded-lg border border-navy-700 px-3 py-1.5 hover:border-gold-500/40 hover:text-gold-400">
                <Mail className="h-3.5 w-3.5" /> {agency.email}
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        {projects.length === 0 ? (
          <p className="text-sm text-ink-500">{agency.name} hasn&apos;t added any featured properties yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <a
                key={p.slug}
                href={`https://dubaipropertymap.ae/projects/${p.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="overflow-hidden rounded-xl border border-navy-700 bg-navy-850 transition-colors hover:border-gold-500/40"
              >
                <ProjectThumb gradient={p.gradient} imageUrl={p.coverImageUrl} imageAlt={p.name} className="h-40 w-full" />
                <div className="p-4">
                  <p className="text-sm font-semibold text-ink-100">{p.name}</p>
                  <p className="mt-0.5 truncate text-xs text-ink-400">
                    {p.developerName ? `by ${p.developerName}` : ""}
                    {p.communityName ? ` · ${p.communityName}` : ""}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-gold-400">From {formatPrice(p.priceFromAed)}</p>
                  <p className="mt-1 text-xs text-ink-500">
                    {p.bedroomsFrom === 0 ? "Studio" : `${p.bedroomsFrom}`}
                    {p.bedroomsTo > p.bedroomsFrom ? `-${p.bedroomsTo} Bed` : p.bedroomsFrom > 0 ? " Bed" : ""}
                  </p>
                </div>
              </a>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-navy-800 py-6 text-center text-xs text-ink-600">
        <a href="https://dubaipropertymap.ae" target="_blank" rel="noopener noreferrer" className="hover:text-ink-400">
          Powered by Dubai Property Map
        </a>
      </footer>
    </div>
  );
}
