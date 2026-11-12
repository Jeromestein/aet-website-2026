'use client';

import { useState } from 'react';
import { ArrowUpRight, CreditCard } from 'lucide-react';
import type { Locale } from '@/i18n/routing';
import { paymentOffices, paymentServices, type PaymentContent, type PaymentOffice } from '@/lib/payment';
import styles from '@/app/[locale]/payment/payment.module.css';

const serviceValues = ['翻译公证', '学位评估', '美国口译', '其他服务'] as const;

function Field({ id, name, label, type = 'text', required = false, ...inputProps }: {
  id: string; name: string; label: string; type?: string; required?: boolean;
  autoComplete?: string; inputMode?: 'decimal' | 'email' | 'tel'; min?: string; step?: string;
}) {
  return <div className={styles.field}>
    <label htmlFor={id}>{label}{required && <span className={styles.asterisk} aria-hidden="true"> *</span>}</label>
    <input id={id} name={name} type={type} required={required} {...inputProps} />
  </div>;
}

export function PaymentForm({ c, locale, stripeMode, stripeOffices, checkoutToken }: {
  c: PaymentContent; locale: Locale; stripeMode: 'test' | 'live' | 'disabled';
  stripeOffices: PaymentOffice[]; checkoutToken: string;
}) {
  const [provider, setProvider] = useState('paypal');
  const [office, setOffice] = useState('');
  const stripe = provider === 'stripe';
  const stripeAvailable = stripeMode !== 'disabled' && (office
    ? stripeOffices.some(entry => entry === office)
    : stripeOffices.length > 0);
  const f = stripeMode === 'live' ? { ...c.form, ...c.stripeLive } : c.form;
  return <form className={styles.form} method="post" action="/api/payment/prepare" target="_blank" rel="noopener noreferrer">
    <p className={styles.formIntro}>{f.intro}</p>
      <div className={`${styles.field} ${styles.officeField}`}><label htmlFor="pay-office">{f.office}<span className={styles.asterisk} aria-hidden="true"> *</span></label>
        <select id="pay-office" name="office" value={office} onChange={event => {
          const nextOffice = event.target.value;
          setOffice(nextOffice);
          if (nextOffice && !stripeOffices.some(entry => entry === nextOffice)) {
            setProvider('paypal');
          }
        }} required><option value=""></option>
          {paymentOffices.map(office => <option key={office} value={office}>{c.offices[office]}</option>)}
        </select>
      </div>
    <fieldset className={styles.providers}>
      <legend>{f.provider}</legend>
      <div className={styles.providerOptions}>
        <label className={styles.providerOption}>
          <input type="radio" name="provider" value="paypal" checked={!stripe} onChange={() => setProvider('paypal')} />
          <span><strong>PayPal</strong><small>{f.paypalDescription}</small></span>
        </label>
        {stripeAvailable && <label className={styles.providerOption}>
          <input type="radio" name="provider" value="stripe" checked={stripe} onChange={() => setProvider('stripe')} aria-describedby="stripe-payment-notice" />
          <span><strong>{f.stripe}</strong><small>{f.stripeDescription}</small></span>
        </label>}
      </div>
    </fieldset>
    {office && !stripeAvailable && stripeMode !== 'disabled' && <p className={styles.formIntro} role="status">{f.stripeOfficeUnavailable}</p>}
    {stripe && <p id="stripe-payment-notice" className={styles.paymentNotice} role="status">{f.stripeNotice}</p>}
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
      <div className={styles.field}><label htmlFor="pay-amount">{f.amount}<span className={styles.asterisk} aria-hidden="true"> *</span></label>
        <div className={styles.amountInput}><span aria-hidden="true">$</span><input id="pay-amount" name="amount" aria-describedby="pay-amount-help" type="number" min={stripe ? "0.50" : "0.01"} max={stripe ? "999999.99" : undefined} step="0.01" inputMode="decimal" required /></div>
        <small id="pay-amount-help">{stripe ? f.stripeAmountHelp : f.amountHelp}</small>
      </div>
    </div>
    <div className={styles.legal}>
      <input key={`${provider}-${office}-${stripeMode}`} id="pay-terms" type="checkbox" name="terms" value="1" required />
      <div><label htmlFor="pay-terms">{stripe ? f.stripeTerms : f.terms}</label><p><a href="/terms" target="_blank" rel="noopener noreferrer">{f.termsLink} <ArrowUpRight size={14} aria-hidden="true" /></a><a href="/privacy" target="_blank" rel="noopener noreferrer">{f.privacyLink} <ArrowUpRight size={14} aria-hidden="true" /></a></p></div>
    </div>
    <input type="hidden" name="payment_mode" value={stripeMode} />
    <input type="hidden" name="checkout_token" value={checkoutToken} />
    <input type="hidden" name="website" value="AET 2026 online payment" />
    <input type="hidden" name="infotype" value="online payment" />
    <input type="hidden" name="locale" value={locale} />
    <div className={styles.submitRow}><button type="submit" className="button primary"><CreditCard size={19} aria-hidden="true" />{stripe ? f.stripeSubmit : f.submit}<ArrowUpRight size={18} aria-hidden="true" /></button><small>{stripe ? f.stripeNewTab : f.newTab}</small></div>
  </form>;
}
