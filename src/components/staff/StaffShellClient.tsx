"use client";

import { Award, IdCard, LayoutDashboard, Target, UserRound, Users, Wallet } from "lucide-react";
import { DashboardShell } from "@/components/ui/DashboardShell";

const navItems = [
  { label: "Dashboard", href: "", icon: LayoutDashboard },
  { label: "My Referral Code", href: "/referral-code", icon: IdCard },
  { label: "My Customers", href: "/customers", icon: Users },
  { label: "My Monthly Target", href: "/target", icon: Target },
  { label: "My Commission", href: "/commission", icon: Wallet },
  { label: "My Performance", href: "/performance", icon: Award },
  { label: "My Profile", href: "/profile", icon: UserRound },
];

export function StaffShellClient({
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
      brandLabel="Staff Portal"
      brandIcon={IdCard}
      basePath="/staff"
      navItems={navItems}
      userLabel={userLabel}
      userRole={userRole}
    >
      {children}
    </DashboardShell>
  );
}
