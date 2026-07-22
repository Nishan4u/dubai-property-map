"use client";

import {
  BarChart3,
  Bell,
  Building2,
  CalendarCheck,
  CreditCard,
  FileText,
  Image as ImageIcon,
  LayoutDashboard,
  Package,
  Settings,
  User,
  Users,
} from "lucide-react";
import { DashboardShell } from "@/components/ui/DashboardShell";

const navItems = [
  { label: "Dashboard", href: "", icon: LayoutDashboard },
  { label: "Projects", href: "/projects", icon: Building2 },
  { label: "Leads", href: "/leads", icon: Users },
  { label: "Bookings", href: "/bookings", icon: CalendarCheck },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Media", href: "/media", icon: ImageIcon },
  { label: "Documents", href: "/documents", icon: FileText },
  { label: "Team", href: "/team", icon: Users },
  { label: "Packages", href: "/packages", icon: Package },
  { label: "Billing", href: "/billing", icon: CreditCard },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Profile", href: "/profile", icon: User },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function DeveloperDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell
      brandLabel="Developer Dashboard"
      brandIcon={Building2}
      basePath="/dashboard"
      navItems={navItems}
      userLabel="DAMAC Properties"
      userRole="Developer"
    >
      {children}
    </DashboardShell>
  );
}
