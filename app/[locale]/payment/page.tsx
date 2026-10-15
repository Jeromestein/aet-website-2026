import { randomUUID } from 'node:crypto';
import { connection } from 'next/server';
import { pageMetadata } from '@/lib/seo';
import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { paymentBankDetails, paymentContent, paymentOffices } from '@/lib/payment';
import { shipping } from '@/lib/pricing';
import { formatTurnaround } from '@/lib/pricing-format';
import { PaymentForm } from '@/components/payment/payment-form';
import { stripeAvailable, stripePaymentMode } from '@/lib/stripe';
import { ZelleOffices } from '@/components/payment/zelle-offices';
import { ServicePage } from '@/components/service/service-page';
import styles from './payment.module.css';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const { title, description } = paymentContent[locale];
  return pageMetadata({ path: '/payment', locale, title, description });
}

export default async function PaymentPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  await connection();
  const t = await getTranslations();
  const pricing = await getTranslations('pricing');
  const c = paymentContent[locale];
  const a = c.alternatives;
  const bankDetails = (rows: { label: string; value: string }[]) => <dl className={styles.bankDetails}>
    {rows.map(({ label, value }) => <div key={label}><dt>{a.fields[label]}:</dt><dd>{value}</dd></div>)}
  </dl>;
  return <ServicePage path={'/payment'} locale={locale} title={c.title} label={t('navigation.payment')} eyebrow={c.eyebrow}
    nav={[{ id: 'card-payment', label: c.sections.card }, { id: 'other-methods', label: a.navLabel },
      { id: 'payment-security', label: c.sections.security }, { id: 'shipping', label: c.sections.shipping }]}
    actions={[{ label: c.form.submit, href: '#card-payment' }]}>
    <section id="card-payment" className={styles.section} aria-labelledby="card-payment-title">
      <h2 id="card-payment-title">{c.sections.card}</h2>
      <p className={styles.cardRestriction}>{c.card.restriction}</p>
      <p className={styles.sectionIntro}>{c.card.description}</p>
      <PaymentForm c={c} locale={locale} stripeMode={stripePaymentMode()} stripeOffices={paymentOffices.filter(office => stripeAvailable(office))} checkoutToken={randomUUID()} />
    </section>
    <section id="other-methods" className={styles.section} aria-labelledby="other-methods-title">
      <h2 id="other-methods-title">{c.sections.alternatives}</h2>
      <h3 className={styles.subheading}>{a.instructions}</h3>
      <div className={styles.instructionCard}><h3><span aria-hidden="true">📋 </span>{a.stepsTitle}</h3>
        <ol className={styles.steps}>{a.steps.map(step => <li key={step}>{step}</li>)}</ol>
      </div>
      <ZelleOffices copy={a} />
      <p className={styles.note}><strong>{a.noteLabel}</strong> {a.note}{' '}
        <a href="https://www.zellepay.com/get-started" target="_blank" rel="noopener noreferrer">https://www.zellepay.com/get-started</a>
      </p>
      <h3 className={styles.subheading}>{a.depositCheckTitle}</h3>
      <div className={styles.instructionCard}><h3>{a.miami}</h3>{bankDetails(paymentBankDetails.miami)}</div>
      <div className={styles.instructionCard}><h3>{a.boston}</h3>
        <h4>{a.deposit}</h4>{bankDetails(paymentBankDetails.boston)}
        <h4>{a.check}</h4>{bankDetails(paymentBankDetails.check)}
      </div>
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
