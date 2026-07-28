import { notFound } from "next/navigation";
import {
  Building2,
  Cross,
  Landmark,
  School,
  Sparkles,
  TrendingUp,
  UtensilsCrossed,
} from "lucide-react";
import { PublicShell } from "@/components/public/PublicShell";
import { ProjectCard } from "@/components/public/ProjectCard";
import { ProjectAccessGate } from "@/components/public/ProjectAccessGate";
import { CommunityFavoriteButton } from "@/components/public/CommunityFavoriteButton";
import { formatAed } from "@/data/mock";
import { poiLayers } from "@/data/poi";
import { nearestPoints, type NearbyPoint } from "@/lib/nearbyPoi";
import Link from "next/link";
import {
  getActiveCommunityBanner,
  getCommunityBySlug,
  getMapAccessStatus,
  getProjectsForCommunity,
} from "@/lib/supabase/queries";
import { mapProject } from "@/lib/supabase/mappers";

export const dynamic = "force-dynamic";

function poiPoints(key: string) {
  return poiLayers.find((l) => l.key === key)?.points ?? [];
}

function bedroomLabel(n: number) {
  return n === 0 ? "Studio" : `${n} BR`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const community = await getCommunityBySlug(slug);
  if (!community) return {};

  const title = community.meta_title || `${community.name}, Dubai | Dubai Property Map`;
  const description =
    community.meta_description ||
    community.description ||
    `Explore off-plan and ready properties in ${community.name}, Dubai.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
  };
}

export default async function CommunityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  const communityBanner = await getActiveCommunityBanner(community.id);
  const { status: mapAccessStatus, subscriptionHref } = await getMapAccessStatus();
  const projectRows = mapAccessStatus === "ok" ? await getProjectsForCommunity(community.id) : [];
  const communityProjects = projectRows.map((p) => mapProject(p));
  const prices = communityProjects.map((p) => p.priceFromAed).filter((p) => p > 0);
  const avgPrice = prices.length
    ? prices.reduce((sum, p) => sum + p, 0) / prices.length
    : 0;
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;

  const priceByBedroom = new Map<number, number[]>();
  for (const p of communityProjects) {
    if (p.priceFromAed <= 0) continue;
    const list = priceByBedroom.get(p.bedroomsFrom) ?? [];
    list.push(p.priceFromAed);
    priceByBedroom.set(p.bedroomsFrom, list);
  }
  const bedroomBreakdown = Array.from(priceByBedroom.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([bedrooms, list]) => ({
      bedrooms,
      avg: list.reduce((s, v) => s + v, 0) / list.length,
      min: Math.min(...list),
    }));

  const hasCoords = community.lat != null && community.lng != null;
  const origin = hasCoords ? { lat: community.lat!, lng: community.lng! } : null;

  const nearby = {
    schools: origin ? nearestPoints(origin, poiPoints("schools"), 3) : [],
    hospitals: origin ? nearestPoints(origin, poiPoints("hospitals"), 3) : [],
    transport: origin ? nearestPoints(origin, poiPoints("metro"), 3) : [],
    lifestyle: origin
      ? nearestPoints(
          origin,
          [
            ...poiPoints("beaches"),
            ...poiPoints("golf"),
            ...poiPoints("parks"),
            ...poiPoints("malls"),
          ],
          3
        )
      : [],
    restaurants: origin ? nearestPoints(origin, poiPoints("restaurants"), 3) : [],
    attractions: origin ? nearestPoints(origin, poiPoints("attractions"), 3) : [],
  };

  return (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-navy-700 bg-navy-850 p-6">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold text-ink-100">
              <span
                className="h-3 w-3 rounded-full"
                style={{ background: community.pin_color }}
              />
              {community.name}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-ink-400">
              {community.description}
            </p>
          </div>
          <div className="flex gap-6 text-center">
            <div>
              <p className="text-lg font-bold text-ink-100">
                {communityProjects.length}
              </p>
              <p className="text-xs text-ink-500">Projects</p>
            </div>
            <div>
              <p className="text-lg font-bold text-ink-100">
                {avgPrice > 0 ? formatAed(avgPrice) : "—"}
              </p>
              <p className="text-xs text-ink-500">Avg Price</p>
            </div>
          </div>
          <CommunityFavoriteButton communityId={community.id} />
        </div>

        {communityBanner && (
          <Link
            href={communityBanner.target_url ?? "#"}
            className="mt-4 block rounded-xl border border-gold-500/30 bg-gold-500/10 p-4 hover:border-gold-500/50"
          >
            <p className="text-xs font-semibold text-gold-400">Sponsored</p>
            <p className="mt-1 text-sm font-medium text-ink-100">{communityBanner.title}</p>
            {communityBanner.developers?.name && (
              <p className="mt-0.5 text-xs text-ink-500">
                by {communityBanner.developers.name}
              </p>
            )}
          </Link>
        )}

        {!hasCoords ? (
          <p className="mt-6 text-sm text-ink-500">
            Nearby places aren&apos;t available for this community yet (no
            coordinates on file).
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <NearbySection
              icon={School}
              title="Schools"
              points={nearby.schools}
            />
            <NearbySection
              icon={Cross}
              title="Hospitals"
              points={nearby.hospitals}
            />
            <NearbySection
              icon={Landmark}
              title="Transport"
              points={nearby.transport}
            />
            <NearbySection
              icon={Sparkles}
              title="Lifestyle"
              points={nearby.lifestyle}
            />
            <NearbySection
              icon={UtensilsCrossed}
              title="Restaurants"
              points={nearby.restaurants}
            />
            <NearbySection
              icon={Building2}
              title="Attractions"
              points={nearby.attractions}
            />
          </div>
        )}

        <ProjectAccessGate status={mapAccessStatus} subscriptionHref={subscriptionHref} contentLabel="this community's project listings">
        <div className="mt-6 rounded-xl border border-navy-700 bg-navy-850 p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-100">
            <TrendingUp className="h-4 w-4 text-gold-400" /> Price Overview
          </p>
          {prices.length === 0 ? (
            <p className="text-sm text-ink-500">
              No priced listings in {community.name} yet.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4 border-b border-navy-800 pb-4 text-center">
                <div>
                  <p className="text-sm font-bold text-ink-100">
                    {formatAed(minPrice)}
                  </p>
                  <p className="text-xs text-ink-500">Lowest starting price</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-gold-400">
                    {formatAed(avgPrice)}
                  </p>
                  <p className="text-xs text-ink-500">Average starting price</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-ink-100">
                    {formatAed(maxPrice)}
                  </p>
                  <p className="text-xs text-ink-500">Highest starting price</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {bedroomBreakdown.map((b) => (
                  <div
                    key={b.bedrooms}
                    className="rounded-lg border border-navy-700 bg-navy-900 px-3 py-2 text-center"
                  >
                    <p className="text-xs text-ink-500">
                      {bedroomLabel(b.bedrooms)}
                    </p>
                    <p className="text-sm font-semibold text-ink-100">
                      from {formatAed(b.min)}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-ink-600">
                Based on {prices.length} currently listed project
                {prices.length === 1 ? "" : "s"} in {community.name}. This
                platform doesn&apos;t track historical resale prices, so this
                reflects current listings, not a multi-year trend.
              </p>
            </>
          )}
        </div>

        <h2 className="mt-8 mb-3 text-lg font-semibold text-ink-100">
          Projects in {community.name}
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {communityProjects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
          {communityProjects.length === 0 && (
            <p className="text-sm text-ink-500">
              No active projects listed yet.
            </p>
          )}
        </div>
        </ProjectAccessGate>
      </div>
    </PublicShell>
  );
}

function NearbySection({
  icon: Icon,
  title,
  points,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  points: NearbyPoint[];
}) {
  return (
    <div className="rounded-xl border border-navy-700 bg-navy-850 p-4 text-sm">
      <p className="mb-2 flex items-center gap-2 font-semibold text-ink-100">
        <Icon className="h-4 w-4 text-gold-400" /> {title}
      </p>
      {points.length === 0 ? (
        <p className="text-xs text-ink-500">None nearby on file.</p>
      ) : (
        <ul className="space-y-1.5">
          {points.map((pt) => (
            <li
              key={pt.name}
              className="flex items-center justify-between gap-2 text-xs text-ink-300"
            >
              <span className="truncate">{pt.name}</span>
              <span className="shrink-0 text-ink-500">
                {pt.distanceKm.toFixed(1)} km
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
