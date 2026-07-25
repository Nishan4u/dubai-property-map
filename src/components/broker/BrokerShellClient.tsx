"use client";

import { Bell, Briefcase, CreditCard, LayoutDashboard, Map, ShieldCheck, User } from "lucide-react";
import { DashboardShell } from "@/components/ui/DashboardShell";

const navItems = [
  { label: "Dashboard", href: "", icon: LayoutDashboard },
  { label: "Property Map", href: "/", icon: Map, absolute: true },
  { label: "Subscription", href: "/subscription", icon: CreditCard },
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
    </DashboardShell>
  );
}
