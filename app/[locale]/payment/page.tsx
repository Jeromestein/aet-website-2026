import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ArrowUpRight, Building2, CreditCard, Mail, Send } from 'lucide-react';
import { routing, type Locale } from '@/i18n/routing';
import { contactPath } from '@/lib/contact';
import { paymentContent, paymentOffices, paymentServices, type PaymentContent } from '@/lib/payment';
import { shipping } from '@/lib/pricing';
import { PricingTable } from '@/components/pricing/pricing-table';
import { CardRail } from '@/components/card-rail';
import { ServicePage } from '@/components/service/service-page';
import styles from './payment.module.css';

type Props = { params: Promise<{ locale: string }> };
const serviceValues = ['翻译公证', '学位评估', '美国口译', '其他服务'] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const { title, description } = paymentContent[locale];
  return { title, description, openGraph: { title, description } };
}

function Field({ id, name, label, type = 'text', required = false, ...inputProps }: {
  id: string; name: string; label: string; type?: string; required?: boolean;
  autoComplete?: string; inputMode?: 'decimal' | 'email' | 'tel'; min?: string; step?: string;
}) {
  return <div className={styles.field}>
    <label htmlFor={id}>{label}{required && <span className={styles.asterisk} aria-hidden="true"> *</span>}</label>
    <input id={id} name={name} type={type} required={required} {...inputProps} />
  </div>;
}

function PaymentForm({ c, locale }: { c: PaymentContent; locale: Locale }) {
  const f = c.form;
  return <form className={styles.form} method="post" action="/api/payment/prepare" target="_blank" rel="noopener noreferrer">
    <p className={styles.formIntro}>{f.intro}</p>
    <div className={styles.fieldsThree}>
      <Field id="pay-name" name="custname" label={f.name} autoComplete="name" required />
      <Field id="pay-email" name="email" label={f.email} type="email" autoComplete="email" required />
      <Field id="pay-phone" name="phone" label={f.phone} type="tel" autoComplete="tel" />
    </div>
    <details className={styles.addressDetails}><summary>{f.addressGroup}</summary>
      <div className={styles.fieldsTwo}>
        <Field id="pay-address" name="address" label={f.address} autoComplete="address-line1" />
        <Field id="pay-address2" name="address2" label={f.address2} autoComplete="address-line2" />
      </div>
      <div className={styles.fieldsThree}>
        <Field id="pay-city" name="city" label={f.city} autoComplete="address-level2" />
        <Field id="pay-state" name="state" label={f.state} autoComplete="address-level1" />
        <Field id="pay-zip" name="zipcode" label={f.zip} autoComplete="postal-code" />
      </div>
    </details>
    <div className={styles.fieldsTwo}>
      <div className={styles.field}><label htmlFor="pay-service">{f.service}<span className={styles.asterisk} aria-hidden="true"> *</span></label>
        <select id="pay-service" name="service" defaultValue="" required><option value=""></option>
          {paymentServices.map((service, i) => <option key={service} value={serviceValues[i]}>{c.services[service]}</option>)}
        </select>
      </div>
      <Field id="pay-service-other" name="service2" label={f.serviceOther} />
      <div className={styles.field}><label htmlFor="pay-office">{f.office}<span className={styles.asterisk} aria-hidden="true"> *</span></label>
        <select id="pay-office" name="office" defaultValue="" required><option value=""></option>
          {paymentOffices.map(office => <option key={office} value={office}>{c.offices[office]}</option>)}
        </select>
      </div>
      <div className={styles.field}><label htmlFor="pay-amount">{f.amount}<span className={styles.asterisk} aria-hidden="true"> *</span></label>
        <div className={styles.amountInput}><span aria-hidden="true">$</span><input id="pay-amount" name="amount" type="number" min="0.01" step="0.01" inputMode="decimal" required /></div>
        <small>{f.amountHelp}</small>
      </div>
    </div>
    <div className={styles.legal}>
      <input id="pay-terms" type="checkbox" name="terms" value="1" required />
      <div><label htmlFor="pay-terms">{f.terms}</label><p><a href="/terms" target="_blank" rel="noopener noreferrer">{f.termsLink} <ArrowUpRight size={14} aria-hidden="true" /></a><a href="/privacy" target="_blank" rel="noopener noreferrer">{f.privacyLink} <ArrowUpRight size={14} aria-hidden="true" /></a></p></div>
    </div>
    <input type="hidden" name="website" value="AET 2026 online payment" />
    <input type="hidden" name="infotype" value="online payment" />
    <input type="hidden" name="locale" value={locale} />
    <div className={styles.submitRow}><button type="submit" className="button primary"><CreditCard size={19} aria-hidden="true" />{f.submit}<ArrowUpRight size={18} aria-hidden="true" /></button><small>{f.newTab}</small></div>
  </form>;
}

export default async function PaymentPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations();
  const c = paymentContent[locale];
  const methods = [
    { label: c.alternatives.zelle, Icon: Send },
    { label: c.alternatives.bank, Icon: Building2 },
    { label: c.alternatives.check, Icon: Mail },
  ];
  return <ServicePage locale={locale} title={c.title} label={t('navigation.payment')} eyebrow={c.eyebrow}
    nav={[{ id: 'card-payment', label: c.sections.card }, { id: 'other-methods', label: c.sections.alternatives },
      { id: 'payment-security', label: c.sections.security }, { id: 'shipping', label: c.sections.shipping }]}
    actions={[{ label: c.form.submit, href: '#card-payment' }]}>
    <section id="card-payment" className={styles.section} aria-labelledby="card-payment-title">
      <h2 id="card-payment-title">{c.sections.card}</h2><PaymentForm c={c} locale={locale} />
    </section>
    <section id="other-methods" className={styles.section} aria-labelledby="other-methods-title">
      <h2 id="other-methods-title">{c.sections.alternatives}</h2><p className={styles.sectionIntro}>{c.alternatives.intro}</p>
      <CardRail className={styles.methodCards} label={c.sections.alternatives}>{methods.map(({ label, Icon }) => <article data-rail-card key={label} className={styles.methodCard}><Icon size={27} aria-hidden="true" /><h3>{label}</h3></article>)}</CardRail>
      <a className={styles.contactLink} href={contactPath(locale)}>{c.alternatives.contact}<ArrowUpRight size={17} aria-hidden="true" /></a>
    </section>
    <section id="payment-security" className={styles.section} aria-labelledby="payment-security-title">
      <h2 id="payment-security-title">{c.sections.security}</h2><p className={styles.sectionIntro}>{c.security.paragraph}</p>
    </section>
    <section id="shipping" className={styles.section} aria-labelledby="shipping-title">
      <h2 id="shipping-title">{c.sections.shipping}</h2><p className={styles.sectionIntro}>{c.shipping.intro}</p>
      {(['domestic', 'international'] as const).map(group => <div className={styles.shippingGroup} key={group}>
        <h3>{c.shipping[group]}</h3><PricingTable rates={shipping.filter(rate => rate.id.startsWith(group))} caption={c.shipping[group]} showTracking />
      </div>)}
    </section>
  </ServicePage>;
}
