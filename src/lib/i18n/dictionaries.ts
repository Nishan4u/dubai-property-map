export type Locale = "en" | "ar";
export type Currency = "AED" | "USD" | "EUR" | "GBP";

// Deliberately small and honest: covers the shared chrome pieces this
// pass actually translates (the language/currency switcher itself, the
// footer copyright line). Site nav labels come from the DB-driven
// nav_links table (admin-managed via /admin/menus), not this dictionary
// -- translating those needs a label_ar column + admin UI, a reasonable
// follow-up, not force-fit into this pass. Most page body copy (search
// filters, calculator labels, card microcopy) stays English in this
// pass too -- see the plan's explicit scope boundaries.
export const dictionaries: Record<Locale, Record<string, string>> = {
  en: {
    "switcher.language": "Language",
    "switcher.currency": "Currency",
    "switcher.english": "English",
    "switcher.arabic": "العربية",
    "footer.rights": "© {year} Dubai Property Map. All rights reserved.",
  },
  ar: {
    "switcher.language": "اللغة",
    "switcher.currency": "العملة",
    "switcher.english": "English",
    "switcher.arabic": "العربية",
    "footer.rights": "© {year} خريطة عقارات دبي. جميع الحقوق محفوظة.",
  },
};

export function translate(locale: Locale, key: string, vars?: Record<string, string | number>) {
  let text = dictionaries[locale][key] ?? dictionaries.en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}
