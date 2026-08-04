"use client";

import {
  BarChart3,
  Banknote,
  Bell,
  Briefcase,
  Building2,
  ClipboardCheck,
  CreditCard,
  FileSignature,
  FileText,
  Gift,
  Landmark,
  Mail,
  Megaphone,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Tags,
  Menu as MenuIcon,
  Users,
  Wallet,
  Package,
  ClipboardList,
  Rocket,
  UserCog,
  CalendarCheck,
  IdCard,
  Send,
  LayoutTemplate,
  Plug,
} from "lucide-react";
import { DashboardShell } from "@/components/ui/DashboardShell";

const navItems = [
  { label: "Dashboard", href: "", icon: BarChart3 },
  { label: "Developers", href: "/developers", icon: Building2 },
  { label: "Brokers", href: "/brokers", icon: Briefcase },
  { label: "Brokerages", href: "/brokerages", icon: Building2 },
  { label: "Salespersons", href: "/salespersons", icon: Users },
  { label: "Staff", href: "/staff", icon: IdCard },
  { label: "Projects", href: "/projects", icon: ClipboardList },
  { label: "Upcoming Projects", href: "/upcoming-projects", icon: Rocket },
  { label: "Communities", href: "/communities", icon: Landmark },
  { label: "Catalog", href: "/catalog", icon: Tags },
  { label: "Leads", href: "/leads", icon: Users },
  { label: "Property Requests", href: "/property-requests", icon: ClipboardCheck },
  { label: "Users", href: "/users", icon: UserCog },
  { label: "Bookings", href: "/bookings", icon: CalendarCheck },
  { label: "Reservations", href: "/reservations", icon: FileSignature },
  { label: "Ads", href: "/ads", icon: Megaphone },
  { label: "Payments", href: "/payments", icon: Wallet },
  { label: "Subscriptions", href: "/subscriptions", icon: CreditCard },
  { label: "Bank Transfers", href: "/bank-transfers", icon: Banknote },
  { label: "Packages", href: "/packages", icon: Package },
  { label: "Referral Program", href: "/referral-program", icon: Gift },
  { label: "Content", href: "/content", icon: FileText },
  { label: "Menus", href: "/menus", icon: MenuIcon },
  { label: "SEO", href: "/seo", icon: Search },
  { label: "Email Logs", href: "/email-logs", icon: Mail },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Campaigns", href: "/campaigns", icon: Send },
  { label: "Landing Pages", href: "/landing-pages", icon: LayoutTemplate },
  { label: "Integrations", href: "/integrations", icon: Plug },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Security", href: "/security", icon: ShieldCheck },
  { label: "Audit Log", href: "/audit-log", icon: Shield },
];

export function AdminShellClient({
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
      brandLabel="Admin Dashboard"
      brandIcon={Shield}
      basePath="/admin"
      navItems={navItems}
      userLabel={userLabel}
      userRole={userRole}
    >
      {children}
    </DashboardShell>
  );
}
