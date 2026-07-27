"use client";

import { Award, Bell, CreditCard, IdCard, LayoutDashboard, Link2, Target, UserRound, Users, Wallet } from "lucide-react";
import { DashboardShell } from "@/components/ui/DashboardShell";

const navItems = [
  { label: "Dashboard", href: "", icon: LayoutDashboard },
  { label: "My Referral Code", href: "/referral-code", icon: IdCard },
  { label: "My Customers", href: "/customers", icon: Users },
  { label: "My Subscriptions", href: "/subscriptions", icon: CreditCard },
  { label: "My Monthly Target", href: "/target", icon: Target },
  { label: "My Commission", href: "/commission", icon: Wallet },
  { label: "My Performance", href: "/performance", icon: Award },
  { label: "My Shared Links", href: "/shared-links", icon: Link2 },
  { label: "Notifications", href: "/notifications", icon: Bell },
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
