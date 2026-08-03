"use client";

import {
  BarChart3,
  Bell,
  Briefcase,
  Building2,
  CalendarCheck,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  LayoutDashboard,
  Mail,
  Package,
  Rocket,
  Settings,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import { DashboardShell } from "@/components/ui/DashboardShell";

const navItems = [
  { label: "Dashboard", href: "", icon: LayoutDashboard },
  { label: "Projects", href: "/projects", icon: Building2 },
  { label: "Upcoming Projects", href: "/upcoming-projects", icon: Rocket },
  { label: "Investor / Buyer Leads", href: "/leads", icon: Users },
  { label: "Salespersons", href: "/salespersons", icon: Briefcase },
  { label: "Bookings", href: "/bookings", icon: CalendarCheck },
  { label: "Reservations", href: "/reservations", icon: ClipboardCheck },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
  { label: "Collections", href: "/collections", icon: FolderOpen },
  { label: "Messages", href: "/messages", icon: Mail },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Media", href: "/media", icon: ImageIcon },
  { label: "Documents", href: "/documents", icon: FileText },
  { label: "Team", href: "/team", icon: Users },
  { label: "Packages", href: "/packages", icon: Package },
  { label: "Billing", href: "/billing", icon: CreditCard },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Profile", href: "/profile", icon: User },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Security", href: "/security", icon: ShieldCheck },
];

export function DeveloperShellClient({
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
      brandLabel="Developer Dashboard"
      brandIcon={Building2}
      basePath="/dashboard"
      navItems={navItems}
      userLabel={userLabel}
      userRole={userRole}
    >
      {children}
    </DashboardShell>
  );
}
