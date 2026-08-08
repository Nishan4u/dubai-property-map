import Link from "next/link";
import { formatAed } from "@/data/mock";

interface BrokerListingCardData {
  id: string;
  slug: string;
  title: string;
  property_type: string;
  listing_type: "sale" | "rent" | "lease";
  price_aed: number;
  communities: { name: string } | null;
}

export function BrokerListingCard({
  listing,
  brokerName,
  brokerPhotoUrl,
  brokerageName,
}: {
  listing: BrokerListingCardData;
  brokerName: string;
  brokerPhotoUrl?: string | null;
  brokerageName?: string | null;
}) {
  return (
    <Link
      href={`/brokers/listings/${listing.slug}`}
      className="flex flex-col overflow-hidden rounded-xl border border-navy-700 bg-navy-850 transition-colors hover:border-gold-500/40"
    >
      <div className="flex h-32 items-center justify-center bg-gradient-to-br from-navy-800 to-navy-900 text-xs text-ink-500">
        {listing.property_type}
      </div>
      <div className="p-4">
        <p className="truncate text-sm font-semibold text-ink-100">{listing.title}</p>
        <p className="text-xs text-ink-500">
          {listing.property_type} · <span className="capitalize">{listing.listing_type}</span> · {listing.communities?.name ?? "Dubai"}
        </p>
        <p className="mt-1 text-sm font-semibold text-gold-400">{formatAed(listing.price_aed)}</p>
        <div className="mt-3 flex items-center gap-2 border-t border-navy-800 pt-3">
          {brokerPhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brokerPhotoUrl} alt={brokerName} className="h-6 w-6 rounded-full object-cover" />
          ) : (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold-500 text-[10px] font-semibold text-navy-950">
              {brokerName.charAt(0)}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-ink-200">{brokerName}</p>
            {brokerageName && <p className="truncate text-[10px] text-ink-500">{brokerageName}</p>}
          </div>
        </div>
      </div>
    </Link>
  );
}
