import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public/PublicShell";
import { BrokerProfileClient } from "@/components/public/BrokerProfileClient";
import {
  getBrokerListingsPublic,
  getBrokerProjectLinksPublic,
  getBrokerPublicProfile,
  incrementBrokerProfileViews,
} from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const broker = await getBrokerPublicProfile(slug);
  if (!broker) return {};

  const title = `${broker.full_name} | Dubai Property Map`;
  const description = broker.bio || `${broker.full_name}${broker.brokerage_name ? ` at ${broker.brokerage_name}` : ""} — real estate broker on Dubai Property Map.`;

  return {
    title,
    description,
    alternates: { canonical: `/brokers/${broker.slug}` },
    openGraph: {
      title,
      description,
      type: "profile",
      url: `/brokers/${broker.slug}`,
      ...(broker.photo_url ? { images: [broker.photo_url] } : {}),
    },
  };
}

// Guests browse the real profile -- name/bio/listings/projects are all
// genuine content (spec section 8: only literal contact fields are
// gated, via BrokerContactPanel -> /api/brokers/[slug]/contact). Reads
// only brokers_public_profile, never the raw brokers table, so email/
// mobile/whatsapp never reach this page's payload at all.
export default async function BrokerProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const broker = await getBrokerPublicProfile(slug);
  if (!broker) notFound();

  const [listings, linkedProjects] = await Promise.all([
    getBrokerListingsPublic(broker.id),
    getBrokerProjectLinksPublic(broker.id),
  ]);
  await incrementBrokerProfileViews(broker.id);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: broker.full_name,
    description: broker.bio || undefined,
    url: `https://dubaipropertymap.ae/brokers/${broker.slug}`,
    ...(broker.photo_url ? { image: broker.photo_url } : {}),
  };

  return (
    <PublicShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <BrokerProfileClient
        broker={broker}
        listings={listings.map((l) => ({
          id: l.id,
          slug: l.slug,
          title: l.title,
          property_type: l.property_type,
          listing_type: l.listing_type,
          price_aed: l.price_aed,
          communities: (l.communities as { name: string } | null) ?? null,
        }))}
        linkedProjects={linkedProjects.map((l) => ({ linkId: l.linkId, project: l.project }))}
      />
    </PublicShell>
  );
}
