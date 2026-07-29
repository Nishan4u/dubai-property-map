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

export async function getDevelopers() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("developers")
    .select("*")
    .eq("status", "active")
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
