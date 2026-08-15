// Pure calculator math extracted from RoiCalculator.tsx / RentalYieldCalculator.tsx
// so it can be reused outside those components (the Investment Report,
// see InvestmentQuizWizard.tsx) without a second implementation. Zero
// behavior change to either calculator -- same formulas, just lifted out
// of their own useMemo blocks.
//
// Both are pure calculators over figures the caller supplies (purchase
// price, rent/expense estimates) -- neither states or implies a real
// ROI/rental-yield figure for a specific listing, matching the
// platform-wide "never fabricate a market statistic" rule (see
// investmentScore.ts and every calculator's own comments).

export interface RoiInputs {
  priceAed: number;
  cashInvested: number;
  annualRent: number;
  annualExpenses: number;
}

export interface RoiResult {
  netAnnualIncome: number;
  cashOnCashRoi: number;
  grossRoi: number;
}

export function computeRoi({ priceAed, cashInvested, annualRent, annualExpenses }: RoiInputs): RoiResult {
  const netAnnualIncome = annualRent - annualExpenses;
  const cashOnCashRoi = cashInvested > 0 ? (netAnnualIncome / cashInvested) * 100 : 0;
  const grossRoi = priceAed > 0 ? (annualRent / priceAed) * 100 : 0;
  return { netAnnualIncome, cashOnCashRoi, grossRoi };
}

export interface RentalYieldInputs {
  priceAed: number;
  annualRent: number;
  annualCosts: number;
}

export interface RentalYieldResult {
  grossYield: number;
  netYield: number;
}

export function computeRentalYield({ priceAed, annualRent, annualCosts }: RentalYieldInputs): RentalYieldResult {
  const grossYield = priceAed > 0 ? (annualRent / priceAed) * 100 : 0;
  const netYield = priceAed > 0 ? ((annualRent - annualCosts) / priceAed) * 100 : 0;
  return { grossYield, netYield };
}
