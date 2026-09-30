import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ArrowUpRight, CreditCard } from 'lucide-react';
import { routing, type Locale } from '@/i18n/routing';
import { paymentBankDetails, paymentContent, paymentOffices, paymentServices, type PaymentContent } from '@/lib/payment';
import { shipping } from '@/lib/pricing';
import { formatTurnaround } from '@/lib/pricing-format';
import { ZelleOffices } from '@/components/payment/zelle-offices';
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
  const pricing = await getTranslations('pricing');
  const c = paymentContent[locale];
  const a = c.alternatives;
  const bankDetails = (rows: { label: string; value: string }[]) => <dl className={styles.bankDetails}>
    {rows.map(({ label, value }) => <div key={label}><dt>{a.fields[label]}:</dt><dd>{value}</dd></div>)}
  </dl>;
  return <ServicePage locale={locale} title={c.title} label={t('navigation.payment')} eyebrow={c.eyebrow}
    nav={[{ id: 'card-payment', label: c.sections.card }, { id: 'other-methods', label: a.navLabel },
      { id: 'payment-security', label: c.sections.security }, { id: 'shipping', label: c.sections.shipping }]}
    actions={[{ label: c.form.submit, href: '#card-payment' }]}>
    <section id="card-payment" className={styles.section} aria-labelledby="card-payment-title">
      <h2 id="card-payment-title">{c.sections.card}</h2>
      <p className={styles.cardRestriction}>{c.card.restriction}</p>
      <p className={styles.sectionIntro}>{c.card.description}</p>
      <PaymentForm c={c} locale={locale} />
    </section>
    <section id="other-methods" className={styles.section} aria-labelledby="other-methods-title">
      <h2 id="other-methods-title">{c.sections.alternatives}</h2>
      <div className={styles.instructionCard}><h3>{a.miami}</h3>{bankDetails(paymentBankDetails.miami)}</div>
      <div className={styles.instructionCard}><h3>{a.boston}</h3>
        <h4>{a.deposit}</h4>{bankDetails(paymentBankDetails.boston)}
        <h4>{a.check}</h4>{bankDetails(paymentBankDetails.check)}
      </div>
      <h3 className={styles.subheading}>{a.instructions}</h3>
      <div className={styles.instructionCard}><h3><span aria-hidden="true">📋 </span>{a.stepsTitle}</h3>
        <ol className={styles.steps}>{a.steps.map(step => <li key={step}>{step}</li>)}</ol>
      </div>
      <ZelleOffices copy={a} />
      <p className={styles.note}><strong>{a.noteLabel}</strong> {a.note}{' '}
        <a href="https://www.zellepay.com/get-started" target="_blank" rel="noopener noreferrer">https://www.zellepay.com/get-started</a>
      </p>
    </section>
    <section id="payment-security" className={styles.section} aria-labelledby="payment-security-title">
      <h2 id="payment-security-title">{c.sections.security}</h2>
      <table className={styles.processingTable}>
        <caption className={styles.srOnly}>{c.sections.security}</caption>
        <thead><tr>{c.security.columns.map(column => <th key={column} scope="col">{column}</th>)}</tr></thead>
        {c.security.methods.map(method => <tbody key={method.method}>
          {method.details.map(([time, security], index) => <tr key={time}>
            {index === 0 && <th scope="rowgroup" rowSpan={method.details.length}>{method.method}</th>}
            <td data-label={c.security.columns[1]}>{time}</td><td data-label={c.security.columns[2]}>{security}</td>
          </tr>)}
        </tbody>)}
      </table>
      <p className={styles.note}><strong>{c.security.noteLabel}</strong> {c.security.note}</p>
    </section>
    <section id="shipping" className={styles.section} aria-labelledby="shipping-title">
      <h2 id="shipping-title">{c.sections.shipping}</h2>
      <details className={styles.shippingDetails}><summary>{c.shipping.toggle}</summary>
      {(['domestic', 'international'] as const).map(group => <div className={styles.shippingGroup} key={group}>
        <h3>{c.shipping[group]}</h3>
        <div className={styles.shippingTableWrap}><table className={styles.shippingTable}>
          <caption className={styles.srOnly}>{c.shipping[group]}</caption>
          <thead><tr>{[c.shipping[group], ...c.shipping.columns].map(column => <th key={column} scope="col">{column}</th>)}</tr></thead>
          <tbody>{shipping.filter(rate => rate.id.startsWith(group)).map(rate => <tr key={rate.id}>
            <th scope="row">{c.shipping.methods[rate.id]}</th>
            <td>{rate.turnaround && formatTurnaround(rate.turnaround, pricing)}</td>
            <td>{'amount' in rate.price && `$${rate.price.amount}`}</td>
            <td>{pricing(rate.tracking ? 'format.yes' : 'format.no')}</td>
          </tr>)}</tbody>
        </table></div>
      </div>)}
      <p className={styles.note}><strong>{c.shipping.noteLabel}</strong> {c.shipping.note}</p>
      </details>
    </section>
  </ServicePage>;
}
