"use client";

import { Building2, CreditCard, LayoutDashboard, UserRound, Users } from "lucide-react";
import { DashboardShell } from "@/components/ui/DashboardShell";

const navItems = [
  { label: "Dashboard", href: "", icon: LayoutDashboard },
  { label: "My Leads", href: "/leads", icon: UserRound },
  { label: "My Brokers", href: "/brokers", icon: Users },
  { label: "My Developer", href: "/developer", icon: Building2 },
  { label: "Subscription", href: "/subscription", icon: CreditCard },
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
    </DashboardShell>
  );
}
