"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function SiteAccessSettingsPanel({
  initialEnabled,
  canManage,
}: {
  initialEnabled: boolean;
  /** Only a super admin may change this -- it's a platform-wide bypass of
   * every subscription restriction, including for guests, so it's scoped
   * tighter than regular admin access (enforced at the RLS level too, this
   * just controls whether the control is interactive). */
  canManage: boolean;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);

  async function handleToggle() {
    if (!canManage) return;
    const next = !enabled;
    setEnabled(next);
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("site_access_settings")
      .update({ restrictions_enabled: next, updated_at: new Date().toISOString() })
      .eq("id", true);
    setSaving(false);
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-ink-200">Page Restrictions</h2>
      <p className="mt-1 text-xs text-ink-500">
        Master switch for subscription gating platform-wide, including
        guests. Turn off to let everyone browse full project details
        without registering or subscribing — for demos or maintenance
        windows. Leave on for normal operation.
        {!canManage && " Only a super admin can change this."}
      </p>
      <div className="mt-3 flex items-center justify-between rounded-xl border border-navy-700 bg-navy-850 px-4 py-3">
        <span className="text-sm text-ink-200">
          {enabled ? "Restrictions active" : "Restrictions disabled — site is fully open"}
        </span>
        <button
          onClick={handleToggle}
          disabled={saving || !canManage}
          title={canManage ? undefined : "Only a super admin can change this"}
          role="switch"
          aria-checked={enabled}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
            enabled ? "bg-emerald-500" : "bg-rose-500"
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
              enabled ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>
      {!enabled && (
        <p className="mt-2 text-xs font-medium text-rose-400">
          Every project and property page is currently visible to anyone, including guests.
        </p>
      )}
    </div>
  );
}
