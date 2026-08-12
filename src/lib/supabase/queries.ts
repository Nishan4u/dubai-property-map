import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { categorySlug, documentCategories } from "@/lib/documentCategories";
import { exteriorGalleryCategories, gallerySlug, interiorGalleryCategories } from "@/lib/galleryCategories";
import { getStripe } from "@/lib/stripe";
import type {
  ProjectWithRelations,
  DbBrokerVerificationStatus,
  DbBrokerListingType,
  BrokerPublicProfileRow,
} from "@/types/database";

export async function getCurrentProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile ? { ...profile, email: user.email } : null;
}

// The dashboard layout already gates access to developers with a linked
// developer_id, but each dashboard page fetches its own profile
// independently — this guards against a transient auth/profile-fetch
// glitch crashing the page instead of just bouncing back to login.
export async function requireDeveloperProfile() {
  const profile = await getCurrentProfile();
  if (!profile?.developer_id) {
    redirect("/login");
  }
  return profile as NonNullable<typeof profile> & { developer_id: string };
}

export async function requireBrokerProfile() {
  const profile = await getCurrentProfile();
  if (!profile?.broker_id) {
    redirect("/login");
  }
  return profile as NonNullable<typeof profile> & { broker_id: string };
}

export async function requireSalespersonProfile() {
  const profile = await getCurrentProfile();
  if (!profile?.salesperson_id) {
    redirect("/login");
  }
  return profile as NonNullable<typeof profile> & { salesperson_id: string };
}

export async function requireBrokerAgencyProfile() {
  const profile = await getCurrentProfile();
  if (!profile?.broker_agency_id) {
    redirect("/login");
  }
  return profile as NonNullable<typeof profile> & { broker_agency_id: string };
}

export async function requireStaffProfile() {
  const profile = await getCurrentProfile();
  if (!profile?.staff_id) {
    redirect("/staff/login");
  }
  return profile as NonNullable<typeof profile> & { staff_id: string };
}

// Admin gating has always been done inline in src/app/admin/layout.tsx —
// this is the first shared helper for it, needed by new API routes (e.g.
// admin broker-approval actions) that aren't a page layout and so can't
// rely on that layout's redirect.
export async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    redirect("/login");
  }
  return profile as NonNullable<typeof profile>;
}

export async function getPublishedProjects(developerId?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("projects")
    .select("*, developers(*), communities(*), project_unit_types(unit_type, size_sqft)")
    .in("status", ["published", "featured"]);

  if (developerId) {
    query = query.eq("developer_id", developerId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as ProjectWithRelations[];
}

export interface AssistantProjectSearchFilters {
  community?: string;
  developer?: string;
  propertyType?: string;
  bedroomsMin?: number;
  bedroomsMax?: number;
  priceMaxAed?: number;
  tags?: string[];
  listingType?: string;
  limit?: number;
  /** Exact developer_id match -- distinct from the name-ilike `developer`
   * filter above. Set server-side (never from user/model input) to enforce
   * "salesperson sees only their assigned developer's projects" in the AI
   * Sales Assistant's search_projects call. */
  developerId?: string;
}

export interface AssistantProjectResult {
  name: string;
  path: string;
  priceFromAed: number;
  bedroomsFrom: number;
  bedroomsTo: number;
  propertyType: string;
  communityName: string;
  developerName: string;
  handoverQuarter: string | null;
  handoverYear: number | null;
  tags: string[];
}

// Real, server-side-filtered project search for the AI assistant's
// search_projects tool (src/lib/ai/assistant.ts) -- deliberately separate
// from getPublishedProjects() above, which fetches everything unfiltered
// for the client-side array filtering the public map/list pages already
// do. An LLM tool call needs a small, targeted result set instead, so this
// does real .ilike()/.eq()/.gte() filtering in Postgres and returns a lean
// shape cheap enough to hand back to the model.
export async function searchProjectsForAssistant(
  filters: AssistantProjectSearchFilters
): Promise<AssistantProjectResult[]> {
  const supabase = await createClient();
  const limit = Math.min(Math.max(filters.limit ?? 8, 1), 10);

  let query = supabase
    .from("projects")
    .select(
      "slug, name, price_from_aed, bedrooms_from, bedrooms_to, property_type, handover_quarter, handover_year, tags, developers!inner(name), communities!inner(name)"
    )
    .in("status", ["published", "featured"]);

  if (filters.community) query = query.ilike("communities.name", `%${filters.community}%`);
  if (filters.developer) query = query.ilike("developers.name", `%${filters.developer}%`);
  if (filters.developerId) query = query.eq("developer_id", filters.developerId);
  if (filters.propertyType) query = query.ilike("property_type", `%${filters.propertyType}%`);
  if (filters.listingType) query = query.eq("listing_type", filters.listingType);
  if (typeof filters.bedroomsMin === "number") query = query.gte("bedrooms_to", filters.bedroomsMin);
  if (typeof filters.bedroomsMax === "number") query = query.lte("bedrooms_from", filters.bedroomsMax);
  if (typeof filters.priceMaxAed === "number") query = query.lte("price_from_aed", filters.priceMaxAed);
  if (filters.tags?.length) query = query.overlaps("tags", filters.tags);

  const { data, error } = await query
    .order("price_from_aed", { ascending: true })
    .limit(limit);

  if (error) throw error;

  type Row = {
    slug: string;
    name: string;
    price_from_aed: number;
    bedrooms_from: number;
    bedrooms_to: number;
    property_type: string;
    handover_quarter: string | null;
    handover_year: number | null;
    tags: string[];
    developers: { name: string } | { name: string }[];
    communities: { name: string } | { name: string }[];
  };

  const rows = (data ?? []) as unknown as Row[];
  return rows.map((row) => {
    const developer = Array.isArray(row.developers) ? row.developers[0] : row.developers;
    const community = Array.isArray(row.communities) ? row.communities[0] : row.communities;
    return {
      name: row.name,
      path: `/projects/${row.slug}`,
      priceFromAed: row.price_from_aed,
      bedroomsFrom: row.bedrooms_from,
      bedroomsTo: row.bedrooms_to,
      propertyType: row.property_type,
      communityName: community?.name ?? "",
      developerName: developer?.name ?? "",
      handoverQuarter: row.handover_quarter,
      handoverYear: row.handover_year,
      tags: row.tags,
    };
  });
}

// ---------- AI Market Insights / Investment Advisor / Buyer Matching ----------
// Deliberately built only from real columns that exist on `projects` today
// (price_from_aed, handover_year, tags, escrow_status) -- there is no ROI,
// rental yield, or investment-score field anywhere in this schema, and
// none of this should ever fabricate one. "high-roi" etc. in `tags` is the
// listing's own marketing claim, surfaced as such, never presented as a
// computed return figure.

export interface MarketInsightsResult {
  scope: string;
  totalProjects: number;
  priceRangeAed: { minAed: number; maxAed: number; avgAed: number } | null;
  offPlanCount: number;
  readyCount: number;
  bedroomBreakdown: Record<string, number>;
  topDevelopersByCount: { name: string; count: number }[];
  topTags: { tag: string; count: number }[];
}

export async function getMarketInsights(communityName?: string): Promise<MarketInsightsResult> {
  const supabase = await createClient();
  let query = supabase
    .from("projects")
    .select("price_from_aed, bedrooms_from, bedrooms_to, handover_year, tags, developers!inner(name), communities!inner(name)")
    .in("status", ["published", "featured"]);
  if (communityName) query = query.ilike("communities.name", `%${communityName}%`);

  const { data, error } = await query;
  if (error) throw error;

  type Row = {
    price_from_aed: number;
    bedrooms_from: number;
    bedrooms_to: number;
    handover_year: number | null;
    tags: string[];
    developers: { name: string } | { name: string }[];
  };
  const rows = (data ?? []) as unknown as Row[];

  const prices = rows.map((r) => r.price_from_aed).filter((p) => typeof p === "number" && p > 0);
  const currentYear = new Date().getFullYear();
  const offPlanCount = rows.filter((r) => (r.handover_year ?? currentYear) > currentYear).length;

  const bedroomBreakdown: Record<string, number> = {};
  const devCounts = new Map<string, number>();
  const tagCounts = new Map<string, number>();
  for (const r of rows) {
    for (let b = r.bedrooms_from; b <= r.bedrooms_to; b++) {
      bedroomBreakdown[String(b)] = (bedroomBreakdown[String(b)] ?? 0) + 1;
    }
    const devName = Array.isArray(r.developers) ? r.developers[0]?.name : r.developers?.name;
    if (devName) devCounts.set(devName, (devCounts.get(devName) ?? 0) + 1);
    for (const t of r.tags ?? []) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
  }

  return {
    scope: communityName ?? "Dubai-wide (all live listings)",
    totalProjects: rows.length,
    priceRangeAed: prices.length
      ? {
          minAed: Math.min(...prices),
          maxAed: Math.max(...prices),
          avgAed: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
        }
      : null,
    offPlanCount,
    readyCount: rows.length - offPlanCount,
    bedroomBreakdown,
    topDevelopersByCount: [...devCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count })),
    topTags: [...tagCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count })),
  };
}

export type InvestmentAnalysisResult =
  | { found: false; message: string }
  | {
      found: true;
      project: {
        name: string;
        priceFromAed: number;
        handoverYear: number | null;
        handoverQuarter: string | null;
        escrowStatus: string | null;
        tags: string[];
        communityName: string | null;
      };
      yearsToHandover: number | null;
      communityMarketStats: MarketInsightsResult;
      note: string;
    };

