"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface FreeAccessSetting {
  account_type: string;
  enabled: boolean;
}

const labels: Record<string, string> = {
  developer: "Developer",
  broker: "Broker",
  broker_agency: "Broker Agency",
  salesperson: "Salesperson",
};

const order = ["developer", "broker", "broker_agency", "salesperson"];

export function FreeAccessSettingsPanel({ settings }: { settings: FreeAccessSetting[] }) {
  const [values, setValues] = useState<Record<string, boolean>>(
    Object.fromEntries(settings.map((s) => [s.account_type, s.enabled]))
  );
  const [savingType, setSavingType] = useState<string | null>(null);

  // The switch used to flip optimistically and never check whether the
  // write actually succeeded -- a silently-failed update (RLS hiccup,
  // stale session, dropped request) would leave the UI showing "off"
  // while the database row was still "on", with no way to tell from the
  // screen. proxy.ts and every other enforcement point reads the
  // database, not this component's local state, so that mismatch was a
  // real, invisible bug: an admin could believe an account type was
  // gated when it never actually was. Now the write's result is checked
  // and the toggle reverts + surfaces an error on failure, instead of
  // trusting the optimistic flip.
  async function handleToggle(accountType: string) {
    const previous = values[accountType];
    const next = !previous;
    setValues((prev) => ({ ...prev, [accountType]: next }));
    setSavingType(accountType);
    const supabase = createClient();
    const { error } = await supabase
      .from("free_access_settings")
      .update({ enabled: next, updated_at: new Date().toISOString() })
      .eq("account_type", accountType);
    if (error) {
      setValues((prev) => ({ ...prev, [accountType]: previous }));
      window.alert(
        `Couldn't save this change (${labels[accountType] ?? accountType} is still ${previous ? "ON" : "OFF"}): ${error.message}`
      );
    }
    setSavingType(null);
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-ink-200">Global Free Access</h2>
      <p className="mt-1 text-xs text-ink-500">
        Turn an account type on to give every account of that type free access
        (map, browsing, property requests) regardless of their own subscription
        status — separate from granting a free subscription to one specific
        account below. Developers already always have map access; turning
        Developer on instead removes every developer&apos;s active-listing cap,
        giving unlimited listings platform-wide.
      </p>
      <div className="mt-3 divide-y divide-navy-800 rounded-xl border border-navy-700 bg-navy-850">
        {order
          .filter((type) => values[type] !== undefined)
          .map((type) => (
            <div key={type} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-ink-200">{labels[type] ?? type}</span>
              <button
                onClick={() => handleToggle(type)}
                disabled={savingType === type}
                role="switch"
                aria-checked={values[type]}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
                  values[type] ? "bg-emerald-500" : "bg-navy-600"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    values[type] ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}
