"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import type { LucideIcon } from "lucide-react";
import { Building2, ChevronDown } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export function DashboardShell({
  brandLabel,
  brandIcon: BrandIcon = Building2,
  basePath,
  navItems,
  userLabel,
  userRole,
  children,
}: {
  brandLabel: string;
  brandIcon?: LucideIcon;
  basePath: string;
  navItems: NavItem[];
  userLabel: string;
  userRole: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-navy-950">
      <aside className="flex w-64 shrink-0 flex-col border-r border-navy-700 bg-navy-900">
        <div className="flex items-center gap-2 border-b border-navy-700 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-500/15 text-gold-400">
            <BrandIcon className="h-5 w-5" />
          </div>
          <span className="text-sm font-semibold text-ink-100">
            {brandLabel}
          </span>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const href = `${basePath}${item.href}`;
            const active =
              item.href === ""
                ? pathname === basePath
                : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-gold-500 text-navy-950"
                    : "text-ink-300 hover:bg-navy-800 hover:text-ink-100"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-navy-700 p-3">
          <Link
            href="/"
            className="block rounded-lg px-3 py-2 text-center text-xs font-medium text-ink-500 hover:bg-navy-800 hover:text-ink-300"
          >
            ← Back to public site
          </Link>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-navy-700 bg-navy-900 px-6 py-4">
          <div className="text-sm text-ink-400">
            {brandLabel}
          </div>
          <button className="flex items-center gap-2 rounded-full border border-navy-700 bg-navy-850 py-1.5 pl-1.5 pr-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gold-500 text-xs font-semibold text-navy-950">
              {userLabel.charAt(0)}
            </div>
            <span className="text-sm text-ink-100">{userLabel}</span>
            <span className="text-xs text-ink-500">{userRole}</span>
            <ChevronDown className="h-3.5 w-3.5 text-ink-500" />
          </button>
        </header>
        <main className="flex flex-1 flex-col overflow-y-auto bg-navy-950">
          {children}
        </main>
      </div>
    </div>
  );
}
