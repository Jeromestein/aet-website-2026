import type { Metadata } from 'next';
import Image from 'next/image';
import { Fragment } from 'react';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { GraduationCap, ListOrdered, BriefcaseBusiness, FileCheck2 } from 'lucide-react';
import { routing } from '@/i18n/routing';
import { getPathname } from '@/i18n/navigation';
import { Navigation } from '@/components/navigation';
import { SiteFooter } from '@/components/site-footer';
import { ProcessStory } from '@/components/scroll-stories';
import { PricingTable } from '@/components/pricing/pricing-table';
import { evaluationContent } from '@/lib/evaluation';
import { evaluationGroups, preEvaluation, shipping, documentEvaluationStandard, evaluationExtraCopy, pricingPolicy } from '@/lib/pricing';
import { formatMoney, formatPrice } from '@/lib/pricing-format';
import styles from '@/components/evaluation/evaluation.module.css';

type Props = { params: Promise<{ locale: string }> };
const contact = 'https://www.americantranslationservice.com/e-contact.php';
const application = 'https://app.americantranslationservice.com/credential-evaluation-application';
const icons = [GraduationCap, ListOrdered, BriefcaseBusiness, FileCheck2];

/** HTML is restricted, checked-in copy extracted from the legacy content files. */
function Copy({ html, className = '' }: { html: string; className?: string }) {
  return <div className={`${styles.copy} ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const { title, description } = evaluationContent[locale];
  return { title, description, openGraph: { title, description } };
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

  return <>
    <a className="skip-link" href="#main-content">{t('home.skip')}</a>
    <Navigation />
    <main id="main-content" className={styles.page}>
      <header className={styles.hero}><div className="wrap"><div className={styles.heroInner}>
        <nav className={styles.breadcrumb} aria-label={pricing('breadcrumb')}>
          <a href={getPathname({ locale, href: '/' })}>{t('navigation.home')}</a><span aria-hidden="true">/</span><span aria-current="page">{t('navigation.evaluation')}</span>
        </nav>
        <span className="eyebrow">{c.eyebrow}</span>
        <h1>{c.title}</h1>
        <div className={styles.actions}><a className="button primary" href={application}>{t('home.hero.apply')}</a><a className="button" href={contact}>{t('home.contact')}</a></div>
      </div></div></header>
      <div className={`wrap ${styles.layout}`}>
        <nav className={styles.index} aria-label={pricing('onPage')}>
          <p>{pricing('onPage')}</p>
          {c.nav.map((item, i) => <a key={item.id} href={`#${item.id}`}><span aria-hidden="true">0{i + 1}</span>{item.label}</a>)}
        </nav>
        <div className={styles.content}>
          <section id="define" aria-labelledby="define-title" className={styles.section}>
            <h2 id="define-title">{c.define.title}</h2><Copy html={c.define.html} />
          </section>
          <div className={styles.section}>
            <ProcessStory id="steps" variant="embedded" />
            <Copy html={c.applicationNotesHtml} className={styles.applicationNotes} />
          </div>
          <section id="service" aria-labelledby="service-title" className={styles.section}>
            <h2 id="service-title">{c.types.title}</h2>
            <div className={styles.cards}>{c.types.items.map((item, i) => {
              const Icon = icons[i];
              return <article className={styles.card} key={item.title}><Icon size={30} aria-hidden="true" /><h3>{item.title}</h3><Copy html={item.html} /></article>;
            })}</div>
          </section>
          <section id="aet" aria-labelledby="aet-title" className={styles.section}>
            <h2 id="aet-title">{c.why.title}</h2>
            {c.why.columns.length === 1 ? <div className={styles.facts}><h3>{c.why.columns[0]}</h3><dl>{c.why.rows.map(row => <Fragment key={row.label}><dt>{row.label}</dt><dd><Copy html={copy(row.values[0])} /></dd></Fragment>)}</dl></div>
              : <div className={styles.comparison} role="region" aria-label={c.why.title} tabIndex={0}><table><thead><tr><th scope="col"><span className={styles.srOnly}>{c.why.title}</span></th>{c.why.columns.map(column => <th key={column} scope="col">{column}</th>)}</tr></thead><tbody>{c.why.rows.map(row => <tr key={row.label}><th scope="row">{row.label}</th>{row.values.map((value, i) => <td key={i} colSpan={row.values.length === 1 ? c.why.columns.length : 1}><Copy html={copy(value)} /></td>)}</tr>)}</tbody></table></div>}
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
          <section id="partners" aria-labelledby="partners-title" className={styles.section}>
            <h2 id="partners-title">{c.partners.title}</h2>
            <a href={contact}><Image src="/images/FCE-Clients.jpg" alt={c.partners.alt} width={948} height={810} sizes="(max-width: 1000px) 100vw, 850px" className={styles.partners} /></a>
          </section>
        </div>
      </div>
    </main>
    <SiteFooter />
  </>;
}
