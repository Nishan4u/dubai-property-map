import { notFound } from "next/navigation";
import {
  Building2,
  Cross,
  Landmark,
  School,
  Sparkles,
  Star,
  TrendingUp,
  UtensilsCrossed,
} from "lucide-react";
import { PublicShell } from "@/components/public/PublicShell";
import { ProjectCard } from "@/components/public/ProjectCard";
import { ProjectAccessGate } from "@/components/public/ProjectAccessGate";
import { CommunityFavoriteButton } from "@/components/public/CommunityFavoriteButton";
import { RoiCalculator } from "@/components/public/calculators/RoiCalculator";
import { RentalYieldCalculator } from "@/components/public/calculators/RentalYieldCalculator";
import { getCurrency, getLocale, formatPrice } from "@/lib/i18n/locale";
import { poiLayers } from "@/data/poi";
import { nearestPoints } from "@/lib/nearbyPoi";
import { getInvestmentScore } from "@/lib/investmentScore";
import Link from "next/link";
import {
  getActiveCommunityBanner,
  getCommunityBySlug,
  getCommunityNearestLocations,
  getMapAccessStatus,
  getMarketInsights,
  getProjectsForCommunity,
} from "@/lib/supabase/queries";
import { mapProject } from "@/lib/supabase/mappers";

export const dynamic = "force-dynamic";

