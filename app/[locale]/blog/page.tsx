import { BreadcrumbStructuredData } from '@/components/breadcrumb-structured-data';
import { pageMetadata } from '@/lib/seo';
import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { getPathname } from '@/i18n/navigation';
import { Navigation } from '@/components/navigation';
import { SiteFooter } from '@/components/site-footer';
import { BlogList } from '@/components/blog/blog-list';
import { articles, articleUrl, blogCopy, pilotSlug } from '@/lib/blog';
import { ArrowUpRight, BookOpen } from 'lucide-react';
import styles from '@/components/blog/blog.module.css';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const { title, description } = blogCopy[locale];
  return pageMetadata({ path: '/blog', locale, title, description });
}

export default async function BlogPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations();
  const copy = blogCopy[locale];
  const featured = articles.find(article => article.slug === pilotSlug)!;
  return <>
    <BreadcrumbStructuredData path={'/blog'} locale={locale} title={t('navigation.blog')} />
    <a className="skip-link" href="#main-content">{t('home.skip')}</a>
    <Navigation />
    <main id="main-content" className={styles.page}>
      <header className={styles.hero}><div className="wrap">
        <nav className={styles.breadcrumb} aria-label={t('pricing.breadcrumb')}>
          <a href={getPathname({ locale, href: '/' })}>{t('navigation.home')}</a><span aria-hidden="true">/</span><span aria-current="page">{t('navigation.blog')}</span>
        </nav>
        <div className={styles.heroGrid}><div>
          <span className="eyebrow">{copy.eyebrow}</span>
          <h1>{copy.title}</h1><p>{copy.description}</p>
        </div><a className={styles.featured} href={articleUrl(featured, locale)}>
          <span className={styles.featuredLabel}><BookOpen size={20} aria-hidden="true" />{copy.featured}</span>
          <h2 lang="en">Boston Foreign Credential Evaluation</h2>
          <p>{copy.featuredDescription}</p>
          <span className={styles.featuredAction}>{copy.read}<ArrowUpRight size={20} aria-hidden="true" /></span>
        </a></div>
      </div></header>
      <BlogList articles={articles} copy={copy} locale={locale} />
    </main>
    <SiteFooter />
  </>;
}
