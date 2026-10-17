import schemaImages from '@/content/blog/schema-images.json';
import type { Locale } from '@/i18n/routing';
import { StructuredData } from '@/components/structured-data';
import { BreadcrumbStructuredData } from '@/components/breadcrumb-structured-data';
import { absoluteUrl, indexableLocales, localizedPath } from '@/lib/seo';
import { graph, organizationId, organizationSchema } from '@/lib/structured-data';

export function ArticleStructuredData({ locale, slug, title, description, publishedAt, imagePath }: {
  locale: Locale; slug: string; title: string; description: string; publishedAt: string | null;
  imagePath?: string;
}) {
  const path = `/blog/${slug}`;
  if (!indexableLocales(path).includes(locale)) return null;
  const url = absoluteUrl(localizedPath(path, locale));
  const language = locale === 'zh' ? 'zh-Hans' : locale;
  const image = imagePath ?? schemaImages[slug as keyof typeof schemaImages];
  return <>
    <BreadcrumbStructuredData path={path} locale={locale} title={title} />
    <StructuredData data={graph([
      organizationSchema(),
      { '@type': 'WebPage', '@id': `${url}#webpage`, url, name: title, inLanguage: language,
        mainEntity: { '@id': `${url}#article` } },
      { '@type': 'BlogPosting', '@id': `${url}#article`, url, headline: title, description,
        ...(image ? { image: absoluteUrl(image) } : {}),
        inLanguage: language, publisher: { '@id': organizationId },
        mainEntityOfPage: { '@id': `${url}#webpage` },
        // Undated sources remain undated; publishing a redesign is not a content revision.
        ...(publishedAt ? { datePublished: publishedAt } : {}),
      },
    ])} />
  </>;
}
