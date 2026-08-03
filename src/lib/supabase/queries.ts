import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { categorySlug, documentCategories } from "@/lib/documentCategories";
import { exteriorGalleryCategories, gallerySlug, interiorGalleryCategories } from "@/lib/galleryCategories";
import type { ProjectWithRelations } from "@/types/database";

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

async function getAppointments(ownerColumn: "broker_id" | "salesperson_id" | "developer_id", ownerId: string) {
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

async function getCollections(ownerColumn: "broker_id" | "salesperson_id" | "developer_id", ownerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crm_collections")
    .select("*, crm_clients(full_name), crm_collection_items(count)")
    .eq(ownerColumn, ownerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
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

async function getCrmClientDetail(ownerColumn: "broker_id" | "salesperson_id" | "developer_id", ownerId: string, clientId: string) {
  const supabase = await createClient();
  const { data: client, error } = await supabase
    .from("crm_clients")
    .select("*")
    .eq("id", clientId)
    .eq(ownerColumn, ownerId)
    .maybeSingle();
  if (error) throw error;
  if (!client) return null;

  const [{ data: requests }, { data: notes }, { data: tasks }, { data: reservations }] = await Promise.all([
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
  ]);

  return {
    client,
    requests: requests ?? [],
    notes: notes ?? [],
    tasks: tasks ?? [],
    reservations: reservations ?? [],
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

// Lean fetch for the Subscription page: just the wallet balance + the bits
// of settings needed to decide whether to show "Pay with Wallet" and a
// referral-discount banner. Separate from getReferralSummary above, which
// also pulls full referral/history lists the Subscription page doesn't need.
export async function getBrokerReferralWalletAndSettings(accountType: "broker" | "salesperson", accountId: string) {
  const supabase = await createClient();
  const [{ data: settings }, { data: wallet }, { data: pendingSignup }] = await Promise.all([
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
