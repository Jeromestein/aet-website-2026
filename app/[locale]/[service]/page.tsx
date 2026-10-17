import { renderVisaPrices } from '@/lib/visa';
import { VisaPricing } from '@/components/pricing/visa-pricing';
import { serviceDescription } from '@/lib/service-descriptions';
import { ServiceStructuredData } from '@/components/service/service-structured-data';
import { pageMetadata } from '@/lib/seo';
import type { Metadata } from 'next';
import { hasLocale, useLocale, useTranslations } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Languages } from 'lucide-react';
import { routing } from '@/i18n/routing';
import { getPathname } from '@/i18n/navigation';
import { contactPath } from '@/lib/contact';
import { getOtherServiceContent, serviceSlugs, type ServiceSlug, type ServiceSection } from '@/lib/other-services';
import { interpretation, expertOpinion, generalTranslation, shipping, visaFees } from '@/lib/pricing';
import { ServicePage, ServiceCopy } from '@/components/service/service-page';
import { PricingTable } from '@/components/pricing/pricing-table';
import { InstitutionCarousel } from '@/components/institution-carousel';
import { CardRail } from '@/components/card-rail';
import { BenefitCard } from '@/components/benefit-card';
import styles from '@/components/service/service-page.module.css';

type Props = { params: Promise<{ locale: string; service: string }> };

const serviceLabels = {
  'technical-translation': 'technical', interpretation: 'interpretation',
  'expert-opinion-letters': 'expert', 'general-translation': 'general', notarization: 'notarization', 'visa-service': 'visa',
} as const;

function validService(value: string): value is ServiceSlug {
  return serviceSlugs.some(slug => slug === value);
}

