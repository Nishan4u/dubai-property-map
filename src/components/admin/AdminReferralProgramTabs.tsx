"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { AdminReferralProgramSettings } from "@/components/admin/AdminReferralProgramSettings";
import { AdminReferralProgramDashboard } from "@/components/admin/AdminReferralProgramDashboard";

export function AdminReferralProgramTabs({
  settings,
  stats,
}: {
  settings: React.ComponentProps<typeof AdminReferralProgramSettings>["initial"];
  stats: React.ComponentProps<typeof AdminReferralProgramDashboard>["stats"];
}) {
  const [tab, setTab] = useState<"overview" | "settings">("overview");

  return (
    <div>
      <div className="mb-4 flex gap-1 rounded-lg bg-navy-850 p-1">
        {(["overview", "settings"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              "flex-1 rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors",
              tab === t ? "bg-gold-500 text-navy-950" : "text-ink-300 hover:text-ink-100"
            )}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "overview" ? <AdminReferralProgramDashboard stats={stats} /> : <AdminReferralProgramSettings initial={settings} />}
    </div>
  );
}