export async function getInvestmentAnalysisForProject(slug: string): Promise<InvestmentAnalysisResult> {
  if (!slug) return { found: false, message: "No project specified." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("name, price_from_aed, handover_year, handover_quarter, escrow_status, tags, communities(name)")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return { found: false, message: `No project with slug "${slug}" found.` };

  type Row = Omit<typeof data, "communities"> & { communities: { name: string } | { name: string }[] | null };
  const row = data as unknown as Row;
  const communityName = Array.isArray(row.communities) ? row.communities[0]?.name : row.communities?.name;
  const marketStats = await getMarketInsights(communityName ?? undefined);
  const currentYear = new Date().getFullYear();

  return {
    found: true,
    project: {
      name: data.name,
      priceFromAed: data.price_from_aed,
      handoverYear: data.handover_year,
      handoverQuarter: data.handover_quarter,
      escrowStatus: data.escrow_status,
      tags: data.tags,
      communityName: communityName ?? null,
    },
    yearsToHandover: data.handover_year != null ? data.handover_year - currentYear : null,
    communityMarketStats: marketStats,
    note: "Tags such as 'high-roi' are the listing's own marketing claim, not a verified or computed return figure -- this platform has no historical rental or resale data to calculate real ROI or rental yield.",
  };
}

export type MatchedProjectsResult =
  | { hasSignal: false; message: string; favoriteCount: number }
  | { hasSignal: true; favoriteCount: number; projects: AssistantProjectResult[] };

export async function getMatchedProjectsForBuyer(buyerId: string): Promise<MatchedProjectsResult> {
  const supabase = await createClient();
  const { data: favRows } = await supabase
    .from("favorites")
    .select("projects!inner(slug, price_from_aed, bedrooms_from, bedrooms_to, tags, communities(name))")
    .eq("user_id", buyerId);

  type FavRow = {
    projects:
      | { slug: string; price_from_aed: number; bedrooms_from: number; bedrooms_to: number; tags: string[]; communities: { name: string } | { name: string }[] | null }
      | { slug: string; price_from_aed: number; bedrooms_from: number; bedrooms_to: number; tags: string[]; communities: { name: string } | { name: string }[] | null }[];
  };
  const favorites = ((favRows ?? []) as unknown as FavRow[]).map((r) => (Array.isArray(r.projects) ? r.projects[0] : r.projects));

  if (!favorites.length) {
    return {
      hasSignal: false,
      favoriteCount: 0,
      message: "This visitor has no favorited projects yet, so there's nothing to personalize from -- suggest favoriting a few they like first.",
    };
  }

  const prices = favorites.map((f) => f.price_from_aed).filter((p) => p > 0);
  const avgPrice = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : undefined;

  const bedroomCounts = new Map<number, number>();
  const communityCounts = new Map<string, number>();
  const tagCounts = new Map<string, number>();
  const favoritedSlugs = new Set(favorites.map((f) => f.slug));
  for (const f of favorites) {
    for (let b = f.bedrooms_from; b <= f.bedrooms_to; b++) bedroomCounts.set(b, (bedroomCounts.get(b) ?? 0) + 1);
    const communityName = Array.isArray(f.communities) ? f.communities[0]?.name : f.communities?.name;
    if (communityName) communityCounts.set(communityName, (communityCounts.get(communityName) ?? 0) + 1);
    for (const t of f.tags ?? []) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
  }
  const topCommunity = [...communityCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const topBedroom = [...bedroomCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const topTags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => t);

  const candidates = await searchProjectsForAssistant({
    community: topCommunity,
    bedroomsMin: topBedroom,
    bedroomsMax: topBedroom,
    priceMaxAed: avgPrice ? Math.round(avgPrice * 1.3) : undefined,
    tags: topTags.length ? topTags : undefined,
    limit: 8,
  });

  const projects = candidates.filter((c) => !favoritedSlugs.has(c.path.replace(/^\/projects\//, ""))).slice(0, 5);

  return { hasSignal: true, favoriteCount: favorites.length, projects };
}

// A logged-in Developer or Salesperson account only ever sees their own
// developer's projects on the main map/search/filters — everything else
// (areas, communities) stays visible. Salespersons don't carry developer_id
// on their own profile row, so it's looked up via their salesperson record.
// Public visitors, admins, and brokers get null (unrestricted).
export async function getViewerProjectScope(): Promise<string | null> {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  if (profile.developer_id) return profile.developer_id;

  if (profile.salesperson_id) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("salespersons")
      .select("developer_id")
      .eq("id", profile.salesperson_id)
      .maybeSingle();
    return data?.developer_id ?? null;
  }

  return null;
}

export type MapAccessStatus = "ok" | "guest" | "no_subscription" | "subscription_expired";
export interface MapAccessResult {
  status: MapAccessStatus;
  subscriptionHref: string;
}

// Mirrors is_verified_active_user() (patch_40) for the "logged in, verified,
// active account" gate, then layers on the broker/salesperson-only
// subscription + map_access_included check from the plan itself. Used
// server-side (page.tsx) so the real project/map data is simply never
// fetched or sent to an unauthorized viewer — the blur overlay is a UI
// affordance on top of that, not the actual protection.
export async function getMapAccessStatus(): Promise<MapAccessResult> {
  const supabase = await createClient();

  // Admin master switch (patch_85) -- disables every restriction platform-
  // wide, guests included, for maintenance/demo purposes. Must stay in
  // sync with get_viewer_map_access_status()'s own copy of this check,
  // since that function is what actually enforces the RLS lock-down on the
  // projects table (patch_83) -- this app-layer check controls whether the
  // UI even attempts to fetch/render, but the database is the real gate.
  const { data: siteSettings } = await supabase
    .from("site_access_settings")
    .select("restrictions_enabled")
    .eq("id", true)
    .maybeSingle();
  if (siteSettings?.restrictions_enabled === false) {
    return { status: "ok", subscriptionHref: "" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email_confirmed_at) {
    return { status: "guest", subscriptionHref: "/register" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, broker_id, broker_agency_id, salesperson_id, suspended")
    .eq("id", user.id)
    .single();
  if (!profile || profile.suspended) {
    return { status: "guest", subscriptionHref: "/register" };
  }

  if (profile.role === "buyer" || profile.role === "admin" || profile.role === "developer") {
    return { status: "ok", subscriptionHref: "" };
  }

  if (profile.role === "broker" && profile.broker_id) {
    const { data: broker } = await supabase
      .from("brokers")
      .select("subscription_status, plan_key")
      .eq("id", profile.broker_id)
      .single();
    return {
      status: await resolveSubscriptionMapAccess(broker?.subscription_status, broker?.plan_key, "broker"),
      subscriptionHref: "/broker/subscription",
    };
  }

  if (profile.role === "broker_agency" && profile.broker_agency_id) {
    const { data: agency } = await supabase
      .from("brokerages")
      .select("subscription_status, plan_key")
      .eq("id", profile.broker_agency_id)
      .single();
    return {
      status: await resolveSubscriptionMapAccess(agency?.subscription_status, agency?.plan_key, "broker_agency"),
      subscriptionHref: "/broker-agency/subscription",
    };
  }

  if (profile.role === "salesperson" && profile.salesperson_id) {
    const { data: salesperson } = await supabase
      .from("salespersons")
      .select("subscription_status, plan_key")
      .eq("id", profile.salesperson_id)
      .single();
    return {
      status: await resolveSubscriptionMapAccess(salesperson?.subscription_status, salesperson?.plan_key, "salesperson"),
      subscriptionHref: "/salesperson/subscription",
    };
  }

  return { status: "guest", subscriptionHref: "/register" };
}

// Admin "Global Free Access" per account type (spec section 13) -- when
// enabled, every account of that type gets treated as having an active
// subscription for map/property-request access, independent of their own
// actual subscription_status. Separate from the individual free grants in
// subscription_grants.
export async function isFreeAccessEnabled(accountType: "broker" | "broker_agency" | "salesperson"): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("free_access_settings")
    .select("enabled")
    .eq("account_type", accountType)
    .maybeSingle();
  return data?.enabled ?? false;
}

async function resolveSubscriptionMapAccess(
  subscriptionStatus: string | null | undefined,
  planKey: string | null | undefined,
  planType: "broker" | "broker_agency" | "salesperson"
): Promise<MapAccessStatus> {
  if (await isFreeAccessEnabled(planType)) return "ok";
  if (subscriptionStatus === "expired") return "subscription_expired";
  if (subscriptionStatus !== "active") return "no_subscription";

  if (planKey) {
    const supabase = await createClient();
    const { data: plan } = await supabase
      .from("subscription_plans")
      .select("map_access_included")
      .eq("key", planKey)
      .eq("plan_type", planType)
      .maybeSingle();
    if (plan && plan.map_access_included === false) return "no_subscription";
  }

  return "ok";
}

// A salesperson's own subscription and their assigned developer's
// subscription are two separate permission checks (spec: Section 12) — this
// is the second one. Only applies to salespersons; developers viewing their
// own dashboard/projects are never gated by this (that's the entitlement
// trigger's job, not a visibility block).
export async function getSalespersonDeveloperAccess(): Promise<{ developerId: string | null; blocked: boolean }> {
  const profile = await getCurrentProfile();
  if (!profile?.salesperson_id) return { developerId: null, blocked: false };

  const supabase = await createClient();
  const { data: salesperson } = await supabase
    .from("salespersons")
    .select("developer_id")
    .eq("id", profile.salesperson_id)
    .maybeSingle();
  if (!salesperson?.developer_id) return { developerId: null, blocked: false };

  const { data: developer } = await supabase
    .from("developers")
    .select("status, subscription_status, is_complimentary")
    .eq("id", salesperson.developer_id)
    .maybeSingle();
  if (!developer) return { developerId: salesperson.developer_id, blocked: true };

  const active = developer.status === "active" && (developer.subscription_status === "active" || developer.is_complimentary);
  return { developerId: salesperson.developer_id, blocked: !active };
}

export async function getProjectBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*, developers(*), communities(*)")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data as ProjectWithRelations | null;
}

export interface ProjectPreview {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  property_type: string;
  price_from_aed: number;
  cover_image_url: string | null;
  lat: number | null;
  lng: number | null;
  developer_id: string;
  community_id: string;
  updated_at: string;
  developer_name: string | null;
  developer_slug: string | null;
  community_name: string | null;
  community_slug: string | null;
}

// Public-safe subset of a project (see projects_public_meta in patch_82) --
// readable without an authorized session. Used for existence/ownership
// checks that must happen BEFORE the access gate, and for generateMetadata
// (share-link previews need a title/image/price even when the real detail
// page is gated). Never contains the fields the protected page shows
// (payment plan, escrow, amenities, unit types, documents, contact info).
export async function getProjectPreviewBySlug(slug: string): Promise<ProjectPreview | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects_public_meta")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// Powers the Developer Embeddable Map Widget (/embed/developer/[slug]) --
// same public-safe view as getProjectPreviewBySlug, just filtered to one
// developer instead of looked up by project slug. Works for a completely
// unauthenticated visitor on the developer's own external website, exactly
// like every other projects_public_meta read.
export async function getProjectPreviewsForDeveloper(developerId: string): Promise<ProjectPreview[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects_public_meta")
    .select("*")
    .eq("developer_id", developerId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

// Best-effort, never throws -- mirrors incrementProjectViews. Degrades to a
// silent no-op before patch_125 is applied (RPC doesn't exist yet), same
// "not configured yet, not fabricated" contract as every other optional
// counter/integration in this codebase.
export async function incrementDeveloperEmbedViews(developerId: string) {
  try {
    const supabase = await createClient();
    await supabase.rpc("increment_developer_embed_views", { p_id: developerId });
  } catch {
    // Pre-migration or transient error -- never block the embed page render.
  }
}

export async function getProjectSitemapEntries() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("projects_public_meta").select("slug, updated_at");

  if (error) throw error;
  return data ?? [];
}

export async function getDevelopers() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("developers")
    .select("*")
    .eq("status", "active")
    .order("featured", { ascending: false })
    .order("name");

  if (error) throw error;
  return data ?? [];
}

export async function getDeveloperBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("developers")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getCommunities() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("communities")
    .select("*")
    .order("featured", { ascending: false })
    .order("name");

  if (error) throw error;
  return data ?? [];
}

export async function getCommunityBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("communities")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// Real per-community nearest-place data (patch_124) -- top 3 named places
// per category with both straight-line and estimated driving distance.
// Pre-migration or for a community outside the imported set, this simply
// returns [] (table/rows may not exist yet) so callers can fall back to
// the existing live nearestPoints() computation instead of erroring.
export async function getCommunityNearestLocations(communityId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("community_nearest_locations")
    .select("category, rank, poi_name, poi_lat, poi_lng, distance_km, est_drive_km")
    .eq("community_id", communityId)
    .order("category")
    .order("rank");

  if (error) return [];
  return data ?? [];
}

// ---------- Public API (Module 15 "API & Webhooks" / Module 27 "API
// Security") ---------- Lean, deliberately narrow shapes for external
// API-key holders -- distinct from getPublishedProjects()/getDevelopers()/
// getCommunities() above, which return the full internal row shape used
// by the public site itself. No filters/pagination beyond a capped limit
// in this first pass, matching Connect-Any-CRM's own "real, bounded slice
// now, extend later" precedent.

export interface PublicApiProject {
  slug: string;
  name: string;
  propertyType: string;
  listingType: string;
  priceFromAed: number;
  bedroomsFrom: number;
  bedroomsTo: number;
  handoverQuarter: string | null;
  handoverYear: number | null;
  tags: string[];
  community: string | null;
  developer: string | null;
}

export async function getPublicApiProjects(limit = 50): Promise<PublicApiProject[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select(
      "slug, name, property_type, listing_type, price_from_aed, bedrooms_from, bedrooms_to, handover_quarter, handover_year, tags, developers(name), communities(name)"
    )
    .in("status", ["published", "featured"])
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 100));

  if (error) return [];

  type Row = {
    slug: string;
    name: string;
    property_type: string;
    listing_type: string;
    price_from_aed: number;
    bedrooms_from: number;
    bedrooms_to: number;
    handover_quarter: string | null;
    handover_year: number | null;
    tags: string[];
    developers: { name: string } | { name: string }[] | null;
    communities: { name: string } | { name: string }[] | null;
  };

  return ((data ?? []) as unknown as Row[]).map((row) => {
    const developer = Array.isArray(row.developers) ? row.developers[0] : row.developers;
    const community = Array.isArray(row.communities) ? row.communities[0] : row.communities;
    return {
      slug: row.slug,
      name: row.name,
      propertyType: row.property_type,
      listingType: row.listing_type,
      priceFromAed: row.price_from_aed,
      bedroomsFrom: row.bedrooms_from,
      bedroomsTo: row.bedrooms_to,
      handoverQuarter: row.handover_quarter,
      handoverYear: row.handover_year,
      tags: row.tags ?? [],
      community: community?.name ?? null,
      developer: developer?.name ?? null,
    };
  });
}

export async function getPublicApiCommunities(limit = 100) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("communities")
    .select("slug, name, description")
    .order("name")
    .limit(Math.min(Math.max(limit, 1), 200));
  if (error) return [];
  return data ?? [];
}

export async function getPublicApiDevelopers(limit = 100) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("developers")
    .select("slug, name, description, logo_url")
    .eq("status", "active")
    .order("name")
    .limit(Math.min(Math.max(limit, 1), 200));
  if (error) return [];
  return data ?? [];
}

