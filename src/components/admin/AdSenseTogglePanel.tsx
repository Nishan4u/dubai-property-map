"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { logAudit } from "@/lib/auditLog";

// Same switch markup as IpRestrictionsPanel.tsx, for visual consistency
// with the other settings toggles on this page.
export function AdSenseTogglePanel({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);

  async function handleToggle() {
    const next = !enabled;
    setEnabled(next);
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("platform_settings")
      .update({ value: next ? "true" : "false", updated_at: new Date().toISOString() })
      .eq("key", "adsense_enabled");
    await logAudit(
      next ? "platform_settings.adsense_enabled" : "platform_settings.adsense_disabled",
      "platform_settings",
      "adsense_enabled"
    );
    setSaving(false);
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-ink-200">Google AdSense</h2>
      <p className="mt-1 text-xs text-ink-500">
        Turns every ad off site-wide (the auto script and every manual
        placement) without losing your configured Publisher ID below —
        flip it back on any time.
      </p>
      <div className="mt-3 flex items-center justify-between rounded-xl border border-navy-700 bg-navy-850 px-4 py-3">
        <span className="text-sm text-ink-200">
          {enabled ? "Ads are showing site-wide" : "Ads are switched off site-wide"}
        </span>
        <button
          onClick={handleToggle}
          disabled={saving}
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
    </div>
  );
}
