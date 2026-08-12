"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, Building2, Menu, X } from "lucide-react";
import { SignOutButton } from "@/components/auth/SignOutButton";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  // When true, `href` is used as-is instead of being prefixed with
  // `basePath` — for nav items that intentionally point outside this
  // portal (e.g. a broker portal's "Property Map" linking to the public "/").
  absolute?: boolean;
  // Optional group label -- items sharing the same (consecutive) `section`
  // value get a small uppercase heading before the first one. Every
  // existing portal's navItems leave this unset, so their sidebars render
  // exactly as before this existed (no headers, one flat list) -- this is
  // purely opt-in per portal, not a behavior change to anyone who doesn't
  // set it.
  section?: string;
}

export function DashboardShell({
  brandLabel,
  brandIcon: BrandIcon = Building2,
  basePath,
  navItems,
  userLabel,
  userRole,
  headerExtra,
  children,
}: {
  brandLabel: string;
  brandIcon?: LucideIcon;
  basePath: string;
  navItems: NavItem[];
  userLabel: string;
  userRole: string;
  /** Optional extra control rendered in the header, before the "Back to
   * Public Website" link -- e.g. the admin portal's quick-search trigger.
   * Every other portal simply doesn't pass this, so their header is
   * byte-identical to before. */
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Close the mobile drawer automatically on navigation, so it doesn't
  // stay open over the next page. mobileNavOpen is also independently
  // toggled by the user (opening the drawer), so it can't be derived from
  // pathname alone -- this only needs to reset it when pathname changes.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileNavOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-navy-950">
      {mobileNavOpen && (
        <div
          onClick={() => setMobileNavOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
        />
      )}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-navy-700 bg-navy-900 transition-transform duration-200 lg:relative lg:z-auto lg:translate-x-0",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center gap-2 border-b border-navy-700 px-5 py-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold-500/15 text-gold-400">
            <BrandIcon className="h-5 w-5" />
          </div>
          <span className="truncate text-sm font-semibold text-ink-100">
            {brandLabel}
          </span>
          <button
            onClick={() => setMobileNavOpen(false)}
            className="ml-auto shrink-0 rounded-lg p-1 text-ink-400 hover:text-ink-100 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item, i) => {
            const href = item.absolute ? item.href : `${basePath}${item.href}`;
            const active = item.absolute
              ? pathname === href
              : item.href === ""
                ? pathname === basePath
                : pathname === href || pathname.startsWith(`${href}/`);
            // A section header renders once, right before the first item of
            // a new (consecutive) `section` value -- items with no section
            // set (every portal that hasn't opted in) never trigger this.
            const showSectionHeader = Boolean(item.section) && item.section !== navItems[i - 1]?.section;
            return (
              <div key={href}>
                {showSectionHeader && (
                  <p className="mb-1 mt-4 px-3 text-[10px] font-semibold uppercase tracking-wide text-ink-600">
                    {item.section}
                  </p>
                )}
                <Link
                  href={href}
                  className={clsx(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-gold-500 text-navy-950"
                      : "text-ink-300 hover:bg-navy-800 hover:text-ink-100"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              </div>
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
        <header className="flex items-center justify-between gap-3 border-b border-navy-700 bg-navy-900 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="shrink-0 rounded-lg border border-navy-700 p-2 text-ink-300 hover:text-ink-100 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="hidden truncate text-sm text-ink-400 sm:block">
              {brandLabel}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {headerExtra}
            <Link
              href="/"
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-gold-500/40 bg-gold-500/10 px-3 py-1.5 text-sm font-medium text-gold-400 hover:bg-gold-500/20"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Back to Public Website</span>
            </Link>
            <div className="flex items-center gap-2 rounded-full border border-navy-700 bg-navy-850 py-1.5 pl-1.5 pr-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold-500 text-xs font-semibold text-navy-950">
                {userLabel.charAt(0)}
              </div>
              <span className="max-w-[8rem] truncate text-sm text-ink-100 sm:max-w-none">{userLabel}</span>
              <span className="hidden text-xs text-ink-500 sm:inline">{userRole}</span>
            </div>
            <SignOutButton className="rounded-lg border border-navy-700 px-3 py-1.5 text-sm font-medium text-ink-300 hover:text-ink-100" />
          </div>
        </header>
        <main className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden bg-navy-950">
          {children}
        </main>
      </div>
    </div>
  );
}