export async function getProjectsForDeveloper(developerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*, developers(*), communities(*)")
    .eq("developer_id", developerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as ProjectWithRelations[];
}

export async function getProjectsForCommunity(communityId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*, developers(*), communities(*)")
    .eq("community_id", communityId)
    .in("status", ["published", "featured"]);

  if (error) throw error;
  return (data ?? []) as ProjectWithRelations[];
}

export async function getLeadsForDeveloper(developerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*, projects!inner(name, developer_id, price_from_aed)")
    .eq("projects.developer_id", developerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

// Extracted from the inline query in src/app/broker/page.tsx so the AI
// Broker Assistant's get_my_property_requests tool can share it. Note
// property_requests deliberately has no client name/phone/email columns
// (see patch_35) -- brokers submit their own requirement, not a named
// client's details -- so nothing here is ever client-identifying.
export async function getPropertyRequestsForBroker(brokerId: string, status?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("property_requests")
    .select("*, projects(name), developers(name), crm_clients(id, full_name, phone, email)")
    .eq("broker_id", brokerId)
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

// agency_property_requests is a deliberately separate table from
// property_requests (patch_68) -- an agency's own requests are never
// mixed with, or linked to, any individual broker's clients, so unlike
// getPropertyRequestsForBroker this has no crm_clients join at all.
export async function getPropertyRequestsForBrokerAgency(brokerageId: string, status?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("agency_property_requests")
    .select("*, projects(name), developers(name), salespersons(full_name)")
    .eq("brokerage_id", brokerageId)
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

// Extracted from the inline query in src/app/salesperson/leads/page.tsx so
// the AI Sales Assistant's get_my_leads tool can share it.
export async function getPropertyRequestsForSalesperson(salespersonId: string, status?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("property_requests")
    .select("*, brokers(full_name, brn, mobile, whatsapp, email), projects(name), crm_clients(id, full_name, phone, email)")
    .eq("salesperson_id", salespersonId)
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

// ---------- Built-in CRM: Clients, Notes, Tasks ----------
// Layered on top of property_requests (patch_98) rather than replacing it
// -- property_requests itself still carries no client PII columns; contact
// info lives here, reachable only via the opaque client_id join.

export interface CrmClientRow {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  source: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export async function getCrmClientsForBroker(brokerId: string): Promise<CrmClientRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crm_clients")
    .select("id, full_name, email, phone, whatsapp, source, status, created_at, updated_at")
    .eq("broker_id", brokerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getCrmClientsForSalesperson(salespersonId: string): Promise<CrmClientRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crm_clients")
    .select("id, full_name, email, phone, whatsapp, source, status, created_at, updated_at")
    .eq("salesperson_id", salespersonId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getCrmClientsForDeveloper(developerId: string): Promise<CrmClientRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crm_clients")
    .select("id, full_name, email, phone, whatsapp, source, status, created_at, updated_at")
    .eq("developer_id", developerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getCrmClientsForBrokerAgency(brokerageId: string): Promise<CrmClientRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crm_clients")
    .select("id, full_name, email, phone, whatsapp, source, status, created_at, updated_at")
    .eq("brokerage_id", brokerageId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getReservationsForDeveloper(developerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("unit_reservations")
    .select("*, projects(name), crm_clients!inner(full_name, email, phone, developer_id)")
    .eq("crm_clients.developer_id", developerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getAllReservationsAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("unit_reservations")
    .select("*, projects(name), crm_clients(full_name, email, phone)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

async function getAppointments(
  ownerColumn: "broker_id" | "salesperson_id" | "developer_id" | "brokerage_id",
  ownerId: string
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crm_appointments")
    .select("*, crm_clients(full_name)")
    .eq(ownerColumn, ownerId)
    .order("scheduled_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getAppointmentsForBroker(brokerId: string) {
  return getAppointments("broker_id", brokerId);
}

export async function getAppointmentsForSalesperson(salespersonId: string) {
  return getAppointments("salesperson_id", salespersonId);
}

export async function getAppointmentsForDeveloper(developerId: string) {
  return getAppointments("developer_id", developerId);
}

export async function getAppointmentsForBrokerAgency(brokerageId: string) {
  return getAppointments("brokerage_id", brokerageId);
}

async function getCollections(
  ownerColumn: "broker_id" | "salesperson_id" | "developer_id" | "brokerage_id",
  ownerId: string
) {
  const supabase = await createClient();
  // crm_collection_views (patch_140) is a newer addition that may not be
  // migrated on every environment yet -- PostgREST hard-errors on an
  // embedded select against a table that doesn't exist, which would
  // otherwise break this already-shipped Collections query for everyone
  // until the migration runs. Try the full select first; fall back to the
  // base select (no view counts) on any error, same two-tier pattern the
  // presentations route already uses for hide_*/mode.
  const { data, error } = await supabase
    .from("crm_collections")
    .select("*, crm_clients(full_name), crm_collection_items(count), crm_collection_views(count)")
    .eq(ownerColumn, ownerId)
    .order("created_at", { ascending: false });
  if (!error) return data ?? [];

  const { data: fallback, error: fallbackError } = await supabase
    .from("crm_collections")
    .select("*, crm_clients(full_name), crm_collection_items(count)")
    .eq(ownerColumn, ownerId)
    .order("created_at", { ascending: false });
  if (fallbackError) throw fallbackError;
  return fallback ?? [];
}

export async function getCollectionsForBroker(brokerId: string) {
  return getCollections("broker_id", brokerId);
}

export async function getCollectionsForSalesperson(salespersonId: string) {
  return getCollections("salesperson_id", salespersonId);
}

export async function getCollectionsForDeveloper(developerId: string) {
  return getCollections("developer_id", developerId);
}

export async function getCollectionsForBrokerAgency(brokerageId: string) {
  return getCollections("brokerage_id", brokerageId);
}

// Presentation Studio 2.0 (patch_140) -- last-viewed timestamp per
// collection, for the "Opened N times · last viewed {relative time}" line
// on each Collections page. One bulk select + in-JS reduce to
// first-per-collection (crm_collection_views is append-only and can have
// many rows per collection), not a per-collection query -- same bulk-query
// convention already used elsewhere in this file.
export async function getLastViewedAtForCollections(
  collectionIds: string[]
): Promise<Record<string, string>> {
  if (collectionIds.length === 0) return {};
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crm_collection_views")
    .select("collection_id, created_at")
    .in("collection_id", collectionIds)
    .order("created_at", { ascending: false });
  // Table may not exist yet on an unmigrated environment (patch_140) --
  // degrade to "no view data" rather than breaking the Collections page.
  if (error || !data) return {};
  const result: Record<string, string> = {};
  for (const row of data) {
    if (!result[row.collection_id]) result[row.collection_id] = row.created_at;
  }
  return result;
}

// Agency White-Label Storefront -- the agency's own persistent, public
// project picks (distinct from crm_collections, which are private/
// client-specific share links). Same "select *, throw on error" shape as
// getCollections() above -- acceptable here since this only runs on the
// agency's own new /broker-agency/storefront page, not any existing one.
export async function getStorefrontItemsForBrokerAgency(brokerageId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brokerage_storefront_items")
    .select("id, project_id, sort_order")
    .eq("brokerage_id", brokerageId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

async function getCrmClientDetail(
  ownerColumn: "broker_id" | "salesperson_id" | "developer_id" | "brokerage_id",
  ownerId: string,
  clientId: string
) {
  const supabase = await createClient();
  const { data: client, error } = await supabase
    .from("crm_clients")
    .select("*")
    .eq("id", clientId)
    .eq(ownerColumn, ownerId)
    .maybeSingle();
  if (error) throw error;
  if (!client) return null;

  const [{ data: requests }, { data: notes }, { data: tasks }, { data: reservations }, { data: emailHistory }, { data: communicationLogs }] =
    await Promise.all([
      supabase
        .from("property_requests")
        .select("id, request_id, status, property_type, budget_min, budget_max, created_at, projects(name)")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false }),
      supabase.from("crm_notes").select("id, body, created_at, created_by").eq("client_id", clientId).order("created_at", { ascending: false }),
      supabase
        .from("crm_tasks")
        .select("id, title, due_at, status, created_at")
        .eq("client_id", clientId)
        .order("due_at", { ascending: true, nullsFirst: false }),
      supabase
        .from("unit_reservations")
        .select("*, projects(name)")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false }),
      // Empty-string fallback when the client has no email on file --
      // naturally yields zero rows, no special-casing needed.
      supabase
        .from("email_logs")
        .select("id, subject, category, status, sent_at, created_at")
        .eq("to_email", client.email ?? "")
        .order("created_at", { ascending: false }),
      supabase
        .from("crm_communication_logs")
        .select("id, channel, direction, outcome, notes, created_at")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false }),
    ]);

  return {
    client,
    requests: requests ?? [],
    notes: notes ?? [],
    tasks: tasks ?? [],
    reservations: reservations ?? [],
    emailHistory: emailHistory ?? [],
    communicationLogs: communicationLogs ?? [],
  };
}

export async function getCrmClientDetailForBroker(clientId: string, brokerId: string) {
  return getCrmClientDetail("broker_id", brokerId, clientId);
}

export async function getCrmClientDetailForSalesperson(clientId: string, salespersonId: string) {
  return getCrmClientDetail("salesperson_id", salespersonId, clientId);
}

export async function getCrmClientDetailForDeveloper(clientId: string, developerId: string) {
  return getCrmClientDetail("developer_id", developerId, clientId);
}

export async function getCrmClientDetailForBrokerAgency(clientId: string, brokerageId: string) {
  return getCrmClientDetail("brokerage_id", brokerageId, clientId);
}

export async function getCrmIntegrationsForOwner(
  ownerType: "broker" | "salesperson" | "developer" | "broker_agency",
  ownerId: string
) {
  const supabase = await createClient();
  // broker_agency's owning column is brokerage_id, not broker_agency_id --
  // every other owner type's column name matches its ownerType directly.
  const ownerColumn = ownerType === "broker_agency" ? "brokerage_id" : `${ownerType}_id`;
  const { data: integrations, error } = await supabase
    .from("crm_integrations")
    .select("*")
    .eq(ownerColumn, ownerId)
    .order("created_at", { ascending: false });

  if (error || !integrations?.length) return [];

  const { data: logs } = await supabase
    .from("crm_integration_logs")
    .select("*")
    .in(
      "integration_id",
      integrations.map((i) => i.id)
    )
    .order("created_at", { ascending: false });

  return integrations.map((integration) => ({
    ...integration,
    logs: (logs ?? []).filter((l) => l.integration_id === integration.id).slice(0, 10),
  }));
}

export async function getAllCrmIntegrationsAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crm_integrations")
    .select("*, brokers(full_name), salespersons(full_name), developers(name), brokerages(name)")
    .order("created_at", { ascending: false });

  if (error) return [];
  return data ?? [];
}

// Admin oversight for the Public API: every key plus its 10 most recent
// request-log rows, mirroring getCrmIntegrationsForOwner's exact "fetch
// once, filter+slice in memory" shape rather than an N+1 query per key.
export async function getAllApiKeysAdmin() {
  const supabase = await createClient();
  const { data: keys, error } = await supabase.from("api_keys").select("*").order("created_at", { ascending: false });
  if (error || !keys?.length) return [];

  const { data: logs } = await supabase
    .from("api_request_logs")
    .select("*")
    .in(
      "api_key_id",
      keys.map((k) => k.id)
    )
    .order("created_at", { ascending: false });

  return keys.map((key) => ({
    ...key,
    logs: (logs ?? []).filter((l) => l.api_key_id === key.id).slice(0, 10),
  }));
}

// Deliberately never selects secret_access_key -- the raw secret is only
// ever handled server-side (src/app/api/developer/storage-connection and
// storageSync.ts, both via the admin client), never sent back to the browser.
export async function getStorageConnectionForDeveloper(developerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("storage_connections")
    .select("bucket_name, region, access_key_id, status, last_synced_at, last_sync_file_count, last_sync_error")
    .eq("developer_id", developerId)
    .maybeSingle();
  if (error) return null;
  return data;
}

export async function getBookingsForDeveloper(developerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*, projects!inner(name, developer_id)")
    .eq("projects.developer_id", developerId)
    .order("scheduled_date", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getAllLeadsAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*, projects(name)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getAllProjectsAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*, developers(*), communities(*)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as ProjectWithRelations[];
}

export async function getAllDevelopersAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("developers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getAllBrokersAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brokers")
    .select("*, brokerages(name)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

// ============================================================
// Broker Directory & Property Listing Module (patch_127)
// ============================================================

export interface BrokerDirectoryRow {
  id: string;
  slug: string;
  full_name: string;
  photo_url: string | null;
  brokerage_name: string | null;
  brokerage_verified: boolean;
  verification_status: DbBrokerVerificationStatus;
  featured: boolean;
  profile_views: number;
  created_at: string;
  languages: string[];
  listings_count: number;
  projects_count: number;
  /** Distinct community/property-type/listing-type values across this
   * broker's own approved listings -- powers client-side directory
   * filtering without a second round-trip per filter. */
  listingCommunityIds: string[];
  listingPropertyTypes: string[];
  listingTypes: DbBrokerListingType[];
}

// Public Brokers Directory (spec section 3/7) -- reads brokers_public_
// profile (never the raw brokers table, so contact fields never reach a
// guest's payload) and merges listing/project counts computed the same
// way DevelopersPage merges project counts: fetch once, group in JS,
// rather than a fragile embedded-aggregate query.
// Degrades to an empty directory before patch_127 is applied (view/tables
// don't exist yet) -- same "not configured yet, not fabricated, never
// crash the page" contract as every other optional feature this session.
export async function getBrokersDirectory(): Promise<BrokerDirectoryRow[]> {
  const supabase = await createClient();
  // visibility (patch_142) is a genuinely new column -- fall back to the
  // pre-patch_142 query (no visibility filter, same as every listing
  // behaved before this column existed) if it errors on an unmigrated
  // environment, same defensive-fallback convention as every other
  // recently-added optional column in this codebase.
  let listingsResult = await supabase
    .from("broker_listings")
    .select("broker_id, community_id, property_type, listing_type")
    .eq("moderation_status", "approved")
    .eq("visibility", "public");
  if (listingsResult.error) {
    listingsResult = await supabase
      .from("broker_listings")
      .select("broker_id, community_id, property_type, listing_type")
      .eq("moderation_status", "approved");
  }
  const { data: listings } = listingsResult;

  const [{ data: brokers, error }, { data: links }] = await Promise.all([
    supabase
      .from("brokers_public_profile")
      .select("*")
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("broker_project_links").select("broker_id"),
  ]);
  if (error) return [];

  const listingsByBroker = new Map<string, { community_id: string | null; property_type: string; listing_type: DbBrokerListingType }[]>();
  for (const row of listings ?? []) {
    const arr = listingsByBroker.get(row.broker_id) ?? [];
    arr.push(row);
    listingsByBroker.set(row.broker_id, arr);
  }
  const projectCountMap = new Map<string, number>();
  for (const row of links ?? []) {
    projectCountMap.set(row.broker_id, (projectCountMap.get(row.broker_id) ?? 0) + 1);
  }

  return (brokers ?? []).map((b: BrokerPublicProfileRow) => {
    const own = listingsByBroker.get(b.id) ?? [];
    return {
      id: b.id,
      slug: b.slug,
      full_name: b.full_name,
      photo_url: b.photo_url,
      brokerage_name: b.brokerage_name,
      brokerage_verified: b.brokerage_verified ?? false,
      verification_status: b.verification_status,
      featured: b.featured,
      profile_views: b.profile_views,
      created_at: b.created_at,
      languages: b.languages ?? [],
      listings_count: own.length,
      projects_count: projectCountMap.get(b.id) ?? 0,
      listingCommunityIds: [...new Set(own.map((l) => l.community_id).filter((v): v is string => Boolean(v)))],
      listingPropertyTypes: [...new Set(own.map((l) => l.property_type))],
      listingTypes: [...new Set(own.map((l) => l.listing_type))],
    };
  });
}

// Broker Profile Page (spec section 4) -- public-safe fields only.
// Degrades to null (404) rather than throwing before patch_127 is applied.
export async function getBrokerPublicProfile(slug: string): Promise<BrokerPublicProfileRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("brokers_public_profile").select("*").eq("slug", slug).maybeSingle();
  if (error) return null;
  return data;
}

export async function incrementBrokerProfileViews(brokerId: string) {
  try {
    const supabase = await createClient();
    await supabase.rpc("increment_broker_profile_views", { p_id: brokerId });
  } catch {
    // Pre-migration or transient error -- never block the profile render.
  }
}

export async function getBrokerListingsPublic(brokerId: string) {
  const supabase = await createClient();
  // Only 'public'-tier listings show on the broker's own public grid --
  // 'presentation'-tier listings are unlisted (reachable only via their
  // own direct slug URL, see getBrokerListingBySlugPublic below, which
  // deliberately does NOT filter on visibility). Falls back to the
  // pre-patch_142 query (no visibility filter) on an unmigrated
  // environment, same convention as getBrokersDirectory above.
  let result = await supabase
    .from("broker_listings")
    .select("*, communities(name, slug)")
    .eq("broker_id", brokerId)
    .eq("moderation_status", "approved")
    .eq("visibility", "public")
    .order("created_at", { ascending: false });
  if (result.error) {
    result = await supabase
      .from("broker_listings")
      .select("*, communities(name, slug)")
      .eq("broker_id", brokerId)
      .eq("moderation_status", "approved")
      .order("created_at", { ascending: false });
  }

  if (result.error) return [];
  return result.data ?? [];
}

export async function getBrokerListingBySlugPublic(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("broker_listings")
    .select("*, communities(name, slug), brokers!inner(id, slug, full_name, photo_url, verification_status, brokerage_id, brokerages(name))")
    .eq("slug", slug)
    .eq("moderation_status", "approved")
    .maybeSingle();

  if (error) return null;
  return data;
}

export async function incrementBrokerListingViews(listingId: string) {
  try {
    const supabase = await createClient();
    await supabase.rpc("increment_broker_listing_views", { p_id: listingId });
  } catch {
    // Pre-migration or transient error -- never block the listing render.
  }
}

// Developer Projects linked to a broker's profile (spec section 2) --
// joins the same public-safe projects_public_meta view used everywhere
// else on the guest-facing site, never the RLS-protected full projects
// table, so a guest browsing a broker's profile never sees more of a
// project than they would on the project's own page.
export async function getBrokerProjectLinksPublic(brokerId: string) {
  const supabase = await createClient();
  const { data: links, error } = await supabase
    .from("broker_project_links")
    .select("id, project_id, created_at")
    .eq("broker_id", brokerId)
    .order("created_at", { ascending: false });
  if (error) return [];
  if (!links || links.length === 0) return [];

  const { data: previews } = await supabase
    .from("projects_public_meta")
    .select("*")
    .in("id", links.map((l) => l.project_id));

  const previewMap = new Map((previews ?? []).map((p: ProjectPreview) => [p.id, p]));
  return links
    .map((l) => ({ linkId: l.id, linkedAt: l.created_at, project: previewMap.get(l.project_id) ?? null }))
    .filter((row): row is { linkId: string; linkedAt: string; project: ProjectPreview } => row.project !== null);
}

// ---------- Broker's own portal (My Listings / My Projects) ----------

export async function getBrokerListingsForOwner(brokerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("broker_listings")
    .select("*, communities(name)")
    .eq("broker_id", brokerId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data ?? [];
}

export async function getBrokerListingForOwner(brokerId: string, listingId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("broker_listings")
    .select("*")
    .eq("broker_id", brokerId)
    .eq("id", listingId)
    .maybeSingle();

  if (error) return null;
  return data;
}

// Team-tier listings from OTHER brokers in the caller's own brokerage
// (patch_142) -- RLS ("broker_listings: team reads teammates") already
// scopes this to the same brokerage_id; the .neq() here just excludes
// the caller's own team-tier rows, which already show on their own "My
// Listings" page, so this is purely "what my teammates have to offer."
// Degrades to [] (not a throw) both pre-migration and for an
// independent broker with no brokerage_id, matching this codebase's
// established "not configured yet, never crash the page" contract.
export async function getTeamListings(brokerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("broker_listings")
    .select("*, communities(name, slug), brokers(full_name, photo_url, slug, brokerages(name))")
    .eq("visibility", "team")
    .neq("broker_id", brokerId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data ?? [];
}

// Team/Presentation/Public-tier listings across every broker in the
// caller's own agency (patch_143) -- 'private' tier stays invisible
// here by design (RLS: "broker_listings: agency reads own agency's"),
// not just filtered out in app code -- there's no way for this query
// to even learn a private listing exists. RLS does the brokerage-
// scoping (same "RLS does the work, query just adds shape" contract as
// getTeamListings above), so this never takes/filters by a brokerage
// id itself -- only an optional broker_id, used to scope to one
// specific broker (the agency's per-broker detail page) instead of
// every broker in the agency (the agency-wide listings page, when
// omitted). Degrades to [] on error, same contract as every sibling
// broker_listings query.
export async function getBrokerListingsForAgency(brokerId?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("broker_listings")
    .select("*, communities(name, slug), brokers(id, full_name, photo_url, slug)")
    .neq("visibility", "private")
    .order("created_at", { ascending: false });
  if (brokerId) query = query.eq("broker_id", brokerId);

  const { data, error } = await query;
  if (error) return [];
  return data ?? [];
}

export async function getBrokerProjectLinksForOwner(brokerId: string) {
  const supabase = await createClient();
  const { data: links, error } = await supabase
    .from("broker_project_links")
    .select("id, project_id, created_at")
    .eq("broker_id", brokerId)
    .order("created_at", { ascending: false });
  if (error) return [];
  if (!links || links.length === 0) return [];

  const { data: previews } = await supabase
    .from("projects_public_meta")
    .select("*")
    .in("id", links.map((l) => l.project_id));

  const previewMap = new Map((previews ?? []).map((p: ProjectPreview) => [p.id, p]));
  return links.map((l) => ({ linkId: l.id, linkedAt: l.created_at, project: previewMap.get(l.project_id) ?? null }));
}

export async function getBrokerProjectEnquiriesForOwner(brokerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("broker_project_enquiries")
    .select("*, projects(name, slug)")
    .eq("broker_id", brokerId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data ?? [];
}

// ---------- Admin ----------

export async function getAllBrokerListingsAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("broker_listings")
    .select("*, brokers(id, full_name), communities(name)")
    .order("created_at", { ascending: false });

  if (error) return [];
  return data ?? [];
}

export async function getAllBrokeragesAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brokerages")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getAllAdPlacementsAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ad_placements")
    .select("*, developers(name), projects(name), communities(name)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getAllCustomRolesAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("custom_roles").select("*").order("created_at", { ascending: false });

  if (error) return [];
  return data ?? [];
}

export async function getAllMarketingCampaignsAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("marketing_campaigns")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return [];
  return data ?? [];
}

export async function getAllLandingPagesAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("landing_pages")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return [];
  return data ?? [];
}

export async function getLandingPageBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("landing_pages")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (error) return null;
  return data;
}

export async function getAdPlacementsForDeveloper(developerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ad_placements")
    .select("*, projects(name)")
    .eq("developer_id", developerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getActiveHomepageBanner() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ad_placements")
    .select("*, developers(name)")
    .eq("placement_type", "homepage_banner")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  return data;
}

export async function getActiveSidebarBanner() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ad_placements")
    .select("*, developers(name)")
    .eq("placement_type", "sidebar_banner")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  return data;
}

export async function getActiveCommunityBanner(communityId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ad_placements")
    .select("*, developers(name)")
    .eq("placement_type", "community_banner")
    .eq("community_id", communityId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  return data;
}

export async function getActiveSponsoredPinProjectIds() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ad_placements")
    .select("project_id")
    .eq("placement_type", "sponsored_pin")
    .eq("status", "active")
    .not("project_id", "is", null);

  return new Set((data ?? []).map((d) => d.project_id as string));
}

export async function getActiveProjectBanner(projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ad_placements")
    .select("*, developers(name)")
    .eq("placement_type", "project_page_banner")
    .eq("project_id", projectId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  return data;
}

export async function getActiveDeveloperBanner(developerId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ad_placements")
    .select("*, developers(name)")
    .eq("placement_type", "developer_page_banner")
    .eq("developer_id", developerId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  return data;
}

// Custom-image equivalent of AD_SLOTS.projectsListingInFeed -- a single
// global placement (not scoped to a project), shown alongside the AdSense
// in-feed unit rather than replacing it, same as how the homepage banner
// and the homepage AdSense unit already run side by side.
export async function getActiveProjectsInFeedBanner() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ad_placements")
    .select("*, developers(name)")
    .eq("placement_type", "projects_infeed_banner")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  return data;
}

// Custom-image equivalent of AD_SLOTS.blogPostInArticle.
export async function getActiveBlogInArticleBanner() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ad_placements")
    .select("*, developers(name)")
    .eq("placement_type", "blog_inarticle_banner")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  return data;
}

export async function getSubscriptionPlans() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("plan_type", "developer")
    .eq("status", "active")
    .order("sort_order");

  if (error) throw error;
  return data ?? [];
}

export async function getBrokerSubscriptionPlans() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("plan_type", "broker")
    .eq("status", "active")
    .order("sort_order");

  if (error) throw error;
  return data ?? [];
}

export async function getSalespersonSubscriptionPlans() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("plan_type", "salesperson")
    .eq("status", "active")
    .order("sort_order");

  if (error) throw error;
  return data ?? [];
}

export async function getBrokerAgencySubscriptionPlans() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("plan_type", "broker_agency")
    .eq("status", "active")
    .order("sort_order");

  if (error) throw error;
  return data ?? [];
}

export async function getBankTransferSettings() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("platform_settings")
    .select("key, value")
    .in("key", [
      "bank_transfer_bank_name",
      "bank_transfer_account_name",
      "bank_transfer_account_number",
      "bank_transfer_iban",
      "bank_transfer_swift",
    ]);

  if (error) throw error;
  const byKey = Object.fromEntries((data ?? []).map((s) => [s.key, s.value]));
  return {
    bankName: byKey.bank_transfer_bank_name ?? "",
    accountName: byKey.bank_transfer_account_name ?? "",
    accountNumber: byKey.bank_transfer_account_number ?? "",
    iban: byKey.bank_transfer_iban ?? "",
    swift: byKey.bank_transfer_swift ?? "",
  };
}

// PostgREST's "table not in schema cache" — thrown until
// patch_39_bank_transfer_payments.sql has been run. Billing/Subscription
// pages must keep working either way, so this degrades to "no submissions"
// instead of taking the whole page down.
const UNDEFINED_TABLE = "PGRST205";

export async function getBankTransfersForDeveloper(developerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscription_bank_transfers")
    .select("*")
    .eq("developer_id", developerId)
    .order("created_at", { ascending: false });

  if (error) {
    if (error.code === UNDEFINED_TABLE) return [];
    throw error;
  }
  return data ?? [];
}

export async function getBankTransfersForBroker(brokerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscription_bank_transfers")
    .select("*")
    .eq("broker_id", brokerId)
    .order("created_at", { ascending: false });

  if (error) {
    if (error.code === UNDEFINED_TABLE) return [];
    throw error;
  }
  return data ?? [];
}

export async function getBankTransfersForSalesperson(salespersonId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscription_bank_transfers")
    .select("*")
    .eq("salesperson_id", salespersonId)
    .order("created_at", { ascending: false });

  if (error) {
    if (error.code === UNDEFINED_TABLE) return [];
    throw error;
  }
  return data ?? [];
}

export async function getBankTransfersForBrokerage(brokerageId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscription_bank_transfers")
    .select("*")
    .eq("brokerage_id", brokerageId)
    .order("created_at", { ascending: false });

  if (error) {
    if (error.code === UNDEFINED_TABLE) return [];
    throw error;
  }
  return data ?? [];
}

export async function getAllBankTransfersAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscription_bank_transfers")
    .select("*, developers(name), brokers(full_name), salespersons(full_name), brokerages(name)")
    .order("created_at", { ascending: false });

  if (error) {
    if (error.code === UNDEFINED_TABLE) return [];
    throw error;
  }
  return data ?? [];
}

export async function getAllSubscriptionPlansAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscription_plans")
    .select("*")
    .order("plan_type")
    .order("sort_order");

  if (error) throw error;
  return data ?? [];
}

// ---------- Broker/Salesperson Referral Program ----------
// Deliberately separate from the unrelated internal-staff referral system
// elsewhere in this file (getStaffReferrals etc., src/lib/referrals.ts).

export async function getBrokerReferralSettings() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("broker_referral_settings").select("*").eq("id", true).single();
  if (error) throw error;
  return data;
}

async function getReferralSummary(accountType: "broker" | "salesperson", accountId: string) {
  const supabase = await createClient();
  const table = accountType === "broker" ? "brokers" : "salespersons";
  const referrerCol = `referrer_${accountType}_id`;

  const { data: account } = await supabase.from(table).select("referral_code, referral_code_status").eq("id", accountId).maybeSingle();
  const { data: settings } = await supabase
    .from("broker_referral_settings")
    .select("program_enabled, discount_enabled, discount_percent")
    .eq("id", true)
    .maybeSingle();
  const { data: wallet } = await supabase
    .from("broker_referral_wallets")
    .select("id, balance_aed, total_earned_aed, total_used_aed, pending_aed")
    .eq(`${accountType}_id`, accountId)
    .maybeSingle();
  const { data: referrals } = await supabase
    .from("broker_referral_signups")
    .select("id, status, referee_account_type, created_at")
    .eq(referrerCol, accountId)
    .order("created_at", { ascending: false });
  const { data: history } = wallet
    ? await supabase
        .from("broker_referral_wallet_transactions")
        .select("*")
        .eq("wallet_id", wallet.id)
        .order("created_at", { ascending: false })
        .limit(50)
    : { data: [] };

  const totalReferrals = referrals?.length ?? 0;
  const successfulReferrals = referrals?.filter((r) => r.status === "completed").length ?? 0;
  const pendingReferrals = referrals?.filter((r) => ["pending_subscription", "paid_awaiting_activation"].includes(r.status)).length ?? 0;

  return {
    referralCode: account?.referral_code ?? null,
    referralCodeStatus: account?.referral_code_status ?? "active",
    discountPercent:
      settings?.program_enabled && settings?.discount_enabled && settings.discount_percent != null
        ? Number(settings.discount_percent)
        : null,
    wallet: wallet ?? { id: null, balance_aed: 0, total_earned_aed: 0, total_used_aed: 0, pending_aed: 0 },
    totalReferrals,
    successfulReferrals,
    pendingReferrals,
    history: history ?? [],
  };
}

export async function getBrokerReferralSummary(brokerId: string) {
  return getReferralSummary("broker", brokerId);
}

export async function getSalespersonReferralSummary(salespersonId: string) {
  return getReferralSummary("salesperson", salespersonId);
}

export async function getWithdrawalRequestsForOwner(accountType: "broker" | "salesperson", accountId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("broker_referral_withdrawal_requests")
    .select("id, amount_aed, bank_name, bank_iban, status, rejection_reason, created_at, reviewed_at")
    .eq(`${accountType}_id`, accountId)
    .order("created_at", { ascending: false });

  if (error) {
    if (error.code === UNDEFINED_TABLE) return [];
    throw error;
  }
  return data ?? [];
}

export async function getAllWithdrawalRequestsAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("broker_referral_withdrawal_requests")
    .select("*, brokers(full_name), salespersons(full_name)")
    .order("created_at", { ascending: false });

  if (error) {
    if (error.code === UNDEFINED_TABLE) return [];
    throw error;
  }
  return data ?? [];
}

