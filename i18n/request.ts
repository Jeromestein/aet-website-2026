import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import english from "../messages/en.json";

type Messages = { [key: string]: string | Messages };

/** Preserve English copy if a translation is temporarily missing. */
function withFallback(base: Messages, translated: Messages, path = ""): Messages {
  return Object.fromEntries(Object.entries(base).map(([key, value]) => {
    const next = translated[key];
    const messagePath = path ? `${path}.${key}` : key;
    if (typeof value === "object") {
      return [key, withFallback(value, typeof next === "object" ? next : {}, messagePath)];
    }
    if (typeof next === "string" && next.trim()) return [key, next];
    if (process.env.NODE_ENV !== "production") console.warn(`Missing translation: ${messagePath}`);
    return [key, value];
  }));
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  const translated = (await import(`../messages/${locale}.json`)).default as Messages;
  return { locale, messages: withFallback(english, translated) };
});
