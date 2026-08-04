import type { SupabaseClient } from "@supabase/supabase-js";

export type PermissionLevel = "view" | "manage";

interface ModuleDef {
  key: string;
  label: string;
}

// Mirrors AdminShellClient.tsx's navItems array exactly, one entry per
// existing admin nav item -- module keys are the href with the leading
// slash stripped ("" -> "dashboard"). Keep this list in sync whenever a
// nav item is added there; nothing breaks if it drifts (an unlisted
// module key simply can never be granted to a restricted admin), but a
// new module a real admin actually wants to delegate needs an entry
// here to be assignable.
export const ADMIN_MODULES: ModuleDef[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "developers", label: "Developers" },
  { key: "brokers", label: "Brokers" },
  { key: "brokerages", label: "Brokerages" },
  { key: "salespersons", label: "Salespersons" },
  { key: "staff", label: "Staff" },
  { key: "projects", label: "Projects" },
  { key: "upcoming-projects", label: "Upcoming Projects" },
  { key: "communities", label: "Communities" },
  { key: "catalog", label: "Catalog" },
  { key: "leads", label: "Leads" },
  { key: "property-requests", label: "Property Requests" },
  { key: "users", label: "Users" },
  { key: "bookings", label: "Bookings" },
  { key: "reservations", label: "Reservations" },
  { key: "ads", label: "Ads" },
  { key: "payments", label: "Payments" },
  { key: "subscriptions", label: "Subscriptions" },
  { key: "bank-transfers", label: "Bank Transfers" },
  { key: "packages", label: "Packages" },
  { key: "referral-program", label: "Referral Program" },
  { key: "content", label: "Content" },
  { key: "menus", label: "Menus" },
  { key: "seo", label: "SEO" },
  { key: "email-logs", label: "Email Logs" },
  { key: "notifications", label: "Notifications" },
  { key: "campaigns", label: "Campaigns" },
  { key: "landing-pages", label: "Landing Pages" },
  { key: "integrations", label: "Integrations" },
  { key: "reports", label: "Reports" },
  { key: "settings", label: "Settings" },
  { key: "security", label: "Security" },
  { key: "audit-log", label: "Audit Log" },
  { key: "roles", label: "Roles & Permissions" },
];

const ALL_MODULE_KEYS = ADMIN_MODULES.map((m) => m.key);

interface PermissionProfile {
  role?: string | null;
  custom_role_id?: string | null;
}

// Full admins (custom_role_id null -- every admin account that existed
// before this module, and any newly created without a custom role) get
// unrestricted access. This branch is deliberately first and simplest:
// it must never accidentally narrow an existing admin's access.
export function hasModuleAccess(
  profile: PermissionProfile | null | undefined,
  permissions: Record<string, PermissionLevel> | null | undefined,
  moduleKey: string,
  level: PermissionLevel = "view"
): boolean {
  if (!profile || profile.role !== "admin") return false;
  if (!profile.custom_role_id) return true;

  const granted = permissions?.[moduleKey];
  if (!granted) return false;
  if (level === "view") return granted === "view" || granted === "manage";
  return granted === "manage";
}

// Shared server-side lookup used by admin API routes: resolves a
// caller's admin-permission context safely. custom_role_id is fetched
// in its own query, isolated from the (already-passing) role check the
// caller did to get here -- if patch_113 hasn't been applied yet, this
// degrades to "full admin" (custom_role_id null) rather than erroring
// or narrowing access, same reasoning as admin/layout.tsx.
export async function getAdminPermissionContext(
  supabase: SupabaseClient,
  userId: string
): Promise<{ profile: PermissionProfile; permissions: Record<string, PermissionLevel> | null }> {
  const { data: withCustomRole, error } = await supabase
    .from("profiles")
    .select("custom_role_id")
    .eq("id", userId)
    .maybeSingle();

  const customRoleId = !error ? (withCustomRole?.custom_role_id ?? null) : null;

  let permissions: Record<string, PermissionLevel> | null = null;
  if (customRoleId) {
    const { data: customRole } = await supabase.from("custom_roles").select("permissions").eq("id", customRoleId).maybeSingle();
    permissions = (customRole?.permissions as Record<string, PermissionLevel> | undefined) ?? {};
  }

  return { profile: { role: "admin", custom_role_id: customRoleId }, permissions };
}

export function visibleModuleKeys(
  profile: PermissionProfile | null | undefined,
  permissions: Record<string, PermissionLevel> | null | undefined
): string[] {
  if (!profile || profile.role !== "admin") return [];
  if (!profile.custom_role_id) return ALL_MODULE_KEYS;
  return ADMIN_MODULES.filter((m) => hasModuleAccess(profile, permissions, m.key, "view")).map((m) => m.key);
}
