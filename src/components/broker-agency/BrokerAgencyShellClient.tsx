"use client";

import {
  Bell,
  Building,
  CalendarDays,
  ClipboardList,
  Contact,
  CreditCard,
  FolderOpen,
  LayoutDashboard,
  Plug,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { DashboardShell } from "@/components/ui/DashboardShell";

const navItems = [
  { label: "Dashboard", href: "", icon: LayoutDashboard },
  { label: "My Requests", href: "/requests", icon: ClipboardList },
  { label: "Clients", href: "/clients", icon: Contact },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
  { label: "Collections", href: "/collections", icon: FolderOpen },
  { label: "My Brokers", href: "/brokers", icon: Users },
  { label: "Subscription", href: "/subscription", icon: CreditCard },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "My Profile", href: "/profile", icon: UserRound },
  { label: "Security", href: "/security", icon: ShieldCheck },
  { label: "Integrations", href: "/integrations", icon: Plug },
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
