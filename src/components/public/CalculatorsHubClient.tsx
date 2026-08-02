"use client";

import { useState } from "react";
import {
  Banknote,
  Calculator,
  Coins,
  Home,
  PiggyBank,
  Receipt,
  Ruler,
  TrendingUp,
} from "lucide-react";
import { MortgageCalculator } from "@/components/public/MortgageCalculator";
import { RoiCalculator } from "@/components/public/calculators/RoiCalculator";
import { RentalYieldCalculator } from "@/components/public/calculators/RentalYieldCalculator";
import { DldFeeCalculator } from "@/components/public/calculators/DldFeeCalculator";
import { CurrencyConverter } from "@/components/public/calculators/CurrencyConverter";
import { AreaConverter } from "@/components/public/calculators/AreaConverter";
import { PaymentPlanCalculator } from "@/components/public/calculators/PaymentPlanCalculator";
import { AffordabilityCalculator } from "@/components/public/calculators/AffordabilityCalculator";

const DEFAULT_PRICE = 1500000;

const CALCULATORS = [
  {
    id: "mortgage",
    label: "Mortgage",
    icon: Home,
    description: "Estimate your monthly mortgage payment.",
    render: () => <MortgageCalculator priceAed={DEFAULT_PRICE} />,
  },
  {
    id: "affordability",
    label: "Affordability",
    icon: PiggyBank,
    description: "See the maximum property price you can afford.",
    render: () => <AffordabilityCalculator />,
  },
  {
    id: "roi",
    label: "ROI",
    icon: TrendingUp,
    description: "Cash-on-cash and gross return on an investment property.",
    render: () => <RoiCalculator priceAed={DEFAULT_PRICE} />,
  },
  {
    id: "rental-yield",
    label: "Rental Yield",
    icon: Banknote,
    description: "Gross and net rental yield from price and rent.",
    render: () => <RentalYieldCalculator priceAed={DEFAULT_PRICE} />,
  },
  {
    id: "dld-fee",
    label: "DLD Fee",
    icon: Receipt,
    description: "Dubai Land Department transfer fee and other closing costs.",
    render: () => <DldFeeCalculator priceAed={DEFAULT_PRICE} />,
  },
  {
    id: "payment-plan",
    label: "Payment Plan",
    icon: Calculator,
    description: "Turn a developer payment plan's percentages into AED amounts.",
    render: () => <PaymentPlanCalculator priceAed={DEFAULT_PRICE} />,
  },
  {
    id: "currency",
    label: "Currency",
    icon: Coins,
    description: "Convert AED to other major currencies.",
    render: () => <CurrencyConverter />,
  },
  {
    id: "area",
    label: "Area",
    icon: Ruler,
    description: "Convert between square feet, meters, and yards.",
    render: () => <AreaConverter />,
  },
];

export function CalculatorsHubClient() {
  const [activeId, setActiveId] = useState(CALCULATORS[0].id);
  const active = CALCULATORS.find((c) => c.id === activeId) ?? CALCULATORS[0];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink-100">Property Calculators</h1>
        <p className="mt-1 text-sm text-ink-400">
          Free tools to plan your Dubai property purchase — mortgage, affordability, returns, fees, and conversions.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {CALCULATORS.map((c) => {
            const Icon = c.icon;
            const isActive = c.id === activeId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveId(c.id)}
                className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors lg:shrink ${
                  isActive
                    ? "border-gold-500 bg-gold-500/10 text-gold-400"
                    : "border-navy-700 bg-navy-850 text-ink-300 hover:text-ink-100"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {c.label}
              </button>
            );
          })}
        </nav>

        <div className="rounded-xl border border-navy-700 bg-navy-850 p-5">
          <p className="mb-1 text-sm font-semibold text-ink-100">{active.label} Calculator</p>
          <p className="mb-4 text-xs text-ink-500">{active.description}</p>
          {active.render()}
        </div>
      </div>
    </div>
  );
}
