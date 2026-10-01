import type { MetadataRoute } from 'next';
import inventory from '@/content/blog/articles.json';
import { featuredOffices } from '@/lib/contact';
import { serviceSlugs } from '@/lib/other-services';
import { absoluteUrl, indexableLocales, languageAlternates, localizedPath } from '@/lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    '/', '/about', '/contact', '/institutions', '/pricing', '/evaluation',
    '/certified-translation', '/payment', '/blog', '/career', '/privacy', '/terms',
    ...serviceSlugs.map(slug => `/${slug}`),
    ...featuredOffices.map(office => `/offices/${office.slug}`),
    ...inventory.map(article => `/blog/${article.slug}`),
  ];
  // No lastModified until actual content revision dates are available.
  return paths.flatMap(path => indexableLocales(path).map(locale => ({
    url: absoluteUrl(localizedPath(path, locale)),
    alternates: { languages: languageAlternates(path) },
  })));
}