// Lean fetch for the Subscription page: just the wallet balance + the bits
// of settings needed to decide whether to show "Pay with Wallet" and a
// referral-discount banner. Separate from getReferralSummary above, which
// also pulls full referral/history lists the Subscription page doesn't need.
export async function getBrokerReferralWalletAndSettings(accountType: "broker" | "salesperson", accountId: string) {
  const supabase = await createClient();
  const [{ data: settings }, { data: wallet }, { data: pendingSignup }, { data: appliedSignup }] = await Promise.all([
    supabase
      .from("broker_referral_settings")
      .select("program_enabled, discount_enabled, discount_percent, discount_eligible_plan_keys, wallet_new_purchase_enabled")
      .eq("id", true)
      .maybeSingle(),
    supabase.from("broker_referral_wallets").select("balance_aed").eq(`${accountType}_id`, accountId).maybeSingle(),
    supabase
      .from("broker_referral_signups")
      .select("id")
      .eq(`referee_${accountType}_id`, accountId)
      .eq("status", "pending_subscription")
      .maybeSingle(),
    // Only one referral signup ever exists per referee (unique index) --
    // this reflects whether a discount was actually applied on this
    // account's subscription, for display on the "Current subscription"
    // card, separate from pendingDiscount above (which drives the
    // pre-checkout "you have a discount available" messaging and clears
    // once a signup is no longer pending_subscription).
    supabase
      .from("broker_referral_signups")
      .select("discount_percent_applied, discount_amount_aed")
      .eq(`referee_${accountType}_id`, accountId)
      .not("discount_percent_applied", "is", null)
      .maybeSingle(),
  ]);

  return {
    walletBalance: Number(wallet?.balance_aed ?? 0),
    walletNewPurchaseEnabled: !!settings?.wallet_new_purchase_enabled,
    pendingDiscount:
      settings?.program_enabled && settings?.discount_enabled && pendingSignup
        ? {
            percent: Number(settings.discount_percent),
            eligiblePlanKeys: (settings.discount_eligible_plan_keys as string[] | null) ?? null,
          }
        : null,
    appliedDiscount:
      appliedSignup?.discount_percent_applied != null
        ? {
            percent: Number(appliedSignup.discount_percent_applied),
            amountAed: appliedSignup.discount_amount_aed != null ? Number(appliedSignup.discount_amount_aed) : null,
          }
        : null,
  };
}

