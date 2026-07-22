"use client";

import { useState } from "react";
import { clsx } from "clsx";
import {
  Bell,
  Download,
  Heart,
  Search,
  User,
  CalendarClock,
} from "lucide-react";
import { PublicShell } from "@/components/public/PublicShell";
import { PlaceholderPage } from "@/components/ui/PlaceholderPage";

const tabs = [
  { label: "Profile", icon: User },
  { label: "Favorites", icon: Heart },
  { label: "Viewing Requests", icon: CalendarClock },
  { label: "Saved Searches", icon: Search },
  { label: "Downloaded Brochures", icon: Download },
  { label: "Notifications", icon: Bell },
];

export default function AccountPage() {
  const [active, setActive] = useState(tabs[0].label);

  return (
    <PublicShell>
      <div className="mx-auto flex max-w-6xl gap-6 px-6 py-10">
        <aside className="w-60 shrink-0 space-y-1">
          <div className="mb-3 flex items-center gap-3 rounded-xl border border-navy-700 bg-navy-850 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-500 font-bold text-navy-950">
              N
            </div>
            <div>
              <p className="text-sm font-semibold text-ink-100">Nishan</p>
              <p className="text-xs text-ink-500">Buyer account</p>
            </div>
          </div>
          {tabs.map((tab) => (
            <button
              key={tab.label}
              onClick={() => setActive(tab.label)}
              className={clsx(
                "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
                active === tab.label
                  ? "bg-gold-500 text-navy-950"
                  : "text-ink-300 hover:bg-navy-800 hover:text-ink-100"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </aside>
        <div className="min-h-[400px] flex-1 rounded-xl border border-navy-700 bg-navy-850">
          <PlaceholderPage
            title={active}
            description={`Your ${active.toLowerCase()} will appear here once account sync is connected.`}
          />
        </div>
      </div>
    </PublicShell>
  );
}
