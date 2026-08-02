"use client";

import { Bell, Briefcase, Building2, CreditCard, Gift, LayoutDashboard, Map, ShieldCheck, User } from "lucide-react";
import { DashboardShell } from "@/components/ui/DashboardShell";
import { PortalAssistantWidget } from "@/components/portal/PortalAssistantWidget";

const navItems = [
  { label: "Dashboard", href: "", icon: LayoutDashboard },
  { label: "Property Map", href: "/", icon: Map, absolute: true },
  { label: "My Agency", href: "/agency", icon: Building2 },
  { label: "Subscription", href: "/subscription", icon: CreditCard },
  { label: "Referral", href: "/referral", icon: Gift },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Profile", href: "/profile", icon: User },
  { label: "Security", href: "/security", icon: ShieldCheck },
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
