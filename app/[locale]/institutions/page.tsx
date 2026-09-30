import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ArrowDown, ArrowUpRight, ClipboardCheck } from 'lucide-react';
import { routing } from '@/i18n/routing';
import { getPathname } from '@/i18n/navigation';
import { Navigation } from '@/components/navigation';
import { SiteFooter } from '@/components/site-footer';
import { InstitutionDirectory } from '@/components/institutions/institution-directory';
import { institutionDirectory, directoryCopy } from '@/lib/institution-directory';
import styles from '@/components/institutions/institutions.module.css';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const { title, intro: description } = institutionDirectory[locale];
  return { title, description, openGraph: { title, description } };
}

export default async function InstitutionsPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations();
  const content = institutionDirectory[locale];
  const copy = directoryCopy[locale];

  return <>
    <a className="skip-link" href="#main-content">{t('home.skip')}</a>
    <Navigation />
    <main id="main-content" className={styles.page}>
      <header className={styles.hero}><div className="wrap">
        <nav className={styles.breadcrumb} aria-label={t('pricing.breadcrumb')}>
          <a href={getPathname({ locale, href: '/' })}>{t('navigation.home')}</a><span aria-hidden="true">/</span><span aria-current="page">{copy.label}</span>
        </nav>
        <div className={styles.heroGrid}><div>
          <span className="eyebrow">{copy.eyebrow}</span><h1>{copy.heading}</h1>
          <p className={styles.intro}>{content.intro}</p>
          <a className={styles.explore} href="#directory">{copy.summary}<ArrowDown size={19} aria-hidden="true" /></a>
        </div><aside className={styles.guidance} aria-labelledby="before-applying">
          <ClipboardCheck size={32} strokeWidth={1.4} aria-hidden="true" />
          <h2 id="before-applying">{copy.qualification}</h2><p>{copy.qualificationText}</p>
          <a href={getPathname({ locale, href: '/contact' })}>{copy.contact}<ArrowUpRight size={18} aria-hidden="true" /></a>
        </aside></div>
      </div></header>
      <InstitutionDirectory sections={content.sections} copy={copy} />
      <section className={styles.closing}><div className={`wrap ${styles.closingInner}`}>
        <div><span className="eyebrow">{copy.eyebrow}</span><h2>{copy.closingTitle}</h2><p>{content.closing}</p></div>
        <a className="button" href={content.applyUrl}>{copy.apply}<ArrowUpRight size={20} aria-hidden="true" /></a>
      </div></section>
    </main>
    <SiteFooter />
  </>;
}
