import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { contactPath } from '@/lib/contact';
import { getPathname } from '@/i18n/navigation';
import { Navigation } from '@/components/navigation';
import { SiteFooter } from '@/components/site-footer';
import { PricingSection } from '@/components/pricing/pricing-section';
import { pricingSections, pricingAnchors } from '@/lib/pricing';
import styles from '@/components/pricing/pricing.module.css';

type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'pricing' });
  return { title: t('metaTitle'), description: t('description'), openGraph: { title: t('metaTitle'), description: t('description') } };
}
export default async function PricingPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations('pricing');
  const common = await getTranslations();
  return <>
    <a className="skip-link" href="#main-content">{common('home.skip')}</a>
    <Navigation />
    <main id="main-content" className={styles.page}>
      <div className={styles.hero}><div className="wrap">
        <nav className={styles.breadcrumb} aria-label={t('breadcrumb')}><a href={getPathname({ locale, href: '/' })}>{common('navigation.home')}</a><span aria-hidden="true">/</span><span aria-current="page">{t('title')}</span></nav>
        <span className="eyebrow">{t('eyebrow')}</span>
        <h1>{t('title')}</h1><p>{t('description')}</p>
        <div className={styles.heroBottom}><span className={styles.currency}>{t('currency')}</span><a className="button primary" href={contactPath(locale)}>{t('quote')}</a></div>
      </div></div>
      <div className={`wrap ${styles.layout}`}>
        <nav className={styles.index} aria-label={t('onPage')}><p>{t('onPage')}</p>{pricingSections.map((id, i) => <a key={id} href={`#${pricingAnchors[id]}`}><span aria-hidden="true">0{i + 1}</span>{t(`sections.${id}`)}</a>)}</nav>
        <div>{pricingSections.map(section => <PricingSection key={section} section={section} />)}
          <div className={styles.closing}><p>{t('notes.disclaimer')}</p><a className="button" href={contactPath(locale)}>{t('quote')}</a></div>
        </div>
      </div>
    </main>
    <SiteFooter />
  </>;
}
