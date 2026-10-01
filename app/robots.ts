import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  // Keep noindex pages crawlable so search engines can read their directives.
  return { rules: { userAgent: '*', allow: '/', disallow: '/api/' }, sitemap: absoluteUrl('/sitemap.xml') };
}
