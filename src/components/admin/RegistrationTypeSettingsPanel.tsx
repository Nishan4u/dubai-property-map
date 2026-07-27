"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface RegistrationTypeSetting {
  account_type: string;
  enabled: boolean;
}

const labels: Record<string, string> = {
  buyer: "Buyer / Investor",
  developer: "Developer",
  broker: "Broker",
  broker_agency: "Broker Agency",
  salesperson: "Salesperson",
};

const order = ["buyer", "developer", "broker", "broker_agency", "salesperson"];

export function RegistrationTypeSettingsPanel({ settings }: { settings: RegistrationTypeSetting[] }) {
  const [values, setValues] = useState<Record<string, boolean>>(
    Object.fromEntries(settings.map((s) => [s.account_type, s.enabled]))
  );
  const [savingType, setSavingType] = useState<string | null>(null);

  async function handleToggle(accountType: string) {
    const next = !values[accountType];
    setValues((prev) => ({ ...prev, [accountType]: next }));
    setSavingType(accountType);
    const supabase = createClient();
    await supabase
      .from("registration_type_settings")
      .update({ enabled: next, updated_at: new Date().toISOString() })
      .eq("account_type", accountType);
    setSavingType(null);
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-ink-200">Registration Types</h2>
      <p className="mt-1 text-xs text-ink-500">
        Turn an account type off to hide it from the public registration form
        and block new sign-ups through it — existing accounts of that type
        are never affected.
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
