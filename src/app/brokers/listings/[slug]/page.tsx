import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Bath, BedDouble, MapPin, Ruler } from "lucide-react";
import { PublicShell } from "@/components/public/PublicShell";
import { BrokerContactPanel } from "@/components/public/BrokerContactPanel";
import { formatAed } from "@/data/mock";
import { getBrokerListingBySlugPublic, incrementBrokerListingViews } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const listing = await getBrokerListingBySlugPublic(slug);
  if (!listing) return {};

  return {
    title: `${listing.title} | Dubai Property Map`,
    description: listing.description || `${listing.property_type} for ${listing.listing_type} in ${(listing.communities as { name: string } | null)?.name ?? "Dubai"}.`,
    alternates: { canonical: `/brokers/listings/${listing.slug}` },
  };
}

export default async function BrokerListingDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const listing = await getBrokerListingBySlugPublic(slug);
  if (!listing) notFound();
  await incrementBrokerListingViews(listing.id);

  const broker = listing.brokers as unknown as {
    id: string;
    slug: string;
    full_name: string;
    photo_url: string | null;
    verification_status: string;
    brokerages: { name: string } | null;
  };
  const community = listing.communities as { name: string } | null;

  return (
    <PublicShell>
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="flex h-64 items-center justify-center rounded-2xl bg-gradient-to-br from-navy-800 to-navy-900 text-sm text-ink-500">
          {listing.property_type}
        </div>

        <div className="mt-6 rounded-2xl border border-navy-700 bg-navy-900 p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-gold-400">{listing.listing_type}</p>
          <h1 className="mt-1 font-serif text-2xl font-medium text-ink-100">{listing.title}</h1>
          <p className="mt-1 flex items-center gap-1 text-sm text-ink-400">
            <MapPin className="h-4 w-4" /> {community?.name ?? "Dubai"}
          </p>
          <p className="mt-3 font-serif text-2xl italic font-bold text-gold-400">{formatAed(listing.price_aed)}</p>

          <div className="mt-5 grid grid-cols-3 gap-4 border-t border-navy-800 pt-5 text-sm text-ink-300">
            {listing.bedrooms != null && (
              <p className="flex items-center gap-1.5">
                <BedDouble className="h-4 w-4 text-gold-400" /> {listing.bedrooms} Bed
              </p>
            )}
            {listing.bathrooms != null && (
              <p className="flex items-center gap-1.5">
                <Bath className="h-4 w-4 text-gold-400" /> {listing.bathrooms} Bath
              </p>
            )}
            {listing.size_sqft != null && (
              <p className="flex items-center gap-1.5">
                <Ruler className="h-4 w-4 text-gold-400" /> {listing.size_sqft.toLocaleString()} sq ft
              </p>
            )}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            {listing.description && (
              <section>
                <h2 className="mb-3 text-lg font-semibold text-ink-100">Description</h2>
                <p className="text-sm leading-relaxed text-ink-300">{listing.description}</p>
              </section>
            )}
            {listing.amenities.length > 0 && (
              <section>
                <h2 className="mb-3 text-lg font-semibold text-ink-100">Amenities</h2>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {listing.amenities.map((a: string) => (
                    <div key={a} className="rounded-lg border border-navy-700 bg-navy-850 px-3 py-2 text-sm text-ink-300">
                      {a}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="space-y-6">
            <Link href={`/brokers/${broker.slug}`} className="flex items-center gap-3 rounded-xl border border-navy-700 bg-navy-850 p-5 hover:border-gold-500/40">
              {broker.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={broker.photo_url} alt={broker.full_name} className="h-12 w-12 shrink-0 rounded-full object-cover" />
              ) : (
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold-500 text-sm font-semibold text-navy-950">
                  {broker.full_name.charAt(0)}
                </span>
              )}
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 truncate text-sm font-medium text-ink-100">
                  {broker.full_name}
                  {broker.verification_status === "active" && <BadgeCheck className="h-4 w-4 shrink-0 text-sky-400" />}
                </p>
                <p className="truncate text-xs text-ink-500">{broker.brokerages?.name ?? "Independent Broker"}</p>
              </div>
            </Link>
            <BrokerContactPanel slug={broker.slug} brokerName={broker.full_name} />
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
