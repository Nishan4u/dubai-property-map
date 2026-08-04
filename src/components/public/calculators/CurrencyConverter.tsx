"use client";

import { useMemo, useState } from "react";
import { NumberField, SelectField } from "./fields";
import { RATES_PER_AED, CURRENCY_LABELS } from "@/lib/i18n/rates";

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
