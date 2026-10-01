import { officeGraph } from '@/lib/structured-data';
import { StructuredData } from '@/components/structured-data';
import { pageMetadata } from '@/lib/seo';
import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { getPathname } from '@/i18n/navigation';
import { contactPath, featuredOffices, officePath } from '@/lib/contact';
import { contactContent } from '@/lib/contact-content';
import { officeContent } from '@/lib/office-content';
import { ServicePage } from '@/components/service/service-page';
import { OfficeCard } from '@/components/offices/office-card';
import styles from './office.module.css';

type Props = { params: Promise<{ locale: string; slug: string }> };
export function generateStaticParams() {
  return routing.locales.flatMap(locale => featuredOffices.map(office => ({ locale, slug: office.slug! })));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const office = featuredOffices.find(office => office.slug === slug);
  if (!hasLocale(routing.locales, locale) || !office) notFound();
  const title = `${contactContent[locale].offices[office.id].name} | AET`;
  const description = officeContent[locale].regions[office.id as keyof typeof officeContent.en.regions];
  return pageMetadata({ path: `/offices/${slug}`, locale, title, description });
}
export default async function OfficePage({ params }: Props) {
  const { locale, slug } = await params;
  const office = featuredOffices.find(office => office.slug === slug);
  if (!hasLocale(routing.locales, locale) || !office) notFound();
  setRequestLocale(locale);
  const c = officeContent[locale];
  const contact = contactContent[locale];
  const name = contact.offices[office.id].name;
  const services = office.id === 'bj' ? c.beijingServices : c.serviceItems;
  return <ServicePage path={`/offices/${slug}`} locale={locale} title={name} label={name} eyebrow={contact.offices[office.id].title}
    nav={(['about', 'contact', 'services', 'history', 'guarantee'] as const).map(id => ({ id, label: c[id] }))}
    actions={[{ label: c.quote, href: '#contact' }, { label: c.all, href: contactPath(locale, 'offices') }]}>
    <StructuredData data={officeGraph(locale, [office])} />
    <section id="about" className={styles.section} aria-labelledby="about-title">
      <h2 id="about-title">{c.about}</h2>
      <p className={styles.lead}>{c.regions[office.id as keyof typeof c.regions]}</p><p>{c.intro}</p>
    </section>
    <section id="contact" className={styles.section} aria-labelledby="contact-title">
      <h2 id="contact-title">{c.contact}</h2>
      <OfficeCard office={office} content={contact} locale={locale} expanded />
      <p className={styles.note}>{contact.introHeading}</p>
      <div className={styles.methods}>{contact.options.map(option => <div key={option.title}><h3>{option.title}</h3><p>{option.body}</p></div>)}</div>
    </section>
    <section id="services" className={styles.section} aria-labelledby="services-title">
      <h2 id="services-title">{c.services}</h2><ul>{services.map(item => <li key={item}>{item}</li>)}</ul>
      <a className="button" href={getPathname({ locale, href: '/pricing' })}>{c.pricing}</a>
    </section>
    <section id="history" className={styles.section} aria-labelledby="history-title">
      <h2 id="history-title">{c.history}</h2><ul>{c.historyItems.map(item => <li key={item}>{item}</li>)}</ul>
    </section>
    <section id="guarantee" className={`${styles.section} ${styles.guarantee}`} aria-labelledby="guarantee-title">
      <h2 id="guarantee-title">{c.guarantee}</h2><ul>{[...c.promises, office.id === 'bj' ? c.coordination : c.evaluator].map(item => <li key={item}>{item}</li>)}</ul>
      <a className="button" href={`mailto:${office.emails[0]}`}>{c.quote}</a>
    </section>
    <nav className={styles.otherOffices} aria-label={contact.sections.offices}>
      {featuredOffices.filter(item => item.id !== office.id).map(item => <a key={item.id} href={officePath(locale, item)}>{contact.offices[item.id].name}</a>)}
    </nav>
  </ServicePage>;
}
