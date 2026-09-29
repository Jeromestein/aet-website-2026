import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react';
import { routing } from '@/i18n/routing';
import { ServicePage } from '@/components/service/service-page';
import { CardRail } from '@/components/card-rail';
import { offices, type Office } from '@/lib/contact';
import { contactContent, type ContactContent } from '@/lib/contact-content';
import styles from './contact.module.css';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const { title, description } = contactContent[locale];
  return { title, description, openGraph: { title, description } };
}

function phoneHref(phone: string) {
  return `tel:${phone.replace(/[^+\d]/g, '')}`;
}

function OfficeCard({ office, content, locale }: { office: Office; content: ContactContent; locale: string }) {
  const copy = content.offices[office.id];
  const address = locale === 'zh' ? office.addressZh ?? office.address : locale === 'es' ? office.addressEs ?? office.address : office.address;
  return <article data-rail-card id={office.id} className={styles.office} aria-labelledby={`${office.id}-title`}>
    <div className={styles.officeHead}><MapPin size={23} aria-hidden="true" /><h3 id={`${office.id}-title`}>{copy.title}</h3></div>
    <dl className={styles.facts}>
      <div><dt>{content.labels.phone}</dt><dd>{office.phones.map((phone, i) => <span key={phone}><a href={phoneHref(phone)}>{phone}</a>{copy.phoneNotes?.[i] && <small>{copy.phoneNotes[i]}</small>}</span>)}</dd></div>
      <div><dt>{content.labels.email}</dt><dd>{office.emails.map(email => <a key={email} href={`mailto:${email}`}>{email}</a>)}</dd></div>
      <div><dt>{content.labels.address}</dt><dd><address>{address}</address><a className={styles.directions} href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(office.address)}`} target="_blank" rel="noopener noreferrer">{content.labels.directions}<ArrowUpRight size={15} aria-hidden="true" /></a></dd></div>
      {copy.hours && <div><dt>{content.labels.hours}</dt><dd>{copy.hours}</dd></div>}
    </dl>
    {(office.whatsapp || office.wechat || office.tollFreeChina || office.fax || office.qq) && <details className={styles.more}><summary>{content.labels.more}</summary><dl>
      {office.whatsapp && <div><dt>{content.labels.whatsapp}</dt><dd>{office.whatsapp}</dd></div>}
      {office.wechat && <div><dt>{content.labels.wechat}</dt><dd>{office.wechat}</dd></div>}
      {office.tollFreeChina && <div><dt>{content.labels.tollFreeChina}</dt><dd>{office.tollFreeChina}</dd></div>}
      {office.fax && <div><dt>{content.labels.fax}</dt><dd>{office.fax}</dd></div>}
      {office.qq && <div><dt>{content.labels.qq}</dt><dd>{office.qq}</dd></div>}
    </dl></details>}
  </article>;
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
      {c.priority && <p className={styles.priority}><Phone size={19} aria-hidden="true" />{c.priority}: <a href="tel:+17866106133">+1 786-610-6133</a></p>}
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
        <article id="other-contact"><h3>{c.other.nyc}</h3><p><a href="tel:+17185216708">+1 718-521-6708</a><br /><a href="mailto:nyc@aet21.com">nyc@aet21.com</a></p></article>
        <article><h3>{c.other.taiyuan}</h3><p><a href="tel:+863512815866">0351 2815866</a><br />{c.other.mobile}: <a href="tel:+8618734590999">18734590999</a><br /><a href="mailto:shanxi@aet21.com">shanxi@aet21.com</a></p></article>
      </div>
    </section>
  </ServicePage>;
}
