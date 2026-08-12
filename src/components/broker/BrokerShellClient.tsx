"use client";

import { Bell, Briefcase, Building2, CalendarDays, ClipboardList, CreditCard, FolderOpen, Gift, Home, LayoutDashboard, Map, Plug, Rocket, Scale, ShieldCheck, User, Users } from "lucide-react";
import { DashboardShell } from "@/components/ui/DashboardShell";
import { PortalAssistantWidget } from "@/components/portal/PortalAssistantWidget";

// Grouped into 3 zones (Broker Vault nav consolidation) -- every href/
// icon is unchanged from before, this only reorders + tags items with a
// `section` so DashboardShell renders "Vault"/"Account" headers. Nothing
// was added or removed.
const navItems = [
  { label: "Dashboard", href: "", icon: LayoutDashboard },
  { label: "Property Map", href: "/", icon: Map, absolute: true },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },

  { label: "My Requests", href: "/requests", icon: ClipboardList, section: "Vault" },
  { label: "My Listings", href: "/listings", icon: Home, section: "Vault" },
  { label: "Developer Projects", href: "/projects", icon: Rocket, section: "Vault" },
  { label: "Clients", href: "/clients", icon: Users, section: "Vault" },
  { label: "Collections", href: "/collections", icon: FolderOpen, section: "Vault" },
  { label: "Compare", href: "/compare", icon: Scale, section: "Vault" },

  { label: "My Agency", href: "/agency", icon: Building2, section: "Account" },
  { label: "Subscription", href: "/subscription", icon: CreditCard, section: "Account" },
  { label: "Referral", href: "/referral", icon: Gift, section: "Account" },
  { label: "Notifications", href: "/notifications", icon: Bell, section: "Account" },
  { label: "Profile", href: "/profile", icon: User, section: "Account" },
  { label: "Security", href: "/security", icon: ShieldCheck, section: "Account" },
  { label: "Integrations", href: "/integrations", icon: Plug, section: "Account" },
];

export function BrokerShellClient({
  userLabel,
  userRole,
  children,
}: {
  userLabel: string;
  userRole: string;
  children: React.ReactNode;
}) {
  return (
    <DashboardShell
      brandLabel="Broker Portal"
      brandIcon={Briefcase}
      basePath="/broker"
      navItems={navItems}
      userLabel={userLabel}
      userRole={userRole}
    >
      {children}
      <PortalAssistantWidget
        apiPath="/api/broker/assistant/chat"
        title="Broker Assistant"
        subtitle="Ask about your property requests or search listings"
        placeholder="Ask a question…"
        greeting="Hi! I can search live listings for your clients or summarize your own property requests -- e.g. &quot;what are my open requests?&quot; or &quot;3-bedroom villas under 3M AED&quot;."
      />
    </DashboardShell>
  );
}
