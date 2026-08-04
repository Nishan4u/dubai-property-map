// Indicative rates only -- no live FX feed is wired into this codebase.
// Refreshed periodically by hand; never presented as real-time.
//
// Lives in its own directive-less module (not inside CurrencyConverter.tsx,
// which is "use client") specifically so it's safely importable from BOTH
// server code (src/lib/i18n/currency.ts, used by server components) and
// client code -- a plain value export from a "use client" file resolves to
// undefined when imported into a Server Component, which silently turned
// every server-rendered price into "AED NaN" until this was split out.
export const RATES_PER_AED: Record<string, number> = {
  AED: 1,
  USD: 0.2723,
  EUR: 0.2508,
  GBP: 0.214,
  INR: 22.85,
  SAR: 1.0209,
};

export const CURRENCY_LABELS: Record<string, string> = {
  AED: "AED — UAE Dirham",
  USD: "USD — US Dollar",
  EUR: "EUR — Euro",
  GBP: "GBP — British Pound",
  INR: "INR — Indian Rupee",
  SAR: "SAR — Saudi Riyal",
};
