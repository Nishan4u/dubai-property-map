"use client";

import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { Currency, Locale } from "@/lib/i18n/dictionaries";

const CURRENCIES: Currency[] = ["AED", "USD", "EUR", "GBP"];

export function LanguageCurrencySwitcher() {
  const router = useRouter();
  const { locale, currency, setPreferences, t } = useLocale();

  async function handleLocaleChange(next: Locale) {
    await setPreferences(next, currency);
    router.refresh();
  }

  async function handleCurrencyChange(next: Currency) {
    await setPreferences(locale, next);
    router.refresh();
  }

  return (
    <div className="flex shrink-0 items-center gap-1.5 text-xs">
      <Globe className="h-3.5 w-3.5 text-ink-500" />
      <select
        value={locale}
        onChange={(e) => handleLocaleChange(e.target.value as Locale)}
        aria-label={t("switcher.language")}
        className="rounded-lg border border-navy-700 bg-navy-900 px-1.5 py-1.5 text-ink-300 focus:outline-none"
      >
        <option value="en">{t("switcher.english")}</option>
        <option value="ar">{t("switcher.arabic")}</option>
      </select>
      <select
        value={currency}
        onChange={(e) => handleCurrencyChange(e.target.value as Currency)}
        aria-label={t("switcher.currency")}
        className="rounded-lg border border-navy-700 bg-navy-900 px-1.5 py-1.5 text-ink-300 focus:outline-none"
      >
        {CURRENCIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </div>
  );
}
