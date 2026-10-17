import 'server-only';
import cslb from '@/content/blog/authored/cslb-foreign-credential-evaluation.json';
import cslbZh from '@/content/blog/authored/cslb-foreign-credential-evaluation.zh.json';
import cslbEs from '@/content/blog/authored/cslb-foreign-credential-evaluation.es.json';
import type { OfficeId } from '@/lib/contact';
import type { Locale } from '@/i18n/routing';

export type ArticleImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption: string;
  objectPosition?: string;
};

export type AuthoredPost = {
  slug: string;
  locale: Locale;
  title: string;
  description: string;
  introduction: string;
  reviewedAt: string;
  aiQuestion: string;
  leadImage?: ArticleImage;
  sections: { id: string; title: string; html: string; image?: ArticleImage }[];
  inquiry: {
    office: OfficeId;
    title: string;
    introduction: string;
    details: string[];
    notice: string;
  };
};

// Kept outside the generated legacy registry so imports never replace new prose.
const authoredPosts: Record<string, Partial<Record<Locale, AuthoredPost>> & { en: AuthoredPost }> = {
  [cslb.slug]: { en: cslb as AuthoredPost, zh: cslbZh as AuthoredPost, es: cslbEs as AuthoredPost },
};

export function getAuthoredPost(slug: string, locale: Locale): AuthoredPost | undefined {
  return authoredPosts[slug]?.[locale] ?? authoredPosts[slug]?.en;
}
