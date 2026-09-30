import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Mail, MapPin, Phone } from 'lucide-react';
import { routing } from '@/i18n/routing';
import { ServicePage } from '@/components/service/service-page';
import { CardRail } from '@/components/card-rail';
import { offices, getOffice, otherContacts, phoneHref } from '@/lib/contact';
import { contactContent } from '@/lib/contact-content';
import { OfficeCard } from '@/components/offices/office-card';
import styles from './contact.module.css';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const { title, description } = contactContent[locale];
  return { title, description, openGraph: { title, description } };
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations();
  const c = contactContent[locale];
  const nav = [
    { id: 'how', label: c.sections.how },
    { id: 'offices', label: c.sections.offices },
    ...offices.map(office => ({ id: office.id, label: c.offices[office.id].name, child: true })),
    { id: 'other', label: c.sections.other },
  ];
  return <ServicePage locale={locale} title={c.title} label={t('navigation.contact')} eyebrow={c.eyebrow} nav={nav}
    actions={[{ label: c.findOffice, href: '#offices' }]}>
    <section id="how" className={styles.section} aria-labelledby="contact-how-title">
      <h2 id="contact-how-title">{c.sections.how}</h2><p className={styles.intro}>{c.introHeading}</p>
      <CardRail className={styles.methods} label={c.sections.how}>{c.options.map((option, i) => <article data-rail-card className={styles.method} key={option.title}>
        {i === 0 ? <Mail size={26} aria-hidden="true" /> : <MapPin size={26} aria-hidden="true" />}
        <h3>{option.title}</h3><p>{option.body}</p>
      </article>)}</CardRail>
      {c.priority && <p className={styles.priority}><Phone size={19} aria-hidden="true" />{c.priority}: <a href={phoneHref(otherContacts.spanish.phone)}>{otherContacts.spanish.phone}</a></p>}
    </section>
    <section id="offices" className={styles.section} aria-labelledby="contact-offices-title">
      <h2 id="contact-offices-title">{c.sections.offices}</h2>
      <nav className={styles.officeLinks} aria-label={c.sections.offices}>
        {offices.map(office => <a key={office.id} href={`#${office.id}`}>{c.offices[office.id].name}</a>)}
      </nav>
      <CardRail className={styles.offices} label={c.sections.offices}>{offices.map(office => <OfficeCard key={office.id} office={office} content={c} locale={locale} />)}</CardRail>
    </section>
    <section id="other" className={styles.section} aria-labelledby="contact-other-title">
      <h2 id="contact-other-title">{c.other.title}</h2>
      <div className={styles.otherGrid}>
        <article id="other-contact"><h3>{c.other.nyc}</h3><p><a href={phoneHref(getOffice('nyc').phones[0])}>{getOffice('nyc').phones[0]}</a><br /><a href={`mailto:${getOffice('nyc').emails[0]}`}>{getOffice('nyc').emails[0]}</a></p></article>
        <article><h3>{c.other.taiyuan}</h3><p><a href={phoneHref(otherContacts.taiyuan.phone)}>{otherContacts.taiyuan.phone}</a><br />{c.other.mobile}: <a href={phoneHref(otherContacts.taiyuan.mobile)}>{otherContacts.taiyuan.mobile}</a><br /><a href={`mailto:${otherContacts.taiyuan.email}`}>{otherContacts.taiyuan.email}</a></p></article>
      </div>
    </section>
  </ServicePage>;
}
