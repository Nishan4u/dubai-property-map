"use client";

import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { CompactSelect } from "@/components/public/CompactSelect";
import type { Currency, Locale } from "@/lib/i18n/dictionaries";

const CURRENCIES: Currency[] = ["AED", "USD", "EUR", "GBP"];

// Rebuilt on CompactSelect -- the same custom-styled dropdown used
// everywhere else on the site (filters, admin tables, forms) -- instead
// of plain native <select> elements, which looked visually out of place
// against the site's own dark theme (no custom option list, no matching
// hover/selected states, browser-default dropdown chrome on every OS).
export function LanguageCurrencySwitcher() {
  const router = useRouter();
  const { locale, currency, setPreferences, t } = useLocale();

  async function handleLocaleChange(next: string) {
    await setPreferences(next as Locale, currency);
    router.refresh();
  }

  async function handleCurrencyChange(next: string) {
    await setPreferences(locale, next as Currency);
    router.refresh();
  }

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <Globe className="h-3.5 w-3.5 shrink-0 text-ink-500" />
      <CompactSelect
        label={t("switcher.language")}
        placeholder={t("switcher.language")}
        value={locale}
        onChange={handleLocaleChange}
        options={[
          { label: t("switcher.english"), value: "en" },
          { label: t("switcher.arabic"), value: "ar" },
        ]}
        hideLabel
        allowClear={false}
        className="w-[92px]"
      />
      <CompactSelect
        label={t("switcher.currency")}
        placeholder={t("switcher.currency")}
        value={currency}
        onChange={handleCurrencyChange}
        options={CURRENCIES.map((c) => ({ label: c, value: c }))}
        hideLabel
        allowClear={false}
        className="w-[68px]"
      />
    </div>
  );
}
