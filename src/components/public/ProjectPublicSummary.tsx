import Link from "next/link";
import { MapPin } from "lucide-react";
import { PublicDetailGateCard } from "@/components/public/PublicDetailGateCard";
import { ProjectThumb } from "@/components/ui/ProjectThumb";
import { Badge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/i18n/locale";
import type { Currency } from "@/lib/i18n/dictionaries";
import type { MapAccessStatus, ProjectPreview } from "@/lib/supabase/queries";

// Real, public-safe summary shown to guests/unsubscribed viewers on a
// project's own URL -- name, developer, community, property type,
// starting price and description are genuine content (crawlable, real
// share-link previews), sourced only from `projects_public_meta`
// (see getProjectPreviewBySlug), which already deliberately excludes
// every field the protected page shows. Everything deeper (payment
// plan, unit types, amenities, gallery, video, documents, exact
// location, contact/enquiry forms, similar projects) stays behind the
// PublicDetailGateCard below.
export function ProjectPublicSummary({
  preview,
  currency,
  status,
  subscriptionHref,
}: {
  preview: ProjectPreview;
  currency: Currency;
  status: Exclude<MapAccessStatus, "ok">;
  subscriptionHref: string;
}) {
  // Same fix as the full project page's own JSON-LD: "RealEstateListing"
  // isn't a real schema.org type, so it never actually helped search --
  // "Product" is what Google's structured data tooling recognizes. This
  // version specifically matters for SEO since it's what guests and
  // crawlers (not logged in / not subscribed) actually see on this URL.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: preview.name,
    description: preview.description || undefined,
    image: preview.cover_image_url || undefined,
    url: `https://dubaipropertymap.ae/projects/${preview.slug}`,
    offers: {
      "@type": "Offer",
      price: preview.price_from_aed,
      priceCurrency: "AED",
      availability: "https://schema.org/InStock",
      url: `https://dubaipropertymap.ae/projects/${preview.slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProjectThumb
        gradient="from-amber-500/40 via-slate-800 to-slate-950"
        imageUrl={preview.cover_image_url}
        imageAlt={
          preview.community_name
            ? `${preview.name} in ${preview.community_name}, Dubai`
            : `${preview.name}, Dubai`
        }
        className="h-64 w-full sm:h-72"
      />

      <div className="mx-auto max-w-6xl px-6 pb-16 pt-6">
        <div className="rounded-2xl border border-navy-700 bg-navy-900 p-6 shadow-2xl">
          <Badge tone="blue">{preview.property_type}</Badge>
          <h1 className="mt-2 text-2xl font-bold text-ink-100">{preview.name}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-1 text-sm text-ink-400">
            {preview.community_name && (
              <>
                <MapPin className="h-4 w-4" /> {preview.community_slug ? (
                  <Link href={`/communities/${preview.community_slug}`} className="hover:text-ink-200">
                    {preview.community_name}
                  </Link>
                ) : (
                  preview.community_name
                )}
                {preview.developer_name && <span className="mx-1">·</span>}
              </>
            )}
            {preview.developer_name && (
              <>
                by{" "}
                {preview.developer_slug ? (
                  <Link href={`/developers/${preview.developer_slug}`} className="text-gold-400 hover:underline">
                    {preview.developer_name}
                  </Link>
                ) : (
                  preview.developer_name
                )}
              </>
            )}
          </p>

          <div className="mt-4 border-t border-navy-800 pt-4">
            <p className="text-xs text-ink-500">Starting From</p>
            <p className="text-2xl font-bold text-gold-400">
              {formatPrice(preview.price_from_aed, currency)}
            </p>
          </div>

          {preview.description && (
            <p className="mt-4 text-sm leading-relaxed text-ink-300">{preview.description}</p>
          )}
        </div>

        <PublicDetailGateCard
          status={status}
          subscriptionHref={subscriptionHref}
          contentLabel="floor plans, the full payment plan, unit availability, photo gallery, and to contact the developer directly"
        />
      </div>
    </>
  );
}