export async function getAdminReferralProgramStats() {
  const supabase = await createClient();

  const { count: totalCodes } = await supabase
    .from("brokers")
    .select("id", { count: "exact", head: true })
    .not("referral_code", "is", null);
  const { count: totalCodesSp } = await supabase
    .from("salespersons")
    .select("id", { count: "exact", head: true })
    .not("referral_code", "is", null);

  const { data: signups } = await supabase
    .from("broker_referral_signups")
    .select("status, discount_amount_aed, cashback_amount_aed, cashback_reversed_at, subscription_amount_aed");
  const successfulReferrals = signups?.filter((s) => s.status === "completed").length ?? 0;
  const pendingReferrals = signups?.filter((s) => ["pending_subscription", "paid_awaiting_activation"].includes(s.status)).length ?? 0;
  const totalDiscountGiven = (signups ?? []).reduce((sum, s) => sum + Number(s.discount_amount_aed ?? 0), 0);
  const totalCashbackPaid = (signups ?? [])
    .filter((s) => s.cashback_amount_aed && !s.cashback_reversed_at)
    .reduce((sum, s) => sum + Number(s.cashback_amount_aed ?? 0), 0);
  const totalReferralRevenue = (signups ?? [])
    .filter((s) => s.status === "completed")
    .reduce((sum, s) => sum + Number(s.subscription_amount_aed ?? 0), 0);
  const conversionRate = signups?.length ? (successfulReferrals / signups.length) * 100 : 0;

  const { data: wallets } = await supabase.from("broker_referral_wallets").select("balance_aed");
  const totalWalletBalances = (wallets ?? []).reduce((sum, w) => sum + Number(w.balance_aed), 0);

  const { data: topReferrerRows } = await supabase
    .from("broker_referral_signups")
    .select("referrer_account_type, referrer_broker_id, referrer_salesperson_id")
    .eq("status", "completed");
  const counts = new Map<string, { accountType: string; accountId: string; count: number }>();
  for (const r of topReferrerRows ?? []) {
    const accountId = r.referrer_account_type === "broker" ? r.referrer_broker_id : r.referrer_salesperson_id;
    if (!accountId) continue;
    const key = `${r.referrer_account_type}:${accountId}`;
    const existing = counts.get(key);
    if (existing) existing.count += 1;
    else counts.set(key, { accountType: r.referrer_account_type, accountId, count: 1 });
  }
  const topReferrerEntries = [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 10);
  const topReferrers = await Promise.all(
    topReferrerEntries.map(async (entry) => {
      const table = entry.accountType === "broker" ? "brokers" : "salespersons";
      const { data } = await supabase.from(table).select("full_name, referral_code").eq("id", entry.accountId).maybeSingle();
      return { ...entry, name: data?.full_name ?? "Unknown", referralCode: data?.referral_code ?? "" };
    })
  );

  return {
    totalReferralCodes: (totalCodes ?? 0) + (totalCodesSp ?? 0),
    successfulReferrals,
    pendingReferrals,
    totalCashbackPaid,
    totalWalletBalances,
    totalDiscountGiven,
    totalReferralRevenue,
    conversionRate,
    topReferrers,
  };
}

// Broker + salesperson plans only, for the "Eligible Subscription Plans"
// checklist on the Referral Program settings page.
export async function getReferralEligiblePlans() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscription_plans")
    .select("key, name, plan_type")
    .in("plan_type", ["broker", "salesperson"])
    .order("plan_type")
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
}

// Combined revenue/payment-method overview across all four account types,
// for the "Payments & Revenue" admin page. Estimated MRR uses each plan's
// real price_aed (not the label text) -- accounts on a plan with no
// price_aed set (e.g. Enterprise/custom pricing) just don't contribute to
// the total rather than guessing a number.
export async function getPaymentsOverviewStats() {
  const supabase = await createClient();

  const [{ data: plans }, { data: brokers }, { data: salespersons }, { data: developers }, { data: brokerages }, { data: bankTransfers }, { data: walletTx }] =
    await Promise.all([
      supabase.from("subscription_plans").select("key, price_aed"),
      supabase.from("brokers").select("plan_key, subscription_status"),
      supabase.from("salespersons").select("plan_key, subscription_status"),
      supabase.from("developers").select("plan_tier, subscription_status"),
      supabase.from("brokerages").select("plan_key, subscription_status"),
      supabase.from("subscription_bank_transfers").select("amount_aed").eq("status", "paid"),
      supabase
        .from("broker_referral_wallet_transactions")
        .select("amount_aed")
        .in("type", ["used_for_renewal", "used_for_new_subscription"]),
    ]);

  const priceByKey = new Map((plans ?? []).map((p) => [p.key, p.price_aed != null ? Number(p.price_aed) : null]));

  let totalActiveSubscriptions = 0;
  let estimatedMrr = 0;
  for (const row of brokers ?? []) {
    if (row.subscription_status !== "active") continue;
    totalActiveSubscriptions += 1;
    estimatedMrr += (row.plan_key && priceByKey.get(row.plan_key)) || 0;
  }
  for (const row of salespersons ?? []) {
    if (row.subscription_status !== "active") continue;
    totalActiveSubscriptions += 1;
    estimatedMrr += (row.plan_key && priceByKey.get(row.plan_key)) || 0;
  }
  for (const row of developers ?? []) {
    if (row.subscription_status !== "active") continue;
    totalActiveSubscriptions += 1;
    estimatedMrr += (row.plan_tier && priceByKey.get(row.plan_tier)) || 0;
  }
  for (const row of brokerages ?? []) {
    if (row.subscription_status !== "active") continue;
    totalActiveSubscriptions += 1;
    estimatedMrr += (row.plan_key && priceByKey.get(row.plan_key)) || 0;
  }

  return {
    totalActiveSubscriptions,
    estimatedMrr,
    totalDevelopers: developers?.length ?? 0,
    totalBrokers: brokers?.length ?? 0,
    totalSalespersons: salespersons?.length ?? 0,
    totalBrokerages: brokerages?.length ?? 0,
    totalBankTransfersApproved: bankTransfers?.length ?? 0,
    totalBankTransferAmount: (bankTransfers ?? []).reduce((sum, t) => sum + Number(t.amount_aed), 0),
    totalWalletPayments: walletTx?.length ?? 0,
    totalWalletPaymentAmount: (walletTx ?? []).reduce((sum, t) => sum + Number(t.amount_aed), 0),
  };
}

