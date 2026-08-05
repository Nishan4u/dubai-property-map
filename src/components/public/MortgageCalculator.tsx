"use client";

import { useMemo, useState } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { convertFromAed, convertToAed } from "@/lib/i18n/currency";

export function MortgageCalculator({ priceAed }: { priceAed: number }) {
  const { currency, formatMoney } = useLocale();
  const [price, setPrice] = useState(priceAed);
  const [downPct, setDownPct] = useState(20);
  const [rate, setRate] = useState(4.5);
  const [years, setYears] = useState(25);

  const monthly = useMemo(() => {
    const principal = price * (1 - downPct / 100);
    const monthlyRate = rate / 100 / 12;
    const n = years * 12;
    if (monthlyRate === 0) return principal / n;
    return (
      (principal * monthlyRate * Math.pow(1 + monthlyRate, n)) /
      (Math.pow(1 + monthlyRate, n) - 1)
    );
  }, [price, downPct, rate, years]);

  return (
    <div className="space-y-3">
      <NumberField
        label={`Property Price (${currency})`}
        value={convertFromAed(price, currency)}
        onChange={(v) => setPrice(convertToAed(v, currency))}
        step={10000}
      />
      <SliderField label="Down Payment" value={downPct} onChange={setDownPct} min={5} max={80} suffix="%" />
      <SliderField label="Interest Rate" value={rate} onChange={setRate} min={2} max={8} step={0.1} suffix="%" />
      <SliderField label="Tenure" value={years} onChange={setYears} min={5} max={30} suffix=" yrs" />

      <div className="rounded-lg bg-navy-800 p-3">
        <p className="text-xs text-ink-400">Estimated Monthly Payment</p>
        <p className="text-xl font-semibold text-gold-400">{formatMoney(monthly)}</p>
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step: number;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-ink-400">
        {label}
      </label>
      <input
        type="number"
        value={value}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
      />
    </div>
  );
}

function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix = "",
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <label className="font-medium text-ink-400">{label}</label>
        <span className="font-semibold text-ink-200">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-gold-500"
      />
    </div>
  );
}
