import { ArrowUpRight, MapPin } from 'lucide-react';
import type { Locale } from '@/i18n/routing';
import { officeAddress, officeDirections, officeHours, officePath, phoneHref, type Office } from '@/lib/contact';
import type { ContactContent } from '@/lib/contact-content';
import styles from './office-card.module.css';

export function OfficeCard({ office, content, locale, expanded = false }: { office: Office; content: ContactContent; locale: Locale; expanded?: boolean }) {
  const copy = content.offices[office.id];
  const address = officeAddress(office, locale);
  const hours = officeHours(office, locale);
  return <article data-rail-card id={office.id} className={`${styles.office} ${expanded ? styles.expanded : ""}`} aria-labelledby={`${office.id}-title`}>
    <div className={styles.officeHead}><MapPin size={23} aria-hidden="true" /><h3 id={`${office.id}-title`}>{copy.title}</h3></div>
    <dl className={styles.facts}>
      <div><dt>{content.labels.phone}</dt><dd>{office.phones.map((phone, i) => <span key={phone}><a href={phoneHref(phone)}>{phone}</a>{copy.phoneNotes?.[i] && <small>{copy.phoneNotes[i]}</small>}</span>)}</dd></div>
      <div><dt>{content.labels.email}</dt><dd>{office.emails.map(email => <a key={email} href={`mailto:${email}`}>{email}</a>)}</dd></div>
      <div><dt>{content.labels.address}</dt><dd><address>{address}</address><a className={styles.directions} href={officeDirections(office)} target="_blank" rel="noopener noreferrer">{content.labels.directions}<ArrowUpRight size={15} aria-hidden="true" /></a></dd></div>
      {hours && <div><dt>{content.labels.hours}</dt><dd>{hours}</dd></div>}
    </dl>
    {(office.whatsapp || office.wechat || office.tollFreeChina || office.fax || office.qq) && <details className={styles.more} open={expanded}><summary>{content.labels.more}</summary><dl>
      {office.whatsapp && <div><dt>{content.labels.whatsapp}</dt><dd><a href={`https://wa.me/${office.whatsapp.replace(/\D/g, "").replace(/^(?=\d{10}$)/, "1")}`} target="_blank" rel="noopener noreferrer">{office.whatsapp}</a></dd></div>}
      {office.wechat && <div><dt>{content.labels.wechat}</dt><dd>{office.wechat}</dd></div>}
      {office.tollFreeChina && <div><dt>{content.labels.tollFreeChina}</dt><dd>{office.tollFreeChina}</dd></div>}
      {office.fax && <div><dt>{content.labels.fax}</dt><dd>{office.fax}</dd></div>}
      {office.qq && <div><dt>{content.labels.qq}</dt><dd>{office.qq}</dd></div>}
    </dl></details>}
    {!expanded && office.slug && <a className={styles.detailLink} href={officePath(locale, office)}>{content.labels.officeDetails}<ArrowUpRight size={16} aria-hidden="true" /></a>}
  </article>;
}