export interface PaymentFeedRow {
  id: string;
  date: string; // yyyy-mm-dd
  accountType: "developer" | "broker" | "salesperson" | "broker_agency";
  accountName: string;
  paymentMethod: "stripe" | "bank_transfer" | "wallet" | "network_international";
  plan: string;
  amountAed: number;
}

// Recent cross-account-type payment feed for the /admin/payments page's
// on-page table -- every developer/broker/salesperson/broker-agency
// payment, not developers only. A lighter sibling of
// /api/admin/payments/export (that route paginates Stripe's *entire*
// invoice history for VAT filing; this caps at the most recent ones so
// the page stays fast to load). Stripe invoices don't carry an app-level
// account id, so they're matched to an account by stripe_customer_id,
// same approach as the export route.
export async function getPaymentsFeedAdmin(limit = 100): Promise<PaymentFeedRow[]> {
  const supabase = await createClient();

  const [{ data: plans }, { data: brokers }, { data: salespersons }, { data: developers }, { data: brokerages }, { data: bankTransfers }, { data: walletTx }, { data: networkOrders }] =
    await Promise.all([
      supabase.from("subscription_plans").select("key, price_aed, stripe_price_id, promo_stripe_price_id"),
      supabase.from("brokers").select("id, full_name, stripe_customer_id"),
      supabase.from("salespersons").select("id, full_name, stripe_customer_id"),
      supabase.from("developers").select("id, name, stripe_customer_id"),
      supabase.from("brokerages").select("id, name, stripe_customer_id"),
      supabase
        .from("subscription_bank_transfers")
        .select("id, account_type, broker_id, salesperson_id, developer_id, brokerage_id, plan_key, amount_aed, reviewed_at, created_at")
        .eq("status", "paid")
        .order("created_at", { ascending: false })
        .limit(limit),
      supabase
        .from("broker_referral_wallet_transactions")
        .select("id, plan_key, amount_aed, created_at, broker_referral_wallets(account_type, broker_id, salesperson_id)")
        .in("type", ["used_for_renewal", "used_for_new_subscription"])
        .order("created_at", { ascending: false })
        .limit(limit),
      supabase
        .from("network_international_orders")
        .select("id, account_type, broker_id, salesperson_id, plan_key, amount_aed, paid_at, created_at")
        .eq("status", "paid")
        .order("created_at", { ascending: false })
        .limit(limit),
    ]);

  const planByStripePriceId = new Map<string, string>();
  for (const p of plans ?? []) {
    if (p.stripe_price_id) planByStripePriceId.set(p.stripe_price_id, p.key);
    if (p.promo_stripe_price_id) planByStripePriceId.set(p.promo_stripe_price_id, p.key);
  }

  const accountByCustomerId = new Map<string, { type: PaymentFeedRow["accountType"]; name: string }>();
  for (const b of brokers ?? []) if (b.stripe_customer_id) accountByCustomerId.set(b.stripe_customer_id, { type: "broker", name: b.full_name });
  for (const s of salespersons ?? []) if (s.stripe_customer_id) accountByCustomerId.set(s.stripe_customer_id, { type: "salesperson", name: s.full_name });
  for (const d of developers ?? []) if (d.stripe_customer_id) accountByCustomerId.set(d.stripe_customer_id, { type: "developer", name: d.name });
  for (const a of brokerages ?? []) if (a.stripe_customer_id) accountByCustomerId.set(a.stripe_customer_id, { type: "broker_agency", name: a.name });

  const brokerById = new Map((brokers ?? []).map((b) => [b.id, b.full_name]));
  const salespersonById = new Map((salespersons ?? []).map((s) => [s.id, s.full_name]));
  const developerById = new Map((developers ?? []).map((d) => [d.id, d.name]));
  const brokerageById = new Map((brokerages ?? []).map((a) => [a.id, a.name]));

  const rows: PaymentFeedRow[] = [];

  // ---------- Stripe invoices (most recent, live) ----------
  try {
    const stripe = getStripe();
    const page = await stripe.invoices.list({ status: "paid", limit });
    for (const inv of page.data) {
      const customerId = typeof inv.customer === "string" ? inv.customer : inv.customer?.id;
      const account = customerId ? accountByCustomerId.get(customerId) : undefined;
      if (!account) continue; // not a subscription customer of ours (e.g. a stray/test Stripe customer)
      const priceRef = inv.lines.data[0]?.pricing?.price_details?.price;
      const priceId = typeof priceRef === "string" ? priceRef : priceRef?.id;
      rows.push({
        id: `stripe-${inv.id}`,
        date: new Date(inv.created * 1000).toISOString().slice(0, 10),
        accountType: account.type,
        accountName: account.name,
        paymentMethod: "stripe",
        plan: (priceId && planByStripePriceId.get(priceId)) ?? "",
        amountAed: (inv.total ?? 0) / 100,
      });
    }
  } catch {
    // STRIPE_SECRET_KEY not configured, or Stripe unreachable -- the feed
    // still shows bank transfer + wallet rows rather than failing.
  }

  // ---------- Bank transfers (approved) ----------
  for (const bt of bankTransfers ?? []) {
    const accountName =
      bt.account_type === "broker"
        ? brokerById.get(bt.broker_id ?? "")
        : bt.account_type === "salesperson"
          ? salespersonById.get(bt.salesperson_id ?? "")
          : bt.account_type === "developer"
            ? developerById.get(bt.developer_id ?? "")
            : brokerageById.get(bt.brokerage_id ?? "");
    rows.push({
      id: `bank-${bt.id}`,
      date: (bt.reviewed_at ?? bt.created_at).slice(0, 10),
      accountType: bt.account_type as PaymentFeedRow["accountType"],
      accountName: accountName ?? "(unknown account)",
      paymentMethod: "bank_transfer",
      plan: bt.plan_key,
      amountAed: Number(bt.amount_aed),
    });
  }

  // ---------- Referral Wallet payments (renewal / new subscription) ----------
  for (const tx of walletTx ?? []) {
    const wallet = Array.isArray(tx.broker_referral_wallets) ? tx.broker_referral_wallets[0] : tx.broker_referral_wallets;
    const accountName =
      wallet?.account_type === "broker" ? brokerById.get(wallet.broker_id ?? "") : salespersonById.get(wallet?.salesperson_id ?? "");
    rows.push({
      id: `wallet-${tx.id}`,
      date: tx.created_at.slice(0, 10),
      accountType: (wallet?.account_type as PaymentFeedRow["accountType"]) ?? "broker",
      accountName: accountName ?? "(unknown account)",
      paymentMethod: "wallet",
      plan: tx.plan_key ?? "",
      amountAed: Number(tx.amount_aed),
    });
  }

  // ---------- Network International orders (broker + salesperson) ----------
  for (const order of networkOrders ?? []) {
    const accountName =
      order.account_type === "broker" ? brokerById.get(order.broker_id ?? "") : salespersonById.get(order.salesperson_id ?? "");
    rows.push({
      id: `ni-${order.id}`,
      date: (order.paid_at ?? order.created_at).slice(0, 10),
      accountType: order.account_type as PaymentFeedRow["accountType"],
      accountName: accountName ?? "(unknown account)",
      paymentMethod: "network_international",
      plan: order.plan_key,
      amountAed: Number(order.amount_aed),
    });
  }

  rows.sort((a, b) => b.date.localeCompare(a.date));
  return rows.slice(0, limit);
}

function monthKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

// Real month-by-month revenue only where a timestamped payment ledger
// exists (broker/agency Stripe payments, approved bank transfers) --
// salesperson subscriptions (webhook updates subscription_status
// directly, no payment row) and developer flat fees (ad_placement /
// project_featured checkouts write no payment row either) have no
// historical ledger, so they're only reflected in the current-state
// totals from getPaymentsOverviewStats, not this trend. Stated in the
// UI rather than fabricated.
export async function getRevenueReportAdmin() {
  const supabase = await createClient();
  const [{ data: brokerPayments }, { data: agencyPayments }, { data: bankTransfers }, overview] = await Promise.all([
    supabase.from("broker_payments").select("amount, paid_at").eq("status", "paid").not("paid_at", "is", null),
    supabase.from("broker_agency_payments").select("amount, paid_at").eq("status", "paid").not("paid_at", "is", null),
    supabase.from("subscription_bank_transfers").select("amount_aed, reviewed_at").eq("status", "paid").not("reviewed_at", "is", null),
    getPaymentsOverviewStats(),
  ]);

  const byMonth = new Map<string, number>();
  for (const p of brokerPayments ?? []) {
    const key = monthKey(p.paid_at!);
    byMonth.set(key, (byMonth.get(key) ?? 0) + Number(p.amount));
  }
  for (const p of agencyPayments ?? []) {
    const key = monthKey(p.paid_at!);
    byMonth.set(key, (byMonth.get(key) ?? 0) + Number(p.amount));
  }
  for (const t of bankTransfers ?? []) {
    const key = monthKey(t.reviewed_at!);
    byMonth.set(key, (byMonth.get(key) ?? 0) + Number(t.amount_aed));
  }

  const revenueTrend = Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, amount]) => ({ date: monthLabel(key), amount: Math.round(amount) }));

  return { revenueTrend, overview };
}

export async function getSubscriptionReportAdmin() {
  const supabase = await createClient();
  const [{ data: brokers }, { data: salespersons }, { data: developers }, { data: brokerages }] = await Promise.all([
    supabase.from("brokers").select("plan_key, subscription_status"),
    supabase.from("salespersons").select("plan_key, subscription_status"),
    supabase.from("developers").select("plan_tier, subscription_status"),
    supabase.from("brokerages").select("plan_key, subscription_status"),
  ]);

  function statusCounts(rows: { subscription_status: string | null }[] | null) {
    const counts = new Map<string, number>();
    for (const r of rows ?? []) {
      const status = r.subscription_status ?? "none";
      counts.set(status, (counts.get(status) ?? 0) + 1);
    }
    return Object.fromEntries(counts);
  }

  return {
    broker: { total: brokers?.length ?? 0, byStatus: statusCounts(brokers) },
    salesperson: { total: salespersons?.length ?? 0, byStatus: statusCounts(salespersons) },
    developer: { total: developers?.length ?? 0, byStatus: statusCounts(developers) },
    brokerage: { total: brokerages?.length ?? 0, byStatus: statusCounts(brokerages) },
  };
}