export function generateStaticParams() {
  return routing.locales.flatMap(locale => serviceSlugs.map(service => ({ locale, service })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, service } = await params;
  if (!hasLocale(routing.locales, locale) || !validService(service)) notFound();
  const { content } = getOtherServiceContent(service, locale);
  const description = serviceDescription(service, locale);
  return pageMetadata({ path: `/${service}`, locale, title: content.title, description });
}

function SectionContent({ service, section }: { service: ServiceSlug; section: ServiceSection }) {
  const pricing = useTranslations('pricing');
  const locale = useLocale() as (typeof routing.locales)[number];
  if (service === 'visa-service') return <>
    {section.id === 'apply' && <aside className={styles.languageNotice} lang="en"><strong>(New) High quality ID photo service</strong><br />For ${visaFees.photoFour}: you get 2 US + 2 China Passport / Visa photos!<br />Also take ID photos for over 100 countries.</aside>}
    <div className={styles.copy} dangerouslySetInnerHTML={{ __html: renderVisaPrices(section.html) }} />
  </>;
  if (section.id === 'partners') return null;
  if (service === 'expert-opinion-letters' && section.id === 'shipping-options') return <>
    <div id="shipping">
      {(['domestic', 'international'] as const).map(prefix => <div className={styles.rateGroup} key={prefix}>
        <h3>{pricing(`shippingGroups.${prefix}`)}</h3>
        <PricingTable rates={shipping.filter(rate => rate.id.startsWith(prefix))} caption={prefix} showTracking />
      </div>)}
      <ServiceCopy html={section.html} />
    </div>
  </>;
  if (section.id === 'price' && service === 'interpretation') return <>
    <PricingTable rates={interpretation} caption={section.title} showTime={false} showNotes />
    <ServiceCopy html={section.html} />
    {section.scenarios && <CardRail className={styles.cards} label={section.title}>
      {section.scenarios.map((html, index) => <BenefitCard data-rail-card key={index} title={pricing(`services.${['personal', 'business', 'simultaneous', 'telephone'][index]}`)} visual={<Languages aria-hidden="true" />}><p>{html}</p></BenefitCard>)}
    </CardRail>}
  </>;
  if (section.id === 'price' && service === 'expert-opinion-letters') return <>
    <PricingTable rates={expertOpinion} caption={section.title} />
    <ServiceCopy html={section.html} />
  </>;
  if (section.id === 'price' && service === 'general-translation') return <>
    <PricingTable rates={generalTranslation} caption={section.title} showTime={false} />
    <p className={styles.pricingNote}>{pricing('notes.general')}</p>
    <ServiceCopy html={section.html} />
  </>;
  if (section.id === 'aet' && service === 'interpretation') return <CardRail className={styles.cards} label={section.title}>
    {section.html.match(/<p>[\s\S]*?<\/p>/g)?.map((html, index) => <BenefitCard data-rail-card key={index} title={String(index + 1).padStart(2, '0')} visual={<Languages aria-hidden="true" />}><ServiceCopy html={html} /></BenefitCard>)}
  </CardRail>;
  const html = service === 'general-translation' && section.id === 'define'
    ? section.html.replace('href="/certified-translation"', `href="${getPathname({ locale, href: '/certified-translation' })}"`)
    : section.html;
  return <ServiceCopy html={html} className={service === 'technical-translation' && section.id === 'intro' ? styles.illustrated : service === 'expert-opinion-letters' && section.id === 'service' ? styles.fieldList : ''} />;
}

export default async function OtherServicePage({ params }: Props) {
  const { locale, service } = await params;
  if (!hasLocale(routing.locales, locale) || !validService(service)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations();
  const { content, hasLocaleContent } = getOtherServiceContent(service, locale);
  const sections = content.sections.filter(section => section.id !== 'blog-list' || service === 'expert-opinion-letters');
  const actionId = service === 'visa-service' ? 'apply' : service === 'interpretation' ? 'area' : service === 'expert-opinion-letters' ? 'steps' : service === 'general-translation' ? 'price' : 'sign';
  const action = service === 'technical-translation' ? { label: content.sections.find(section => section.id === 'apply')!.title, href: 'mailto:tech@americantranslationservice.com' }
    : { label: content.sections.find(section => section.id === actionId)?.title ?? t('home.contact'), href: `#${actionId}` };

  return <ServicePage path={`/${service}`} locale={locale} title={content.title} titleLang={hasLocaleContent ? undefined : 'en'} label={t(`navigation.${serviceLabels[service]}`)}
    nav={[...sections.map(({ id, title }) => ({ id, label: title })), ...(service === 'visa-service' ? [{ id: 'price', label: t('pricing.title') }] : [])]}
    actions={[action, { label: t('home.contact'), href: contactPath(locale) }]}>
    <ServiceStructuredData service={service} locale={locale} />
    {!hasLocaleContent && <p className={styles.languageNotice} lang="es">El contenido de este servicio está disponible en inglés; la traducción al español aún no está disponible.</p>}
    <div lang={hasLocaleContent ? undefined : 'en'}>{sections.map(section => section.id === 'shipping-options' ? <details key={section.id} id={section.id} className={`${styles.section} ${styles.disclosure}`}>
      <summary>{section.title}</summary><SectionContent service={service} section={section} />
    </details> : section.id === 'blog-list' ? <details key={section.id} id={section.id} className={`${styles.section} ${styles.disclosure}`}>
      <summary>{section.title}</summary><ServiceCopy html={section.html} />
    </details> : section.id === 'partners'
      ? <InstitutionCarousel key={section.id} id={section.id} variant="embedded" title={section.title} contactLabel={t('home.contact')} />
      : <section key={section.id} id={section.id} className={styles.section} aria-labelledby={`${section.id}-title`}>
        <h2 id={`${section.id}-title`}>{section.title}</h2><SectionContent service={service} section={section} />
      </section>)}</div>
    {service === 'visa-service' && <section id="price" className={styles.section} aria-labelledby="visa-price-title"><h2 id="visa-price-title">{t('pricing.title')}</h2><VisaPricing /></section>}
  </ServicePage>;
}
