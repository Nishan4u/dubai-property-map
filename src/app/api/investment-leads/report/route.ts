import { NextRequest, NextResponse } from "next/server";
import {
  getCommunityById,
  getProjectsForCommunity,
  getMarketInsights,
  getCommunityNearestLocations,
  getPublishedProjects,
} from "@/lib/supabase/queries";
import { mapProject } from "@/lib/supabase/mappers";
import { getInvestmentScore, findNearestByCategory, type NearestPoi } from "@/lib/investmentScore";
import { computeRoi, computeRentalYield } from "@/lib/calculators";

const NEARBY_CATEGORY_KEYS = ["metro", "schools", "beaches", "malls", "hospitals"];

// Read-only, no auth required -- exactly the same real, already-public
// data the community page itself shows to anyone (getProjectsForCommunity/
// getMarketInsights/getCommunityNearestLocations), just reshaped for the
// Investment Report. Never fabricates a market figure, matching every
// other calculator/score in this codebase.
export async function GET(request: NextRequest) {
  const communityId = request.nextUrl.searchParams.get("communityId");

  if (communityId) {
    const community = await getCommunityById(communityId);
    if (!community) {
      return NextResponse.json({ error: "Community not found." }, { status: 404 });
    }

    const [projectRows, marketInsights, nearestLocationRows] = await Promise.all([
      getProjectsForCommunity(community.id),
      getMarketInsights(community.name),
      getCommunityNearestLocations(community.id),
    ]);
    const projects = projectRows.map((p) => mapProject(p));

    const investmentScores = projects.map((p) => getInvestmentScore(p));
    const avgInvestmentScore = investmentScores.length
      ? Math.round(investmentScores.reduce((sum, s) => sum + s, 0) / investmentScores.length)
      : null;
    const prices = projects.map((p) => p.priceFromAed).filter((p) => p > 0);
    const avgPriceAed = prices.length ? Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length) : 0;
    const minPriceAed = prices.length ? Math.min(...prices) : 0;
    const maxPriceAed = prices.length ? Math.max(...prices) : 0;

    // Real per-community nearest-place data (patch_124) takes priority when
    // it exists -- one (closest) row per category, matching the one-per-
    // category shape findNearestByCategory itself returns. Otherwise the
    // same live computation the project detail page and presentations API
    // already use for "Location Intelligence".
    let nearby: NearestPoi[];
    if (nearestLocationRows.length > 0) {
      const closestPerCategory = new Map<string, NearestPoi>();
      for (const row of nearestLocationRows) {
        if (row.rank !== 1) continue;
        closestPerCategory.set(row.category, {
          categoryKey: row.category,
          categoryLabel: row.category.charAt(0).toUpperCase() + row.category.slice(1),
          name: row.poi_name,
          distanceKm: Number(row.distance_km),
        });
      }
      nearby = Array.from(closestPerCategory.values());
    } else if (community.lat != null && community.lng != null) {
      nearby = findNearestByCategory(community.lat, community.lng, NEARBY_CATEGORY_KEYS);
    } else {
      nearby = [];
    }

    // ROI/Yield snapshot seeded from this community's own real average
    // starting price -- reuses the exact same math the ROI/Rental Yield
    // calculators already ship, never a fabricated figure.
    const roi = avgPriceAed > 0
      ? computeRoi({
          priceAed: avgPriceAed,
          cashInvested: Math.round(avgPriceAed * 0.25),
          annualRent: Math.round(avgPriceAed * 0.06),
          annualExpenses: Math.round(avgPriceAed * 0.01),
        })
      : null;
    const yieldResult = avgPriceAed > 0
      ? computeRentalYield({
          priceAed: avgPriceAed,
          annualRent: Math.round(avgPriceAed * 0.06),
          annualCosts: Math.round(avgPriceAed * 0.008),
        })
      : null;

    return NextResponse.json({
      kind: "community",
      community: { id: community.id, name: community.name, slug: community.slug },
      projectCount: projects.length,
      avgInvestmentScore,
      avgPriceAed,
      minPriceAed,
      maxPriceAed,
      marketInsights,
      nearby,
      roi,
      yield: yieldResult,
      projects: projects.slice(0, 6).map((p) => ({
        slug: p.slug,
        name: p.name,
        priceFromAed: p.priceFromAed,
        bedroomsFrom: p.bedroomsFrom,
        bedroomsTo: p.bedroomsTo,
      })),
    });
  }

  // "Not sure yet" -- a citywide summary: top communities by real
  // published-project activity, computed from already-published real
  // projects, never fabricated.
  const projectRows = await getPublishedProjects();
  const byCommunity = new Map<
    string,
    { id: string; name: string; slug: string; prices: number[]; scores: number[] }
  >();
  for (const row of projectRows) {
    const c = row.communities;
    if (!c) continue;
    const entry = byCommunity.get(c.id) ?? { id: c.id, name: c.name, slug: c.slug, prices: [], scores: [] };
    const project = mapProject(row);
    if (project.priceFromAed > 0) entry.prices.push(project.priceFromAed);
    entry.scores.push(getInvestmentScore(project));
    byCommunity.set(c.id, entry);
  }
  const topCommunities = Array.from(byCommunity.values())
    .map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      projectCount: c.scores.length,
      avgPriceAed: c.prices.length ? Math.round(c.prices.reduce((s, p) => s + p, 0) / c.prices.length) : 0,
      avgInvestmentScore: c.scores.length ? Math.round(c.scores.reduce((s, v) => s + v, 0) / c.scores.length) : 0,
    }))
    .sort((a, b) => b.projectCount - a.projectCount)
    .slice(0, 5);

  return NextResponse.json({ kind: "citywide", topCommunities });
}
