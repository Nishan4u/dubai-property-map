import { cookies } from "next/headers";
import { translate, type Currency, type Locale } from "./dictionaries";
import { formatPriceValue } from "./currency";

const LOCALE_COOKIE = "locale";
const CURRENCY_COOKIE = "currency";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  return store.get(LOCALE_COOKIE)?.value === "ar" ? "ar" : "en";
}

export async function getCurrency(): Promise<Currency> {
  const store = await cookies();
  const value = store.get(CURRENCY_COOKIE)?.value;
  return value === "USD" || value === "EUR" || value === "GBP" ? value : "AED";
}

export async function t(key: string, vars?: Record<string, string | number>) {
  const locale = await getLocale();
  return translate(locale, key, vars);
}

export function formatPrice(amountAed: number, currency: Currency) {
  return formatPriceValue(amountAed, currency);
}
