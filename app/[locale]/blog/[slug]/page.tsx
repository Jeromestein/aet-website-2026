import { renderContactReferences } from '@/lib/contact-html';
import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { routing } from '@/i18n/routing';
import { getPathname } from '@/i18n/navigation';
import { Navigation } from '@/components/navigation';
import { SiteFooter } from '@/components/site-footer';
import { PilotArticlePage } from '@/components/blog/pilot-article';
import pilot from '@/content/blog/boston-foreign-credential-evaluation-services.en.json';
import { articles, blogCopy, pilotSlug } from '@/lib/blog';
import { blogPosts } from '@/lib/blog-posts';
import styles from '@/components/blog/article.module.css';

type Props = { params: Promise<{ locale: string; slug: string }> };
const copy = {
  en: { back: 'Back to the blog', contents: 'In this article', evaluation: 'Explore evaluation services', contact: 'Contact AET' },
  zh: { back: '返回博客', contents: '文章目录', evaluation: '了解学历认证服务', contact: '联系 AET' },
  es: { back: 'Volver al blog', contents: 'En este artículo', evaluation: 'Explorar servicios de evaluación', contact: 'Contactar con AET' },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const entry = articles.find(article => article.slug === slug);
  if (!hasLocale(routing.locales, locale) || !entry) notFound();
  const post = slug === pilotSlug ? pilot : blogPosts[slug];
  if (!post) notFound();
  return {
    title: post.title, description: post.description,
    robots: locale !== 'en' ? { index: false, follow: true } : undefined,
    openGraph: { title: post.title, description: post.description, type: 'article', locale: 'en_US' },
  };
}

export default async function BlogArticlePage({ params }: Props) {
  const { locale, slug } = await params;
  const entry = articles.find(article => article.slug === slug);
  if (!hasLocale(routing.locales, locale) || !entry) notFound();
  if (slug === pilotSlug) return <PilotArticlePage params={params} />;
  const post = blogPosts[slug];
  if (!post) notFound();
  setRequestLocale(locale);
  const t = await getTranslations();
  const c = copy[locale];
  const index = <ol>{post.toc.map(section => <li key={section.id}><a href={`#${section.id}`} lang="en">{section.title}</a></li>)}</ol>;
  // All content is an offline, allowlisted import. Only known local link paths
  // are localized; external citations, images and source fragments stay intact.
  const body = renderContactReferences(post.html, locale, 'en').replace(/href="(\/(?!\/)[^"#?]*)([^\"]*)"/g, (match, path: string, suffix: string) => {
    if (!['/', '/contact', '/evaluation', '/certified-translation', '/expert-opinion-letters', '/general-translation'].includes(path) && !path.startsWith('/blog/')) return match;
    return `href="${getPathname({ locale, href: path })}${suffix}"`;
  });
  return <>
    <a className="skip-link" href="#main-content">{t('home.skip')}</a>
    <Navigation />
    <main id="main-content" className={styles.page}>
      <header className={styles.hero}><div className="wrap">
        <a className={styles.back} href={getPathname({ locale, href: '/blog' })}><ArrowLeft size={17} aria-hidden="true" />{c.back}</a>
        <div className={styles.heroCopy}>
          <span className="eyebrow">{blogCopy[locale].topics[entry.topic]}{entry.city && <> · <span lang="en">{entry.city}</span></>}</span>
          <h1 lang="en">{post.title}</h1>
        </div>
      </div></header>
      <div className={`wrap ${styles.layout}`}>
        <aside className={styles.sidebar}>
          {post.toc.length > 0 && <nav aria-label={c.contents}><p>{c.contents}</p>{index}</nav>}
          <a className={styles.serviceLink} href={getPathname({ locale, href: '/evaluation' })}>{c.evaluation}<ArrowRight size={18} aria-hidden="true" /></a>
        </aside>
        <div className={styles.body}>
          {post.toc.length > 0 && <details className={styles.mobileIndex}><summary>{c.contents}</summary><nav aria-label={c.contents}>{index}</nav></details>}
          <article aria-label={post.title} lang="en" className={styles.imported} dangerouslySetInnerHTML={{ __html: body }} />
          <div className={styles.closing}><a className="button" href={getPathname({ locale, href: '/contact' })}>{c.contact}<ArrowRight size={17} aria-hidden="true" /></a></div>
        </div>
      </div>
    </main>
    <SiteFooter />
  </>;
}
