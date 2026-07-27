"use client";

import { Building, LayoutDashboard, UserRound, Users } from "lucide-react";
import { DashboardShell } from "@/components/ui/DashboardShell";

const navItems = [
  { label: "Dashboard", href: "", icon: LayoutDashboard },
  { label: "My Brokers", href: "/brokers", icon: Users },
  { label: "My Profile", href: "/profile", icon: UserRound },
];

export function BrokerAgencyShellClient({
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
      brandLabel="Broker Agency Portal"
      brandIcon={Building}
      basePath="/broker-agency"
      navItems={navItems}
      userLabel={userLabel}
      userRole={userRole}
    >
      {children}
    </DashboardShell>
  );
}
