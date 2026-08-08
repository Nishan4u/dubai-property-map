import Link from "next/link";
import { BadgeCheck, Home, Rocket } from "lucide-react";
import type { BrokerDirectoryRow } from "@/lib/supabase/queries";

export function BrokerCard({ broker }: { broker: BrokerDirectoryRow }) {
  const isVerified = broker.verification_status === "active";

  return (
    <Link
      href={`/brokers/${broker.slug}`}
      className={`flex flex-col items-center rounded-xl border p-5 text-center transition-colors hover:border-gold-500/40 ${
        broker.featured ? "border-gold-500/50 bg-gold-500/[0.03]" : "border-navy-700 bg-navy-850"
      }`}
    >
      {broker.photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={broker.photo_url} alt={broker.full_name} className="h-16 w-16 rounded-full object-cover" />
      ) : (
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gold-500 text-lg font-semibold text-navy-950">
          {broker.full_name.charAt(0)}
        </span>
      )}
      <p className="mt-3 flex items-center gap-1 text-sm font-semibold text-ink-100">
        {broker.full_name}
        {isVerified && <BadgeCheck className="h-4 w-4 shrink-0 text-sky-400" />}
      </p>
      <p className="text-xs text-ink-500">{broker.brokerage_name ?? "Independent Broker"}</p>
      <div className="mt-3 flex gap-4 text-xs text-ink-400">
        <span className="flex items-center gap-1">
          <Home className="h-3.5 w-3.5" /> {broker.listings_count}
        </span>
        <span className="flex items-center gap-1">
          <Rocket className="h-3.5 w-3.5" /> {broker.projects_count}
        </span>
      </div>
      <span className="mt-3 w-full rounded-lg border border-navy-600 py-1.5 text-xs font-medium text-ink-300">View Profile</span>
    </Link>
  );
}