// unit_reservations.status = 'signed' is the real closing/sale record in
// this schema (see patch_104) -- price_aed and signed_at give a genuine
// deal-value trend, unlike property_requests' 'closed_won' status which
// carries no captured transaction value.
export async function getSalesReportAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("unit_reservations")
    .select("id, price_aed, signed_at, projects(name), crm_clients(full_name, broker_id, salesperson_id, developer_id)")
    .eq("status", "signed")
    .order("signed_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

// Ranked, platform-wide broker performance -- client count (crm_clients),
// leads handled (property_requests.broker_id), and signed deals/value
// (via crm_clients, since unit_reservations carries no broker_id of its
// own). getAgencyAnalyticsAdmin rolls this same data up by brokerage_id
// rather than re-querying it.
export async function getBrokerAnalyticsAdmin() {
  const supabase = await createClient();
  const [brokers, { data: clients }, { data: requests }, { data: reservations }] = await Promise.all([
    getAllBrokersAdmin(),
    supabase.from("crm_clients").select("broker_id").not("broker_id", "is", null),
    supabase.from("property_requests").select("broker_id"),
    supabase
      .from("unit_reservations")
      .select("price_aed, crm_clients!inner(broker_id)")
      .eq("status", "signed")
      .not("crm_clients.broker_id", "is", null),
  ]);

  const clientCounts = new Map<string, number>();
  for (const c of clients ?? []) clientCounts.set(c.broker_id, (clientCounts.get(c.broker_id) ?? 0) + 1);

  const leadCounts = new Map<string, number>();
  for (const r of requests ?? []) leadCounts.set(r.broker_id, (leadCounts.get(r.broker_id) ?? 0) + 1);

  const salesStats = new Map<string, { count: number; value: number }>();
  for (const r of reservations ?? []) {
    const client = Array.isArray(r.crm_clients) ? r.crm_clients[0] : r.crm_clients;
    const brokerId = client?.broker_id;
    if (!brokerId) continue;
    const entry = salesStats.get(brokerId) ?? { count: 0, value: 0 };
    entry.count += 1;
    entry.value += Number(r.price_aed);
    salesStats.set(brokerId, entry);
  }

  return brokers
    .map((b) => ({
      id: b.id,
      full_name: b.full_name,
      brokerage_id: b.brokerage_id,
      brokerageName: (Array.isArray(b.brokerages) ? b.brokerages[0] : b.brokerages)?.name ?? null,
      clientCount: clientCounts.get(b.id) ?? 0,
      leadCount: leadCounts.get(b.id) ?? 0,
      salesCount: salesStats.get(b.id)?.count ?? 0,
      salesValue: salesStats.get(b.id)?.value ?? 0,
    }))
    .sort((a, b) => b.salesValue - a.salesValue);
}

export async function getAgencyAnalyticsAdmin() {
  const [brokerages, brokerStats] = await Promise.all([getAllBrokeragesAdmin(), getBrokerAnalyticsAdmin()]);

  return brokerages
    .map((agency) => {
      const ownBrokers = brokerStats.filter((b) => b.brokerage_id === agency.id);
      return {
        id: agency.id,
        name: agency.name,
        brokerCount: ownBrokers.length,
        clientCount: ownBrokers.reduce((sum, b) => sum + b.clientCount, 0),
        leadCount: ownBrokers.reduce((sum, b) => sum + b.leadCount, 0),
        salesCount: ownBrokers.reduce((sum, b) => sum + b.salesCount, 0),
        salesValue: ownBrokers.reduce((sum, b) => sum + b.salesValue, 0),
      };
    })
    .sort((a, b) => b.salesValue - a.salesValue);
}

// login_history (patch_101) already logs every successful login --
// never surfaced as a report before now. profiles.created_at gives a
// real signup trend alongside it.
export async function getUserActivityReportAdmin() {
  const supabase = await createClient();
  const [{ data: logins }, { data: profileRows }] = await Promise.all([
    supabase.from("login_history").select("email, created_at").eq("success", true).order("created_at", { ascending: false }),
    supabase.from("profiles").select("created_at"),
  ]);

  const loginsByMonth = new Map<string, number>();
  const loginsByUser = new Map<string, number>();
  for (const l of logins ?? []) {
    const key = monthKey(l.created_at);
    loginsByMonth.set(key, (loginsByMonth.get(key) ?? 0) + 1);
    loginsByUser.set(l.email, (loginsByUser.get(l.email) ?? 0) + 1);
  }

  const signupsByMonth = new Map<string, number>();
  for (const p of profileRows ?? []) {
    const key = monthKey(p.created_at);
    signupsByMonth.set(key, (signupsByMonth.get(key) ?? 0) + 1);
  }

  return {
    loginsTrend: Array.from(loginsByMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, count]) => ({ date: monthLabel(key), logins: count })),
    signupsTrend: Array.from(signupsByMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, count]) => ({ date: monthLabel(key), signups: count })),
    topUsers: Array.from(loginsByUser.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([email, count]) => ({ email, count })),
  };
}

const sourceLabel: Record<string, string> = {
  projects_list: "Projects List",
  map: "Map",
  communities: "Communities",
  global_header: "Global Header",
};

export async function getSearchAnalyticsAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("search_log")
    .select("query, source, result_count, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = data ?? [];

  const topQueries = new Map<string, number>();
  for (const r of rows) {
    const key = r.query.toLowerCase();
    topQueries.set(key, (topQueries.get(key) ?? 0) + 1);
  }

  const bySource = new Map<string, number>();
  for (const r of rows) bySource.set(r.source, (bySource.get(r.source) ?? 0) + 1);

  const byMonth = new Map<string, number>();
  for (const r of rows) {
    const key = monthKey(r.created_at);
    byMonth.set(key, (byMonth.get(key) ?? 0) + 1);
  }

  return {
    totalSearches: rows.length,
    zeroResultSearches: rows.filter((r) => r.result_count === 0).length,
    topQueries: Array.from(topQueries.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([query, count]) => ({ query, count })),
    bySource: Array.from(bySource.entries()).map(([source, value]) => ({
      name: sourceLabel[source] ?? source,
      value,
    })),
    searchesTrend: Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, count]) => ({ date: monthLabel(key), searches: count })),
  };
}

export async function getAiUsageReportAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ai_usage_log")
    .select("kind, model, input_tokens, output_tokens, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = data ?? [];

  const byKind = new Map<string, { calls: number; inputTokens: number; outputTokens: number }>();
  for (const r of rows) {
    const entry = byKind.get(r.kind) ?? { calls: 0, inputTokens: 0, outputTokens: 0 };
    entry.calls += 1;
    entry.inputTokens += r.input_tokens;
    entry.outputTokens += r.output_tokens;
    byKind.set(r.kind, entry);
  }

  const byMonth = new Map<string, number>();
  for (const r of rows) {
    const key = monthKey(r.created_at);
    byMonth.set(key, (byMonth.get(key) ?? 0) + r.input_tokens + r.output_tokens);
  }

  return {
    totalCalls: rows.length,
    totalInputTokens: rows.reduce((sum, r) => sum + r.input_tokens, 0),
    totalOutputTokens: rows.reduce((sum, r) => sum + r.output_tokens, 0),
    byKind: Array.from(byKind.entries()).map(([kind, stats]) => ({ kind, ...stats })),
    usageTrend: Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, tokens]) => ({ date: monthLabel(key), tokens })),
  };
}

// Chains every real funnel stage already captured somewhere in this
// schema -- no new tracking, pure aggregation, mirroring the Sales/
// Revenue Reports' pattern from the BI Reports batch. projects.views is
// a plain counter with no timestamp (patch_17), so it's reported as a
// current total only, never a fabricated trend.
export async function getConversionFunnelAdmin() {
  const supabase = await createClient();
  const [
    { data: projectViews },
    { data: events },
    { data: leadRows },
    { data: requestRows },
    { data: bookingRows },
    { data: reservationRows },
  ] = await Promise.all([
    supabase.from("projects").select("views"),
    supabase.from("project_events").select("event_type, created_at").eq("event_type", "click"),
    supabase.from("leads").select("created_at"),
    supabase.from("property_requests").select("created_at"),
    supabase.from("bookings").select("created_at"),
    supabase.from("unit_reservations").select("price_aed, signed_at").eq("status", "signed"),
  ]);

  const totalViews = (projectViews ?? []).reduce((sum, p) => sum + (p.views ?? 0), 0);

  const signedByMonth = new Map<string, { count: number; value: number }>();
  for (const r of reservationRows ?? []) {
    if (!r.signed_at) continue;
    const key = monthKey(r.signed_at);
    const entry = signedByMonth.get(key) ?? { count: 0, value: 0 };
    entry.count += 1;
    entry.value += Number(r.price_aed);
    signedByMonth.set(key, entry);
  }

  return {
    totalViews,
    totalClicks: events?.length ?? 0,
    totalLeads: (leadRows?.length ?? 0) + (requestRows?.length ?? 0),
    totalBookings: bookingRows?.length ?? 0,
    totalSignedDeals: reservationRows?.length ?? 0,
    totalSignedValue: (reservationRows ?? []).reduce((sum, r) => sum + Number(r.price_aed), 0),
    signedDealsTrend: Array.from(signedByMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, v]) => ({ date: monthLabel(key), value: Math.round(v.value), count: v.count })),
  };
}

export async function getAdPlacementPerformanceAdmin() {
  const supabase = await createClient();
  const [placements, { data: clickRows }] = await Promise.all([
    getAllAdPlacementsAdmin(),
    supabase.from("ad_placement_events").select("placement_id").eq("event_type", "click"),
  ]);

  const clickCounts = new Map<string, number>();
  for (const c of clickRows ?? []) {
    clickCounts.set(c.placement_id, (clickCounts.get(c.placement_id) ?? 0) + 1);
  }

  return placements
    .map((p) => ({
      id: p.id,
      title: p.title,
      placementType: p.placement_type,
      status: p.status,
      clicks: clickCounts.get(p.id) ?? 0,
    }))
    .sort((a, b) => b.clicks - a.clicks);
}

// Real geographic engagement density -- weight is projects.views, no
// invented figure. Feeds a Mapbox heatmap layer, not a fabricated
// "hot area" claim.
export async function getProjectEngagementPointsAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, lat, lng, views")
    .not("lat", "is", null)
    .not("lng", "is", null)
    .in("status", ["published", "featured"]);

  if (error) throw error;
  return (data ?? []).map((p) => ({ id: p.id, name: p.name, lat: p.lat!, lng: p.lng!, weight: p.views }));
}

export async function getPlanSubscriberCounts() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("developers").select("plan_tier");

  if (error) throw error;
  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    counts.set(row.plan_tier, (counts.get(row.plan_tier) ?? 0) + 1);
  }
  return counts;
}

export async function getBrokerPlanSubscriberCounts() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("brokers").select("plan_key").not("plan_key", "is", null);

  if (error) throw error;
  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    if (!row.plan_key) continue;
    counts.set(row.plan_key, (counts.get(row.plan_key) ?? 0) + 1);
  }
  return counts;
}

export async function getSalespersonPlanSubscriberCounts() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("salespersons").select("plan_key").not("plan_key", "is", null);

  if (error) throw error;
  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    if (!row.plan_key) continue;
    counts.set(row.plan_key, (counts.get(row.plan_key) ?? 0) + 1);
  }
  return counts;
}

export async function getPublishedBlogPosts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getBlogPostBySlug(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  return data;
}

export async function getAllBlogPostsAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getProjectMediaFiles(
  projectId: string,
  folder: "gallery" | "documents"
) {
  const supabase = await createClient();
  const path = `${projectId}/${folder}`;
  const { data, error } = await supabase.storage.from("project-media").list(path);

  if (error || !data) return [];

  // Folders (e.g. the Exterior/Interior category subfolders under gallery)
  // are listed alongside files with id === null -- exclude them so they
  // don't render as broken "images".
  return data
    .filter((f) => f.name !== ".emptyFolderPlaceholder" && f.id !== null)
    .map((f) => ({
      name: f.name.replace(/^\d+-/, ""),
      url: supabase.storage.from("project-media").getPublicUrl(`${path}/${f.name}`)
        .data.publicUrl,
      isImage: /\.(png|jpe?g|webp|gif|avif)$/i.test(f.name),
      isVideo: /\.(mp4|webm|mov)$/i.test(f.name),
    }));
}

export async function getProjectGallerySections(projectId: string) {
  const supabase = await createClient();

  async function listCategory(category: string) {
    const path = `${projectId}/gallery/${gallerySlug(category)}`;
    const { data } = await supabase.storage.from("project-media").list(path);
    return (data ?? [])
      .filter((f) => f.name !== ".emptyFolderPlaceholder" && f.id !== null)
      .map((f) => ({
        name: f.name.replace(/^\d+-/, ""),
        url: supabase.storage.from("project-media").getPublicUrl(`${path}/${f.name}`)
          .data.publicUrl,
        isImage: /\.(png|jpe?g|webp|gif|avif)$/i.test(f.name),
      }));
  }

  const [exterior, interior] = await Promise.all([
    Promise.all(
      exteriorGalleryCategories.map(async (category) => ({
        category,
        files: await listCategory(category),
      }))
    ),
    Promise.all(
      interiorGalleryCategories.map(async (category) => ({
        category,
        files: await listCategory(category),
      }))
    ),
  ]);

  return {
    exterior: exterior.filter((s) => s.files.length > 0),
    interior: interior.filter((s) => s.files.length > 0),
  };
}

export async function getBrochureDownloadsForDeveloper(developerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brochure_downloads")
    .select("*, projects!inner(developer_id)")
    .eq("projects.developer_id", developerId);

  if (error) throw error;
  return data ?? [];
}

export async function getProjectEventsForDeveloper(developerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_events")
    .select("event_type, projects!inner(developer_id)")
    .eq("projects.developer_id", developerId);

  if (error) throw error;
  return data ?? [];
}

export async function incrementProjectViews(projectId: string) {
  const supabase = await createClient();
  await supabase.rpc("increment_project_views", { p_id: projectId });
}

