import { RATES_PER_AED } from "./rates";
import type { Currency } from "./dictionaries";

// Split out from locale.ts specifically so it has zero next/headers
// dependency -- locale.ts is server-only (cookies()), but this pure math
// needs to be importable from client components too (LocaleProvider).
export function convertFromAed(amountAed: number, currency: Currency) {
  return amountAed * RATES_PER_AED[currency];
}

// Inverse of convertFromAed -- for turning a value a user typed in their
// selected currency (e.g. a min/max price filter) back into AED, the unit
// every project's priceFromAed is actually stored and compared in.
export function convertToAed(amountInCurrency: number, currency: Currency) {
  return amountInCurrency / RATES_PER_AED[currency];
}

const CURRENCY_SYMBOL: Record<Currency, string> = {
  AED: "AED",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

export function formatPriceValue(amountAed: number, currency: Currency) {
  const value = convertFromAed(amountAed, currency);
  const symbol = CURRENCY_SYMBOL[currency];

  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    return `${symbol} ${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M`;
  }
  if (value >= 1_000) return `${symbol} ${(value / 1000).toFixed(0)}K`;
  return `${symbol} ${value.toFixed(0)}`;
}

// Full-precision currency formatting for exact computed amounts (e.g. a
// calculator's result) -- formatPriceValue's K/M abbreviation above is for
// marketing price tags, not something you want on a mortgage payment.
export function formatMoneyValue(amountAed: number, currency: Currency) {
  const value = convertFromAed(amountAed, currency);
  return `${CURRENCY_SYMBOL[currency]} ${Math.round(value).toLocaleString()}`;
}
