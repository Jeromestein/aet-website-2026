import type { Locale } from '@/i18n/routing';
import { absoluteUrl, localizedPath, indexableLocales } from '@/lib/seo';
import { StructuredData } from '@/components/structured-data';

export function BreadcrumbStructuredData({ path, locale, title }: { path: string; locale: Locale; title: string }) {
  if (!indexableLocales(path).includes(locale)) return null;
  const entries = [
    { name: { en: 'Home', zh: '首页', es: 'Inicio' }[locale], path: '/' },
    ...(path.startsWith('/blog/') ? [{ name: { en: 'Blog', zh: '博客', es: 'Blog' }[locale], path: '/blog' }] : []),
    { name: title, path },
  ];
  return <StructuredData data={{ '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    '@id': `${absoluteUrl(localizedPath(path, locale))}#breadcrumb`,
    itemListElement: entries.map((entry, i) => ({ '@type': 'ListItem', position: i + 1,
      name: entry.name, item: absoluteUrl(localizedPath(entry.path, locale)) })),
  }} />;
}