// Loose enough to cover both real per-community DB rows (patch_124, no
// lng/lat of their own -- just a name and two real distances) and the
// dynamic nearestPoints() fallback's richer NearbyPoint shape.
interface NearbyDisplayPoint {
  name: string;
  distanceKm: number;
  driveKm?: number;
}

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

  const currency = await getCurrency();
  const locale = await getLocale();
  const communityName = locale === "ar" && community.name_ar ? community.name_ar : community.name;
  const communityDescription = locale === "ar" && community.description_ar ? community.description_ar : community.description;

  const communityBanner = await getActiveCommunityBanner(community.id);
  const { status: mapAccessStatus, subscriptionHref } = await getMapAccessStatus();
  const [projectRows, marketInsights] =
    mapAccessStatus === "ok"
      ? await Promise.all([getProjectsForCommunity(community.id), getMarketInsights(community.name)])
      : [[], null];
  const communityProjects = projectRows.map((p) => mapProject(p));

  // Community-level Investment Score is a genuine average of each listing's
  // own transparent, already-computed score (rating/reviews/high-roi tag) --
  // never a fabricated ROI or rental-yield figure, since this schema has no
  // historical rental/resale data to compute one from (see getMarketInsights'
  // own header comment and the AI Investment Advisor's identical rule).
  const investmentScores = communityProjects.map((p) => getInvestmentScore(p));
  const avgInvestmentScore = investmentScores.length
    ? Math.round(investmentScores.reduce((sum, s) => sum + s, 0) / investmentScores.length)
    : null;
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

  // Real per-community nearest-place data (patch_124) takes priority when
  // it exists -- it's pre-vetted per community (not just "nearest point in
  // a generic citywide layer") and carries a real estimated road distance
  // alongside straight-line, which the live nearestPoints() fallback below
  // can't produce. Communities outside that imported set (or before the
  // migration is applied) transparently fall back to the existing dynamic
  // computation -- same real poi.ts data, just straight-line only.
  const nearestLocationRows = await getCommunityNearestLocations(community.id);
  const nearestByCategory = new Map<string, NearbyDisplayPoint[]>();
  for (const row of nearestLocationRows) {
    const key = row.category.toLowerCase();
    const list = nearestByCategory.get(key) ?? [];
    list.push({
      name: row.poi_name,
      distanceKm: Number(row.distance_km),
      driveKm: Number(row.est_drive_km),
    });
    nearestByCategory.set(key, list);
  }
  const hasRealNearbyData = nearestByCategory.size > 0;

  const nearby: Record<
    "schools" | "hospitals" | "transport" | "lifestyle" | "restaurants" | "attractions",
    NearbyDisplayPoint[]
  > = hasRealNearbyData
    ? {
        schools: nearestByCategory.get("schools") ?? [],
        hospitals: nearestByCategory.get("hospitals") ?? [],
        transport: nearestByCategory.get("transport") ?? [],
        lifestyle: nearestByCategory.get("lifestyle") ?? [],
        restaurants: nearestByCategory.get("restaurants") ?? [],
        attractions: nearestByCategory.get("attractions") ?? [],
      }
    : {
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
              {communityName}
              {community.region && (
                <span className="rounded-full bg-navy-800 px-2 py-0.5 text-xs font-medium text-ink-400">
                  {community.region}
                </span>
              )}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-ink-400">
              {communityDescription}
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
                {avgPrice > 0 ? formatPrice(avgPrice, currency) : "—"}
              </p>
              <p className="text-xs text-ink-500">Avg Price</p>
            </div>
          </div>
          <CommunityFavoriteButton communityId={community.id} />
        </div>

        {communityBanner && (
          <Link
            href={communityBanner.target_url ? `/api/ads/click/${communityBanner.id}` : "#"}
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

        {!hasCoords && !hasRealNearbyData ? (
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
                    {formatPrice(minPrice, currency)}
                  </p>
                  <p className="text-xs text-ink-500">Lowest starting price</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-gold-400">
                    {formatPrice(avgPrice, currency)}
                  </p>
                  <p className="text-xs text-ink-500">Average starting price</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-ink-100">
                    {formatPrice(maxPrice, currency)}
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
                      from {formatPrice(b.min, currency)}
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

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-navy-700 bg-navy-850 p-4">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-100">
              <Star className="h-4 w-4 text-gold-400" /> Investment Score
            </p>
            {avgInvestmentScore != null ? (
              <>
                <p className="text-3xl font-bold text-gold-400">
                  {avgInvestmentScore}
                  <span className="text-base text-ink-500">/100</span>
                </p>
                <p className="mt-2 text-xs text-ink-600">
                  Average across {communityProjects.length} listed project
                  {communityProjects.length === 1 ? "" : "s"} in {community.name}. A
                  transparent computed metric (rating, review volume, and the
                  &quot;high-roi&quot; tag) — not a fabricated market statistic. Same
                  formula as the Investment Score filter on the homepage.
                </p>
              </>
            ) : (
              <p className="text-sm text-ink-500">No priced listings yet.</p>
            )}
          </div>

          <div className="rounded-xl border border-navy-700 bg-navy-850 p-4">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-100">
              <TrendingUp className="h-4 w-4 text-gold-400" /> Market Trends
            </p>
            {marketInsights && marketInsights.totalProjects > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div>
                    <p className="text-lg font-bold text-ink-100">{marketInsights.offPlanCount}</p>
                    <p className="text-xs text-ink-500">Off-Plan</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-ink-100">{marketInsights.readyCount}</p>
                    <p className="text-xs text-ink-500">Ready</p>
                  </div>
                </div>
                {marketInsights.topDevelopersByCount.length > 0 && (
                  <div className="mt-3 border-t border-navy-800 pt-3">
                    <p className="mb-1.5 text-xs font-medium text-ink-400">Top Developers</p>
                    <p className="text-xs text-ink-300">
                      {marketInsights.topDevelopersByCount.map((d) => `${d.name} (${d.count})`).join(" · ")}
                    </p>
                  </div>
                )}
                {marketInsights.topTags.length > 0 && (
                  <div className="mt-3 border-t border-navy-800 pt-3">
                    <p className="mb-1.5 text-xs font-medium text-ink-400">Popular Tags</p>
                    <div className="flex flex-wrap gap-1.5">
                      {marketInsights.topTags.map((t) => (
                        <span
                          key={t.tag}
                          className="rounded-full bg-navy-800 px-2 py-0.5 text-[10px] text-ink-300"
                        >
                          {t.tag} ({t.count})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-ink-500">No market data yet.</p>
            )}
          </div>
        </div>

        {avgPrice > 0 && (
          <div className="mt-6 rounded-xl border border-navy-700 bg-navy-850 p-4">
            <p className="mb-1 text-sm font-semibold text-ink-100">Investment Tools</p>
            <p className="mb-4 text-xs text-ink-500">
              Estimate potential returns using {community.name}&apos;s average
              listing price as a starting point — every figure below is yours to
              adjust. This platform doesn&apos;t track historical rental or resale
              data, so these are your own modeled estimates, not verified figures
              for this community.
            </p>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <RoiCalculator priceAed={avgPrice} />
              <RentalYieldCalculator priceAed={avgPrice} />
            </div>
          </div>
        )}

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
  points: NearbyDisplayPoint[];
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
                {pt.driveKm != null ? ` · ~${pt.driveKm.toFixed(1)} km by road` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
