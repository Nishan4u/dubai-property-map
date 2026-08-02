"use client";

import { useMemo, useState } from "react";
import { NumberField, SelectField } from "./fields";

// Indicative rates only -- no live FX feed is wired into this codebase.
// Refreshed periodically by hand; never presented as real-time.
const RATES_PER_AED: Record<string, number> = {
  AED: 1,
  USD: 0.2723,
  EUR: 0.2508,
  GBP: 0.214,
  INR: 22.85,
  SAR: 1.0209,
};

const CURRENCY_LABELS: Record<string, string> = {
  AED: "AED — UAE Dirham",
  USD: "USD — US Dollar",
  EUR: "EUR — Euro",
  GBP: "GBP — British Pound",
  INR: "INR — Indian Rupee",
  SAR: "SAR — Saudi Riyal",
};

const options = Object.keys(RATES_PER_AED).map((code) => ({ value: code, label: CURRENCY_LABELS[code] }));

export function CurrencyConverter() {
  const [amount, setAmount] = useState(1000000);
  const [from, setFrom] = useState("AED");
  const [to, setTo] = useState("USD");

  const converted = useMemo(() => {
    const inAed = amount / RATES_PER_AED[from];
    return inAed * RATES_PER_AED[to];
  }, [amount, from, to]);

  return (
    <div className="space-y-3">
      <NumberField label="Amount" value={amount} onChange={setAmount} step={1000} />
      <div className="grid grid-cols-2 gap-3">
        <SelectField label="From" value={from} onChange={setFrom} options={options} />
        <SelectField label="To" value={to} onChange={setTo} options={options} />
      </div>

      <div className="rounded-lg bg-navy-800 p-3">
        <p className="text-xs text-ink-400">Converted Amount</p>
        <p className="text-xl font-semibold text-gold-400">
          {to} {converted.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </p>
      </div>
      <p className="text-[11px] text-ink-500">Indicative rates for reference only — not live market rates.</p>
    </div>
  );
}
