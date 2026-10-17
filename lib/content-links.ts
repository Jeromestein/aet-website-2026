import type { Locale } from '@/i18n/routing';

const localizedPages = new Set([
  '/', '/about', '/contact', '/institutions', '/pricing', '/evaluation',
  '/certified-translation', '/payment', '/blog', '/career',
  '/technical-translation', '/interpretation', '/expert-opinion-letters',
  '/general-translation', '/notarization', '/visa-service',
  ...['miami', 'boston', 'los-angeles', 'beijing'].map(slug => `/offices/${slug}`),
]);

/** Localize reviewed internal HTML links; retain downloads, legal URLs,
 * external services, queries and fragments exactly as supplied.
 * This renderer only accepts checked-in content, never user-supplied HTML.
 */
export function localizeContentLinks(html: string, locale: Locale) {
  return html.replace(/\bhref=(['"])(\/(?!\/)[^'"?#]*)([^'"]*)\1/g,
    (match, quote: string, path: string, suffix: string) => {
      const base = path.replace(/^\/(?:en|zh|es)(?=\/|$)/, '') || '/';
      if (!localizedPages.has(base) && !/^\/blog\/[\w-]+$/.test(base)) return match;
      const localized = locale === 'en' ? base : `/${locale}${base === '/' ? '' : base}`;
      return `href=${quote}${localized}${suffix}${quote}`;
    });
}
