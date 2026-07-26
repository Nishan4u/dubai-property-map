import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { categorySlug, documentCategories } from "@/lib/documentCategories";
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
    .select("*, developers(*), communities(*)")
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

export async function getAllBankTransfersAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscription_bank_transfers")
    .select("*, developers(name), brokers(full_name)")
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

  return data
    .filter((f) => f.name !== ".emptyFolderPlaceholder")
    .map((f) => ({
      name: f.name.replace(/^\d+-/, ""),
      url: supabase.storage.from("project-media").getPublicUrl(`${path}/${f.name}`)
        .data.publicUrl,
      isImage: /\.(png|jpe?g|webp|gif|avif)$/i.test(f.name),
      isVideo: /\.(mp4|webm|mov)$/i.test(f.name),
    }));
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
    .select("*")
    .eq("developer_id", developerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getAllSalespersonsAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("salespersons")
    .select("*, developers(name)")
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
