import { BadgeCheck } from "lucide-react";
import { PublicDetailGateCard } from "@/components/public/PublicDetailGateCard";
import type { MapAccessStatus } from "@/lib/supabase/queries";
import type { DeveloperRow } from "@/types/database";

// Real, public-safe summary shown to guests/unsubscribed viewers on a
// developer's own URL -- name, logo and description are genuine content
// (crawlable, real share-link previews). The `developers` table is
// already publicly SELECT-able at the RLS level for active developers
// (see schema.sql "developers: public read active"), so this needs no
// new view -- it's purely an app-layer choice of what to render. The
// project list, awards, reviews and contact form stay behind the
// register/subscribe gate below.
export function DeveloperPublicSummary({
  developer,
  developerName,
  developerDescription,
  status,
  subscriptionHref,
}: {
  developer: DeveloperRow;
  developerName: string;
  developerDescription: string | null;
  status: Exclude<MapAccessStatus, "ok">;
  subscriptionHref: string;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: developerName,
    description: developerDescription || undefined,
    url: `https://dubaipropertymap.ae/developers/${developer.slug}`,
    ...(developer.logo_url ? { logo: developer.logo_url } : {}),
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-navy-700 bg-navy-850 p-6">
        {developer.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={developer.logo_url}
            alt={developer.name}
            className="h-16 w-16 shrink-0 rounded-2xl border border-navy-700 bg-navy-900 object-contain p-2"
          />
        ) : (
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold text-white"
            style={{ background: developer.color }}
          >
            {developer.initial}
          </div>
        )}
        <div className="flex-1">
          <h1 className="flex items-center gap-2 text-xl font-bold text-ink-100">
            {developerName}
            {developer.verified && <BadgeCheck className="h-5 w-5 text-sky-400" />}
          </h1>
          {developer.founded && (
            <p className="mt-1 text-sm text-ink-400">Since {developer.founded}</p>
          )}
        </div>
      </div>

      {developerDescription && (
        <p className="mt-6 max-w-3xl text-sm leading-relaxed text-ink-300">
          {developerDescription}
        </p>
      )}

      <PublicDetailGateCard
        status={status}
        subscriptionHref={subscriptionHref}
        contentLabel="this developer's full project list, awards, reviews, and to contact them directly"
      />
    </div>
  );
}
