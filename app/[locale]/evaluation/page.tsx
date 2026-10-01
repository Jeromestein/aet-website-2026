import { ServiceStructuredData } from '@/components/service/service-structured-data';
import { pageMetadata } from '@/lib/seo';
import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { GraduationCap, ListOrdered, BriefcaseBusiness, FileCheck2, Clock3, CreditCard, ShieldCheck } from 'lucide-react';
import { routing } from '@/i18n/routing';
import { getPathname } from '@/i18n/navigation';
import { contactPath } from '@/lib/contact';
import { ServicePage, ServiceCopy as Copy } from '@/components/service/service-page';
import { ProcessStory } from '@/components/scroll-stories';
import { InstitutionCarousel } from '@/components/institution-carousel';
import { CardRail } from '@/components/card-rail';
import { BenefitCard } from '@/components/benefit-card';
import { PricingTable } from '@/components/pricing/pricing-table';
import { evaluationContent } from '@/lib/evaluation';
import { evaluationGroups, preEvaluation, shipping, documentEvaluationStandard, evaluationExtraCopy, pricingPolicy } from '@/lib/pricing';
import { formatMoney, formatPrice } from '@/lib/pricing-format';
import styles from '@/components/service/service-page.module.css';

type Props = { params: Promise<{ locale: string }> };

const application = 'https://app.americantranslationservice.com/credential-evaluation-application';
const icons = [GraduationCap, ListOrdered, BriefcaseBusiness, FileCheck2];
const benefitIcons = [BriefcaseBusiness, CreditCard, Clock3, ShieldCheck];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const { title, description } = evaluationContent[locale];
  return pageMetadata({ path: '/evaluation', locale, title, description });
}

export default async function EvaluationPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations();
  const pricing = await getTranslations('pricing');
  const c = evaluationContent[locale];
  const replacements: Record<string, string> = {
    documentPrice: formatMoney(documentEvaluationStandard.price, locale),
    extraCopyPrice: formatPrice(evaluationExtraCopy, locale, pricing),
    standardDays: String(documentEvaluationStandard.businessDays),
    cutoff: pricingPolicy.sameDayCutoff,
  };
  const copy = (html: string) => html.replace(/\{\{(\w+)\}\}/g, (_, key: string) => replacements[key] ?? '');
  const groups = [...evaluationGroups, { id: 'preEvaluation', rates: preEvaluation }];

  return <ServicePage path={'/evaluation'} locale={locale} title={c.title} label={t('navigation.evaluation')} eyebrow={c.eyebrow} nav={c.nav}
    actions={[{ label: t('home.hero.apply'), href: application }, { label: t('home.contact'), href: contactPath(locale) }]}>
    <ServiceStructuredData service={'evaluation'} locale={locale} />
          <section id="define" aria-labelledby="define-title" className={styles.section}>
            <h2 id="define-title">{c.define.title}</h2><Copy html={c.define.html} />
          </section>
          <div className={styles.section}>
            <ProcessStory id="steps" variant="embedded" />
            <Copy html={c.applicationNotesHtml} className={styles.applicationNotes} />
          </div>
          <section id="service" aria-labelledby="service-title" className={styles.section}>
            <h2 id="service-title">{c.types.title}</h2>
            <CardRail className={styles.cards} label={c.types.title}>{c.types.items.map((item, i) => {
              const Icon = icons[i];
              return <article data-rail-card className={styles.card} key={item.title}><Icon size={30} aria-hidden="true" /><h3>{item.title}</h3><Copy html={item.html} /></article>;
            })}</CardRail>
          </section>
          <section id="aet" aria-labelledby="aet-title" className={styles.section}>
            <h2 id="aet-title">{c.why.title}</h2>
            <CardRail className={styles.benefits} label={c.why.title}>
              {c.why.rows.filter(row => c.why.columns.length === 1 || row.values.length === 1).map(row => {
                const Icon = benefitIcons[c.why.rows.indexOf(row)];
                return <BenefitCard data-rail-card key={row.label} title={row.label} visual={<Icon aria-hidden="true" />}>
                  <Copy html={copy(row.values[0])} />
                </BenefitCard>;
              })}
            </CardRail>
            {c.why.columns.length > 1 && <div className={styles.comparison} role="region" aria-label={c.why.title} tabIndex={0}>
              <table><thead><tr><th scope="col"><span className={styles.srOnly}>{c.why.title}</span></th>{c.why.columns.map(column => <th key={column} scope="col">{column}</th>)}</tr></thead>
                <tbody>{c.why.rows.filter(row => row.values.length > 1).map(row => <tr key={row.label}>
                  <th scope="row">{row.label}</th>{row.values.map((value, i) => <td key={i}><Copy html={copy(value)} /></td>)}
                </tr>)}</tbody>
              </table>
            </div>}
          </section>
          <section id="price" aria-labelledby="price-title" className={styles.section}>
            <h2 id="price-title">{c.fees.title}</h2>
            {groups.map(group => {
              const label = c.fees.groups.find(item => item.id === group.id)!;
              return <div className={styles.rateGroup} key={group.id}>
                <h3 dangerouslySetInnerHTML={{ __html: label.html }} />
                <PricingTable rates={group.rates} caption={pricing(`services.${group.id}`)} showService={false} />
              </div>;
            })}
            <Copy html={copy(c.fees.noteHtml)} />
            <a className="button" href={getPathname({ locale, href: '/pricing' })}>{pricing('title')}</a>
          </section>
          <details id="shipping-options" className={`${styles.section} ${styles.disclosure}`}>
            <summary>{c.shipping.title}</summary><div id="shipping">
              {c.shipping.groups.map((title, i) => <div className={styles.rateGroup} key={title}><h3>{title}</h3><PricingTable rates={shipping.filter(rate => rate.id.startsWith(i === 0 ? 'domestic' : 'international'))} caption={title} showTracking /></div>)}
              <Copy html={c.shipping.noteHtml} />
            </div>
          </details>
          <section id="blog-list" aria-labelledby="blog-title" className={styles.section}>
            <h2 id="blog-title">{c.blog.title}</h2><div id="blog"><Copy html={c.blog.html} /></div>
          </section>
          <section id="sample" aria-labelledby="sample-title" className={styles.section}>
            <h2 id="sample-title">{c.samples.title}</h2><Copy html={c.samples.html} className={styles.sampleLinks} />
          </section>
          <InstitutionCarousel id="partners" variant="embedded" title={c.partners.title} contactLabel={t('home.contact')} />
  </ServicePage>;
}
