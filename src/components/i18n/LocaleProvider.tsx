"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { translate, type Currency, type Locale } from "@/lib/i18n/dictionaries";
import { formatPriceValue } from "@/lib/i18n/currency";

interface LocaleContextValue {
  locale: Locale;
  currency: Currency;
  t: (key: string, vars?: Record<string, string | number>) => string;
  formatPrice: (amountAed: number) => string;
  setPreferences: (locale: Locale, currency: Currency) => Promise<void>;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

// Client-side counterpart to src/lib/i18n/locale.ts's server helpers --
// client components (the switcher itself, any client component that
// needs t()/formatPrice() without prop-drilling) read from this context
// instead of next/headers cookies(), which only works server-side.
// Seeded with the server-resolved locale/currency so there's never a
// flash of the wrong language/currency on first paint.
export function LocaleProvider({
  initialLocale,
  initialCurrency,
  children,
}: {
  initialLocale: Locale;
  initialCurrency: Currency;
  children: ReactNode;
}) {
  const [locale, setLocale] = useState(initialLocale);
  const [currency, setCurrency] = useState(initialCurrency);

  async function setPreferences(nextLocale: Locale, nextCurrency: Currency) {
    setLocale(nextLocale);
    setCurrency(nextCurrency);
    await fetch("/api/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: nextLocale, currency: nextCurrency }),
    });
  }

  function formatPrice(amountAed: number) {
    return formatPriceValue(amountAed, currency);
  }

  return (
    <LocaleContext.Provider
      value={{
        locale,
        currency,
        t: (key, vars) => translate(locale, key, vars),
        formatPrice,
        setPreferences,
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within a LocaleProvider");
  return ctx;
}