export async function getConstructionMilestones(projectId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("construction_milestones")
    .select("*")
    .eq("project_id", projectId)
    .order("milestone_date", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getAllUpcomingProjectsAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("upcoming_projects")
    .select("*, developers(name, slug, logo_url)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getUpcomingProjectsForDeveloper(developerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("upcoming_projects")
    .select("*")
    .eq("developer_id", developerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

// Broker interest enquiries against any of this developer's "Coming Soon"
// pins (patch_131) -- the collection view for /dashboard/upcoming-projects.
// Returns [] rather than throwing pre-migration (this table is new and
// won't exist until the handed-off patch is run), matching this table's
// own graceful-degradation contract rather than the older sibling
// functions above, which can safely throw since upcoming_projects has
// existed since patch_80.
export async function getUpcomingProjectInterestsForDeveloper(developerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("upcoming_project_interests")
    .select("*, upcoming_projects!inner(internal_name, developer_id), brokers(full_name, slug)")
    .eq("upcoming_projects.developer_id", developerId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data ?? [];
}

export async function getActiveUpcomingProjectsForDeveloper(developerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("upcoming_projects")
    .select("*")
    .eq("developer_id", developerId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

// Public-safe: never exposes internal_name or developer_id -- see
// upcoming_projects_public in patch_80 for why this is safe to call
// unauthenticated.
export async function getUpcomingProjectsPublic() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("upcoming_projects_public").select("*");

  if (error) throw error;
  return data ?? [];
}

export async function getProjectUnitTypes(projectId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_unit_types")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

// One bulk select + in-JS Map-based reduce, matching this file's
// established aggregate-count pattern (see devCounts/tagCounts above) --
// not a per-unit-type query. Unit types with no project_units rows at
// all (inventory not configured) simply have no entry, so the caller's
// existing manually-set availability badge stays the only signal shown.
// Fails soft (empty object) rather than throwing -- this is purely
// additive display data on the public project page, so a transient
// error (or patch_105 not yet applied on a given environment) should
// never take down the whole page, unlike the required data this file's
// other queries throw on.
export async function getProjectUnitAvailability(projectId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_units")
    .select("unit_type_id, status")
    .eq("project_id", projectId);

  if (error) return {};

  const counts = new Map<string, { available: number; total: number }>();
  for (const row of data ?? []) {
    const entry = counts.get(row.unit_type_id) ?? { available: 0, total: 0 };
    entry.total += 1;
    if (row.status === "available") entry.available += 1;
    counts.set(row.unit_type_id, entry);
  }
  return Object.fromEntries(counts);
}

export async function getUnitTypeFloorPlans(projectId: string, unitTypeId: string) {
  const supabase = await createClient();
  const path = `${projectId}/floor-plans/${unitTypeId}`;
  const { data, error } = await supabase.storage.from("project-media").list(path);

  if (error || !data) return [];

  return data
    .filter((f) => f.name !== ".emptyFolderPlaceholder")
    .map((f) => ({
      name: f.name.replace(/^\d+-/, ""),
      url: supabase.storage.from("project-media").getPublicUrl(`${path}/${f.name}`)
        .data.publicUrl,
    }));
}

export async function getProjectDocumentsByCategory(projectId: string) {
  const supabase = await createClient();
  const results: { category: string; name: string; url: string }[] = [];

  for (const category of documentCategories) {
    const path = `${projectId}/documents/${categorySlug(category)}`;
    const { data } = await supabase.storage.from("project-media").list(path);
    for (const f of data ?? []) {
      if (f.name === ".emptyFolderPlaceholder") continue;
      results.push({
        category,
        name: f.name.replace(/^\d+-/, ""),
        url: supabase.storage.from("project-media").getPublicUrl(`${path}/${f.name}`)
          .data.publicUrl,
      });
    }
  }

  return results;
}

export async function getDeveloperAwards(developerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("developer_awards")
    .select("*")
    .eq("developer_id", developerId)
    .order("year", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getDeveloperReviews(developerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("developer_reviews")
    .select("*")
    .eq("developer_id", developerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getPropertyTypes() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("property_types")
    .select("*")
    .order("sort_order");

  if (error) throw error;
  return data ?? [];
}

export async function getAmenitiesList() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("amenities")
    .select("*")
    .order("sort_order");

  if (error) throw error;
  return data ?? [];
}

export async function getAllBookingsAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*, projects(name, developer_id)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getAllProjectEventsAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("project_events").select("event_type, project_id");

  if (error) throw error;
  return data ?? [];
}

export async function getAllBrochureDownloadsAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brochure_downloads")
    .select("id, project_id, projects(name)");

  if (error) throw error;
  return data ?? [];
}

export async function getAllUsersAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_list_users");

  if (error) throw error;
  return data ?? [];
}

export async function getInvitationsAdmin(kind?: string | string[]) {
  const supabase = await createClient();
  let query = supabase.from("invitations").select("*, developers(name)").order("created_at", { ascending: false });
  if (Array.isArray(kind)) query = query.in("kind", kind);
  else if (kind) query = query.eq("kind", kind);
  const { data, error } = await query;

  if (error) {
    if (error.code === UNDEFINED_TABLE) return [];
    throw error;
  }
  return data ?? [];
}

export async function getAuditLog(limit = 200) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function getRedirects() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("redirects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getNavLinks(location: "header" | "footer") {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("nav_links")
    .select("*")
    .eq("location", location)
    .order("sort_order");

  if (error) throw error;
  return data ?? [];
}

export async function getSalespersonsForDeveloper(developerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("salespersons")
    .select("*, invitations(status)")
    .eq("developer_id", developerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getAllStaffAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("staff").select("*").order("created_at", { ascending: false });

  if (error) {
    if (error.code === UNDEFINED_TABLE) return [];
    throw error;
  }
  return data ?? [];
}

// Self-service equivalent of getStaffByIdAdmin, scoped to the signed-in
// staff member's own id via RLS (staff:self reads own on every staff_*
// table) rather than an admin-only query.
export async function getStaffSelfData() {
  const profile = await requireStaffProfile();
  const supabase = await createClient();

  const [{ data: staff }, { data: referrals }, { data: commissions }, { data: targets }] = await Promise.all([
    supabase.from("staff").select("*").eq("id", profile.staff_id).single(),
    supabase
      .from("staff_referrals")
      .select(
        "*, developers(name, subscription_status), brokers(full_name, subscription_status), salespersons(full_name, subscription_status)"
      )
      .eq("staff_id", profile.staff_id)
      .order("created_at", { ascending: false }),
    supabase.from("staff_commissions").select("*").eq("staff_id", profile.staff_id).order("created_at", { ascending: false }),
    supabase
      .from("staff_monthly_targets")
      .select("*")
      .eq("staff_id", profile.staff_id)
      .order("year", { ascending: false })
      .order("month", { ascending: false }),
  ]);

  return {
    staff,
    referrals: referrals ?? [],
    commissions: commissions ?? [],
    targets: targets ?? [],
  };
}

export async function getStaffPerformanceAdmin(fromISO: string, toISO: string) {
  const supabase = await createClient();

  const [{ data: staffRows }, { data: commissions }, { data: referrals }] = await Promise.all([
    supabase.from("staff").select("*").order("full_name"),
    supabase.from("staff_commissions").select("*").gte("created_at", fromISO).lte("created_at", toISO),
    supabase
      .from("staff_referrals")
      .select(
        "id, staff_id, account_type, first_subscribed_at, developer_id, broker_id, salesperson_id, developers(subscription_status), brokers(subscription_status), salespersons(subscription_status)"
      ),
  ]);

  const staff = staffRows ?? [];
  const allCommissions = commissions ?? [];
  const allReferrals = referrals ?? [];

  return staff.map((s) => {
    const staffCommissions = allCommissions.filter((c) => c.staff_id === s.id);
    const staffReferrals = allReferrals.filter((r) => r.staff_id === s.id);
    const newSubsInRange = staffReferrals.filter((r) => {
      const d = new Date(r.first_subscribed_at).getTime();
      return d >= new Date(fromISO).getTime() && d <= new Date(toISO).getTime();
    }).length;
    const renewals = Math.max(staffCommissions.length - newSubsInRange, 0);
    const revenue = staffCommissions.reduce((sum, c) => sum + Number(c.subscription_amount), 0);
    const commissionEarned = staffCommissions.reduce((sum, c) => sum + Number(c.commission_amount), 0);
    const pending = staffCommissions.filter((c) => c.status === "pending").reduce((sum, c) => sum + Number(c.commission_amount), 0);
    const approved = staffCommissions.filter((c) => c.status === "approved").reduce((sum, c) => sum + Number(c.commission_amount), 0);
    const paid = staffCommissions.filter((c) => c.status === "paid").reduce((sum, c) => sum + Number(c.commission_amount), 0);

    const statusOf = (r: (typeof staffReferrals)[number]) => {
      const account = r.developers ?? r.brokers ?? r.salespersons;
      const row = Array.isArray(account) ? account[0] : account;
      return (row as { subscription_status?: string } | undefined)?.subscription_status;
    };
    const activeSubscribers = staffReferrals.filter((r) => statusOf(r) === "active").length;
    const expiredSubscribers = staffReferrals.filter((r) => statusOf(r) === "expired").length;

    const target = s.new_subscription_target || 0;
    const achieved = newSubsInRange;
    const remaining = Math.max(target - achieved, 0);
    const targetPct = target > 0 ? Math.round((achieved / target) * 100) : 0;

    return {
      staff: s,
      target,
      achieved,
      remaining,
      targetPct,
      newSubscriptions: newSubsInRange,
      renewals,
      activeSubscribers,
      expiredSubscribers,
      revenue,
      commissionEarned,
      pending,
      approved,
      paid,
    };
  });
}

export async function getStaffSharedLinks() {
  const profile = await requireStaffProfile();
  const supabase = await createClient();

  const { data: links } = await supabase
    .from("staff_shared_links")
    .select("id, target_type, target_id, share_code, created_at")
    .eq("staff_id", profile.staff_id)
    .order("created_at", { ascending: false });
  if (!links || links.length === 0) return [];

  const [{ data: clicks }, { data: projects }, { data: developers }] = await Promise.all([
    supabase.from("staff_link_clicks").select("shared_link_id").in("shared_link_id", links.map((l) => l.id)),
    supabase
      .from("projects")
      .select("id, name, slug")
      .in(
        "id",
        links.filter((l) => l.target_type === "project").map((l) => l.target_id)
      ),
    supabase
      .from("developers")
      .select("id, name, slug")
      .in(
        "id",
        links.filter((l) => l.target_type === "developer").map((l) => l.target_id)
      ),
  ]);

  return links.map((link) => {
    const clickCount = (clicks ?? []).filter((c) => c.shared_link_id === link.id).length;
    const target =
      link.target_type === "project"
        ? projects?.find((p) => p.id === link.target_id)
        : developers?.find((d) => d.id === link.target_id);
    return { ...link, clickCount, targetName: target?.name ?? "—" };
  });
}

export async function getStaffByIdAdmin(id: string) {
  const supabase = await createClient();
  const { data: staff, error } = await supabase.from("staff").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!staff) return null;

  const [{ data: referrals }, { data: commissions }, { data: targets }] = await Promise.all([
    supabase
      .from("staff_referrals")
      .select("*, developers(name), brokers(full_name), salespersons(full_name)")
      .eq("staff_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("staff_commissions").select("*").eq("staff_id", id).order("created_at", { ascending: false }),
    supabase
      .from("staff_monthly_targets")
      .select("*")
      .eq("staff_id", id)
      .order("year", { ascending: false })
      .order("month", { ascending: false }),
  ]);

  return {
    staff,
    referrals: referrals ?? [],
    commissions: commissions ?? [],
    targets: targets ?? [],
  };
}

export async function getAllSalespersonsAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("salespersons")
    .select("*, developers(name), invitations(status)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getAllPropertyRequestsAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("property_requests")
    .select("*, brokers(full_name), salespersons(full_name), developers(name), projects(name)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getAllEmailLogsAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("email_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw error;
  return data ?? [];
}

export async function getAllBrokerPaymentsAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("broker_payments")
    .select("*, brokers(full_name, email)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getAllBrokerAgencyPaymentsAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("broker_agency_payments")
    .select("*, brokerages(name, company_email)")
    .order("created_at", { ascending: false });

  if (error) {
    if (error.code === UNDEFINED_TABLE) return [];
    throw error;
  }
  return data ?? [];
}

export async function getSubscriptionGrantsAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscription_grants")
    .select("*, developers(name), brokers(full_name), salespersons(full_name), brokerages(name)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getActiveSalespersonsForDeveloper(developerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("salespersons")
    .select("id, full_name, job_title, photo_url")
    .eq("developer_id", developerId)
    .eq("status", "active")
    .order("full_name");

  if (error) throw error;
  return data ?? [];
}

export async function getRememberedSalesperson(brokerId: string, developerId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("broker_salesperson_relationships")
    .select("salesperson_id")
    .eq("broker_id", brokerId)
    .eq("developer_id", developerId)
    .maybeSingle();

  return data?.salesperson_id ?? null;
}
