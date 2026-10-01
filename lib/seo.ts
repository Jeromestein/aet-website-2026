import type { Metadata } from 'next';
import { routing, type Locale } from '@/i18n/routing';
import { getOtherServiceContent, serviceSlugs, type ServiceSlug } from '@/lib/other-services';

/** Production origin confirmed by the owner on September 30, 2026. */
export const siteOrigin = 'https://www.americantranslationservice.com';
export const isPreview = process.env.VERCEL_ENV === 'preview';

export function absoluteUrl(path: string) {
  if (!path.startsWith('/') || path.startsWith('//')) throw new Error('Expected a local absolute path');
  // Match Next.js metadata serialization of the origin-only homepage URL.
  return path === '/' ? siteOrigin : new URL(path, siteOrigin).href;
}

export function localizedPath(path: string, locale: Locale) {
  return locale === 'en' ? path : `/${locale}${path === '/' ? '' : path}`;
}

/** Only real translations participate in indexing and alternate-language links. */
export function indexableLocales(path: string): readonly Locale[] {
  if (path.startsWith('/blog/') || ['/career', '/privacy', '/terms'].includes(path)) return ['en'];
  const service = path.slice(1) as ServiceSlug;
  if (serviceSlugs.includes(service)) {
    return routing.locales.filter(locale => getOtherServiceContent(service, locale).hasLocaleContent);
  }
  return routing.locales;
}

export function languageAlternates(path: string) {
  const locales = indexableLocales(path);
  if (locales.length === 1) return undefined;
  return Object.fromEntries([
    ...locales.map(locale => [locale, absoluteUrl(localizedPath(path, locale))]),
    ['x-default', absoluteUrl(path)],
  ]);
}

export function shareImagePath(path: string, locale: Locale) {
  return `/share/${locale}${path === '/' ? '/index' : path}.png`;
}

export function pageMetadata({ path, locale, title, description, type = 'website' }: {
  path: string; locale: Locale; title: string; description?: string;
  type?: 'website' | 'article';
}): Metadata {
  const translated = indexableLocales(path).includes(locale);
  const contentLocale = translated ? locale : 'en';
  const canonical = absoluteUrl(localizedPath(path, contentLocale));
  return {
    title, description,
    twitter: { card: 'summary_large_image', title, description, images: [absoluteUrl(shareImagePath(path, contentLocale))] },
    alternates: { canonical, languages: translated ? languageAlternates(path) : undefined },
    robots: isPreview || !translated ? { index: false, follow: true } : undefined,
    openGraph: {
      title, description, url: canonical, type,
      images: [{ url: absoluteUrl(shareImagePath(path, contentLocale)), width: 1200, height: 630, alt: title }],
      siteName: 'American Education & Translation Services (AET)',
      locale: { en: 'en_US', zh: 'zh_CN', es: 'es' }[contentLocale],
    },
  };
}
