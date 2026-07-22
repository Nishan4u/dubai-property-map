"use client";

import {
  BarChart3,
  Building2,
  FileText,
  Landmark,
  Megaphone,
  Settings,
  Shield,
  Users,
  Wallet,
  Package,
  ClipboardList,
  UserCog,
  CalendarCheck,
} from "lucide-react";
import { DashboardShell } from "@/components/ui/DashboardShell";

const navItems = [
  { label: "Dashboard", href: "", icon: BarChart3 },
  { label: "Developers", href: "/developers", icon: Building2 },
  { label: "Projects", href: "/projects", icon: ClipboardList },
  { label: "Communities", href: "/communities", icon: Landmark },
  { label: "Leads", href: "/leads", icon: Users },
  { label: "Users", href: "/users", icon: UserCog },
  { label: "Bookings", href: "/bookings", icon: CalendarCheck },
  { label: "Ads", href: "/ads", icon: Megaphone },
  { label: "Payments", href: "/payments", icon: Wallet },
  { label: "Packages", href: "/packages", icon: Package },
  { label: "Content", href: "/content", icon: FileText },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell
      brandLabel="Admin Dashboard"
      brandIcon={Shield}
      basePath="/admin"
      navItems={navItems}
      userLabel="Admin User"
      userRole="Super Admin"
    >
      {children}
    </DashboardShell>
  );
}
