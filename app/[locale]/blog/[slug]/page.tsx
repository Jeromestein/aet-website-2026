import { ArticleStructuredData } from '@/components/blog/article-structured-data';
import { absoluteUrl, localizedPath, pageMetadata } from '@/lib/seo';
import { renderContactReferences } from '@/lib/contact-html';
import { contactPath } from '@/lib/contact';
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
import { getAuthoredPost } from '@/lib/authored-blog-posts';
import { authoredBlogCopy } from '@/lib/authored-blog-copy';
import { ArticleAiLinks } from '@/components/blog/article-ai-links';
import { ArticleInquiry } from '@/components/blog/article-inquiry';
import { ArticleAction } from '@/components/blog/article-action';
import { ArticleFigure } from '@/components/blog/article-figure';
import styles from '@/components/blog/article.module.css';
import authoredStyles from '@/components/blog/authored-article.module.css';

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
  const post = slug === pilotSlug ? pilot : getAuthoredPost(slug, locale) ?? blogPosts[slug];
  if (!post) notFound();
  return pageMetadata({ path: `/blog/${slug}`, locale, title: post.title, description: post.description, type: 'article' });
}

export default async function BlogArticlePage({ params }: Props) {
  const { locale, slug } = await params;
  const entry = articles.find(article => article.slug === slug);
  if (!hasLocale(routing.locales, locale) || !entry) notFound();
  const authored = getAuthoredPost(slug, locale);
  const post = slug === pilotSlug ? pilot : authored ?? blogPosts[slug];
  if (!post) notFound();
  const schema = <ArticleStructuredData locale={locale} slug={slug} title={post.title} description={post.description} publishedAt={entry.publishedAt} imagePath={authored?.leadImage?.src} />;
  if (slug === pilotSlug) return <>{schema}<PilotArticlePage params={params} /></>;
  const bodyPost = blogPosts[slug];
  setRequestLocale(locale);
  const t = await getTranslations();
  const c = copy[locale];
  const contentLocale = authored?.locale ?? 'en';
  const contentLanguage = contentLocale === 'zh' ? 'zh-Hans' : contentLocale;
  const articleCopy = authoredBlogCopy[contentLocale];
  const toc = authored ? [...authored.sections, { id: 'contact', title: authored.inquiry.title }] : bodyPost.toc;
  const index = <ol>{toc.map(section => <li key={section.id}><a href={`#${section.id}`} lang={contentLanguage}>{section.title}</a></li>)}</ol>;
  const mobileIndex = toc.length > 0 && <details className={styles.mobileIndex}><summary>{c.contents}</summary><nav aria-label={c.contents}>{index}</nav></details>;
  return <>
    {schema}
    <a className="skip-link" href="#main-content">{t('home.skip')}</a>
    <Navigation />
    <main id="main-content" className={styles.page}>
      <header className={styles.hero}><div className="wrap">
        <a className={styles.back} href={getPathname({ locale, href: '/blog' })}><ArrowLeft size={17} aria-hidden="true" />{c.back}</a>
        <div className={styles.heroCopy}>
          <span className="eyebrow">{blogCopy[locale].topics[entry.topic]}{entry.city && <> · <span lang="en">{entry.city}</span></>}</span>
          <h1 lang={contentLanguage}>{post.title}</h1>
          {authored && <div className={authoredStyles.intro} lang={contentLanguage}>
            <p>{authored.introduction}</p>
            <div className={authoredStyles.actions}>
              <ArticleAction className={`button ${authoredStyles.primary}`} href={contactPath(locale, authored.inquiry.office)}
                tracking={{ event: 'blog_contact_click', article_slug: slug, article_locale: contentLocale, method: 'contact_page', placement: 'intro' }}>{articleCopy.primary}</ArticleAction>
              <a className={authoredStyles.secondary} href="#documents">{articleCopy.documents}</a>
            </div>
            <span className={authoredStyles.reviewed}>{articleCopy.reviewed} <time dateTime={authored.reviewedAt}>{new Intl.DateTimeFormat(contentLocale, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${authored.reviewedAt}T12:00:00Z`))}</time></span>
          </div>}
        </div>
      </div></header>
      <div className={`wrap ${styles.layout}`}>
        <aside className={styles.sidebar}>
          {toc.length > 0 && <nav aria-label={c.contents}><p>{c.contents}</p>{index}</nav>}
          <a className={styles.serviceLink} href={getPathname({ locale, href: '/evaluation' })}>{c.evaluation}<ArrowRight size={18} aria-hidden="true" /></a>
        </aside>
        <div className={styles.body}>
          {authored ? <article aria-label={post.title} lang={contentLanguage}>
            <ArticleAiLinks slug={slug} question={authored.aiQuestion} locale={contentLocale} canonicalUrl={absoluteUrl(localizedPath(`/blog/${slug}`, contentLocale))} />
            {mobileIndex}
            {authored.leadImage && <ArticleFigure image={authored.leadImage} lead />}
            <div className={`${styles.imported} ${authoredStyles.prose}`}>
              {authored.sections.map(section => <section id={section.id} key={section.id} aria-labelledby={`${section.id}-title`}>
                <h2 id={`${section.id}-title`}>{section.title}</h2>
                <div dangerouslySetInnerHTML={{ __html: renderContactReferences(section.html, locale, contentLocale) }} />
                {section.image && <ArticleFigure image={section.image} />}
              </section>)}
            </div>
            <ArticleInquiry post={authored} locale={locale} />
          </article> : <>
            {mobileIndex}
            <article aria-label={post.title} lang="en" className={styles.imported} dangerouslySetInnerHTML={{ __html: renderContactReferences(bodyPost.html, locale, 'en') }} />
            <div className={styles.closing}><a className="button" href={getPathname({ locale, href: '/contact' })}>{c.contact}<ArrowRight size={17} aria-hidden="true" /></a></div>
          </>}
        </div>
      </div>
    </main>
    <SiteFooter />
  </>;
}
