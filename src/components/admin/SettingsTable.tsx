"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/Badge";

interface Setting {
  key: string;
  label: string;
  value: string;
}

const liveWiredKeys = new Set([
  "google_analytics_id",
  "gtm_container_id",
  "meta_pixel_id",
  "tiktok_pixel_id",
  "google_adsense_publisher_id",
]);

export function SettingsTable({ settings }: { settings: Setting[] }) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(settings.map((s) => [s.key, s.value]))
  );
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  async function handleSave(key: string) {
    setSavingKey(key);
    const supabase = createClient();
    await supabase
      .from("platform_settings")
      .update({ value: values[key], updated_at: new Date().toISOString() })
      .eq("key", key);
    setSavingKey(null);
    setSavedKey(key);
    setTimeout(() => setSavedKey((k) => (k === key ? null : k)), 2000);
  }

  return (
    <div>
      <div className="divide-y divide-navy-800 rounded-xl border border-navy-700 bg-navy-850">
        {settings.map((s) => (
          <div key={s.key} className="flex items-center gap-3 px-4 py-3">
            <div className="w-48 shrink-0">
              <span className="text-sm text-ink-200">{s.label}</span>
            </div>
            <input
              value={values[s.key]}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, [s.key]: e.target.value }))
              }
              placeholder="Not configured"
              className="flex-1 rounded-lg border border-navy-600 bg-navy-800 px-3 py-1.5 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
            />
            {liveWiredKeys.has(s.key) && (
              <Badge tone="blue">Live-wired</Badge>
            )}
            <Badge tone={values[s.key] ? "green" : "neutral"}>
              {values[s.key] ? "Configured" : "Not configured"}
            </Badge>
            <button
              onClick={() => handleSave(s.key)}
              disabled={savingKey === s.key}
              className="shrink-0 text-xs font-medium text-gold-400 hover:text-gold-300 disabled:opacity-50"
            >
              {savingKey === s.key ? "Saving…" : savedKey === s.key ? "Saved" : "Save"}
            </button>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-ink-500">
        &quot;Live-wired&quot; fields actually inject their tracking script
        site-wide as soon as you save a value. The rest are stored here for
        reference but need real backend integration work (SMTP relay,
        Firebase SDK, Stripe, etc.) beyond just pasting in a key.
      </p>
    </div>
  );
}
