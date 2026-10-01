import { BreadcrumbStructuredData } from '@/components/breadcrumb-structured-data';
import { pageMetadata } from '@/lib/seo';
import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { getPathname } from '@/i18n/navigation';
import { getLegalContent, type LegalDocument } from '@/lib/legal';
import { Navigation } from '@/components/navigation';
import { SiteFooter } from '@/components/site-footer';
import styles from './legal-page.module.css';

export type LegalPageProps = { params: Promise<{ locale: string }> };

export async function legalMetadata(document: LegalDocument, { params }: LegalPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const content = getLegalContent(document);
  const t = await getTranslations({ locale });
  const title = t(`footer.${document}`);
  const description = `${content.title} — American Education and Translation Services (AET).`;
  return pageMetadata({ path: `/${document}`, locale, title, description });
}

export async function LegalPage({ document, params }: LegalPageProps & { document: LegalDocument }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations();
  const content = getLegalContent(document);
  const title = t(`footer.${document}`);
  const index = <ol lang="en">{content.sections.map(section =>
    <li key={section.id}><a href={`#${section.id}`}>{section.title}</a></li>)}</ol>;

  return <>
    <BreadcrumbStructuredData path={`/${document}`} locale={locale} title={title} />
    <a className="skip-link" href="#main-content">{t('home.skip')}</a>
    <Navigation />
    <main id="main-content" className={styles.page}>
      <header className={styles.hero}><div className="wrap">
        <nav className={styles.breadcrumb} aria-label={t('pricing.breadcrumb')}>
          <a href={getPathname({ locale, href: '/' })}>{t('navigation.home')}</a>
          <span aria-hidden="true">/</span><span aria-current="page">{title}</span>
        </nav>
        <h1>{title}</h1>
      </div></header>
      <div className={`wrap ${styles.layout}`}>
        <nav className={styles.desktopIndex} aria-label={t('pricing.onPage')}>
          <p>{t('pricing.onPage')}</p>{index}
        </nav>
        <div className={styles.content}>
          <details className={styles.mobileIndex}>
            <summary>{t('pricing.onPage')}</summary>
            <nav aria-label={t('pricing.onPage')}>{index}</nav>
          </details>
          <article lang="en" aria-label={content.title}>
            {content.sections.map(section => <section key={section.id} id={section.id}
              className={styles.section} aria-labelledby={`${section.id}-title`}>
              <h2 id={`${section.id}-title`}>{section.title}</h2>
              {/* Only reviewed, checked-in legacy legal text is rendered here. */}
              <div className={styles.copy} dangerouslySetInnerHTML={{ __html: section.html }} />
            </section>)}
          </article>
        </div>
      </div>
    </main>
    <SiteFooter />
  </>;
}
