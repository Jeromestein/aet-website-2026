import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Users, Globe2, Clock3, MapPin, Mail, CreditCard } from 'lucide-react';
import { routing } from '@/i18n/routing';
import { contactPath } from '@/lib/contact';
import { ServicePage, ServiceCopy as Copy } from '@/components/service/service-page';
import { CardRail } from '@/components/card-rail';
import { BenefitCard } from '@/components/benefit-card';
import { PricingTable } from '@/components/pricing/pricing-table';
import { certifiedTranslationContent } from '@/lib/certified-translation';
import { certifiedTranslation, shipping } from '@/lib/pricing';
import styles from '@/components/service/service-page.module.css';

type Props = { params: Promise<{ locale: string }> };
const benefitIcons = [Users, Globe2, Clock3];
const applicationIcons = [MapPin, Mail, CreditCard];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const { title, description } = certifiedTranslationContent[locale];
  return { title, description, openGraph: { title, description } };
}

export default async function CertifiedTranslationPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations();
  const c = certifiedTranslationContent[locale];
  return <ServicePage locale={locale} title={c.title} label={t('navigation.certified')} nav={c.nav}
    actions={[{ label: t('home.contact'), href: contactPath(locale) }, { label: c.nav.find(item => item.id === 'apply')!.label, href: '#apply' }]}>
    {(['define', 'use'] as const).map(id => <section key={id} id={id} className={styles.section} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`}>{c[id].title}</h2><Copy html={c[id].html} />
    </section>)}
    <section id="aet" className={styles.section} aria-labelledby="aet-title">
      <h2 id="aet-title">{c.why.title}</h2><Copy html={c.why.html} className={styles.certificateCopy} />
      <CardRail className={styles.cards} label={c.why.title}>{c.why.cards.map((card, i) => {
        const Icon = benefitIcons[i];
        return <BenefitCard data-rail-card key={card.title} title={card.title} visual={<Icon aria-hidden="true" />}><Copy html={card.html} /></BenefitCard>;
      })}</CardRail>
    </section>
    <section id="price" className={styles.section} aria-labelledby="price-title">
      <h2 id="price-title">{c.fees.title}</h2>
      <PricingTable rates={certifiedTranslation} caption={c.fees.title} />
      <Copy html={c.fees.html} />
    </section>
    <section id="apply" className={styles.section} aria-labelledby="apply-title">
      <h2 id="apply-title">{c.apply.title}</h2>
      <CardRail className={styles.cards} label={c.apply.title}>{c.apply.cards.map((card, i) => {
        const Icon = applicationIcons[i];
        return <BenefitCard data-rail-card key={card.title} title={card.title} visual={<Icon aria-hidden="true" />}><Copy html={card.html} /></BenefitCard>;
      })}</CardRail>
    </section>
    <details id="shipping-options" className={`${styles.section} ${styles.disclosure}`}>
      <summary>{c.shipping.title}</summary><div id="shipping">
        {c.shipping.groups.map((title, i) => <div className={styles.rateGroup} key={title}><h3>{title}</h3><PricingTable rates={shipping.filter(rate => rate.id.startsWith(i === 0 ? 'domestic' : 'international'))} caption={title} showTracking /></div>)}
        <Copy html={c.shipping.html} />
      </div>
    </details>
    {(['areas', 'langs'] as const).map(id => <section key={id} id={id} className={styles.section} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`}>{c[id].title}</h2><Copy html={c[id].html} className={id === 'areas' ? styles.coverage : ''} />
    </section>)}
    <section id="faq" className={styles.section} aria-labelledby="faq-title">
      <h2 id="faq-title">{c.faq.title}</h2>
      {c.faq.items.map(item => <details id={item.id} key={item.id} className={styles.faq}><summary>{item.question}</summary><Copy html={item.html} /></details>)}
      <Copy html={c.faq.closingHtml} />
    </section>
  </ServicePage>;
}
