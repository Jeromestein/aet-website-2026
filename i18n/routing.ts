import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "zh", "es"],
  defaultLocale: "en",
  localePrefix: "as-needed",
  // Page metadata supplies production-host alternates for actual translations.
  alternateLinks: false,
  localeCookie: { name: "AET_LOCALE", maxAge: 60 * 60 * 24 * 365 },
});

export type Locale = (typeof routing.locales)[number];
export const languageNames: Record<Locale, string> = {
  en: "English",
  zh: "简体中文",
  es: "Español",
};
export const languageLabels: Record<Locale, string> = { en: "EN", zh: "中文", es: "ES" };
