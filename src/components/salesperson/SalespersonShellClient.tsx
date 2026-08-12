"use client";

import { Building2, CalendarDays, Contact, CreditCard, FolderOpen, Gift, LayoutDashboard, Plug, Scale, ShieldCheck, UserRound, Users } from "lucide-react";
import { DashboardShell } from "@/components/ui/DashboardShell";
import { PortalAssistantWidget } from "@/components/portal/PortalAssistantWidget";

const navItems = [
  { label: "Dashboard", href: "", icon: LayoutDashboard },
  { label: "My Leads", href: "/leads", icon: UserRound },
  { label: "Clients", href: "/clients", icon: Contact },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
  { label: "Collections", href: "/collections", icon: FolderOpen },
  { label: "Compare", href: "/compare", icon: Scale },
  { label: "My Brokers", href: "/brokers", icon: Users },
  { label: "My Developer", href: "/developer", icon: Building2 },
  { label: "Subscription", href: "/subscription", icon: CreditCard },
  { label: "Referral", href: "/referral", icon: Gift },
  { label: "Security", href: "/security", icon: ShieldCheck },
  { label: "Integrations", href: "/integrations", icon: Plug },
];

export function SalespersonShellClient({
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
      brandLabel="Salesperson Portal"
      brandIcon={UserRound}
      basePath="/salesperson"
      navItems={navItems}
      userLabel={userLabel}
      userRole={userRole}
    >
      {children}
      <PortalAssistantWidget
        apiPath="/api/salesperson/assistant/chat"
        title="Sales Assistant"
        subtitle="Ask about your leads or search your developer's listings"
        placeholder="Ask a question…"
        greeting="Hi! I can search your developer's live listings or summarize your own leads -- e.g. &quot;what leads do I have open?&quot; or &quot;2-bedroom units under 2M AED&quot;."
      />
    </DashboardShell>
  );
}
