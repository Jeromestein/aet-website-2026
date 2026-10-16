'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Mail, MapPin } from 'lucide-react';
import { applicationCopy } from '@/lib/application/copy';
import { deliveryCopy } from '@/lib/application/delivery-copy';
import { deliveryPath, extraReportRate, reportFormats, selectDeliveryCountry, selectReport, shippingOptions, type ReportDelivery } from '@/lib/application/delivery';
import { countryLabel, countryOptions, regionOptions } from '@/lib/legacy-application/countries';
import { formatPrice, formatTurnaround } from '@/lib/pricing-format';
import type { FormErrors } from '@/lib/application/model';
import type { Locale } from '@/i18n/routing';
import s from './application.module.css';

export function ReportDeliveryFields({ locale, value, errors, onChange }: {
  locale: Locale; value: ReportDelivery; errors: FormErrors; onChange: (value: ReportDelivery) => void;
}) {
  const c = deliveryCopy[locale];
  const common = applicationCopy[locale];
  const p = useTranslations('pricing');
  const isUS = value.address.country === 'US';
  const selectedShipping = shippingOptions(value.address.country).find(rate => rate.id === value.shipping);
  const errorText = (path: string) => {
    const code = errors[deliveryPath(path)];
    return code === 'shipping' ? c.shippingError : code === 'postal' ? c.postalError : code === 'copies' ? c.copiesError : code === 'country' ? common.invalidCountry : common.required;
  };
  const access = (path: string, required = true, hint = false) => ({
    id: deliveryPath(path), name: deliveryPath(path), required,
    'aria-invalid': Boolean(errors[deliveryPath(path)]),
    'aria-describedby': [errors[deliveryPath(path)] ? deliveryPath(path) + '-error' : '', hint ? deliveryPath(path) + '-hint' : ''].filter(Boolean).join(' ') || undefined,
  });
  const field = (path: string, label: string, child: ReactNode, required = true, fullWidth = false, hint?: string) => <div className={s.field + (fullWidth ? ' ' + s.fullWidth : '')}>
    <label htmlFor={deliveryPath(path)}>{label}{required ? <span className={s.requiredMark} aria-hidden="true">*</span> : <span>{common.optional}</span>}</label>
    {child}
    {hint && <p className={s.hint} id={deliveryPath(path) + '-hint'}>{hint}</p>}
    {errors[deliveryPath(path)] && <p className={s.fieldError} id={deliveryPath(path) + '-error'}>{errorText(path)}</p>}
  </div>;
  const addressInput = (key: keyof ReportDelivery['address'], label: string, autoComplete: string, required = true, fullWidth = false, hint?: string) => field('address.' + key, label,
    <input {...access('address.' + key, required, Boolean(hint))} autoComplete={'shipping ' + autoComplete} maxLength={300} value={value.address[key]} onChange={event => onChange({ ...value, address: { ...value.address, [key]: event.target.value } })} />,
    required, fullWidth, hint);

  return <section className={s.section} aria-labelledby="report-delivery-title">
    <h3 id="report-delivery-title">{c.title}</h3>
    <p className={s.sectionHint}>{c.hint}</p>
    {field('report', c.format, <select {...access('report', true, true)} value={value.report} onChange={event => onChange(selectReport(value, event.target.value as ReportDelivery['report']))}>
      {reportFormats.map(rate => <option key={rate.id} value={rate.id}>{p('services.' + rate.label)} · {formatPrice(rate.price, locale, p)}</option>)}
    </select>, true, false, c.emailHint)}
    {value.report === 'paper' && <>
      {field('extraCopies', c.extraCopies, <input {...access('extraCopies', false, true)} type="number" min={0} max={20} step={1} value={value.extraCopies} onChange={event => onChange({ ...value, extraCopies: Number(event.target.value) })} />, false, false, c.copiesHint.replace('{amount}', formatPrice(extraReportRate.price, locale, p)))}
      <fieldset className={s.mailingAddress}>
        <legend><MapPin size={17} aria-hidden="true" />{c.mailingTitle}</legend>
        <p className={s.sectionHint}>{c.mailingHint}</p>
        <div className={s.grid}>
          {addressInput('name', c.recipient, 'name')}
          {field('address.country', c.country, <select {...access('address.country')} autoComplete="shipping country" value={value.address.country} onChange={event => onChange(selectDeliveryCountry(value, event.target.value))}>
            <option value="">{common.select}</option>{countryOptions(locale).map(country => <option key={country.value} value={country.value}>{country.label}</option>)}
          </select>)}
          {addressInput('street', c.street, 'address-line1', true, true)}
          {addressInput('street2', c.street2, 'address-line2', false, true)}
          {addressInput('city', c.city, 'address-level2')}
          {isUS ? field('address.region', c.region, <select {...access('address.region')} autoComplete="shipping address-level1" value={value.address.region} onChange={event => onChange({ ...value, address: { ...value.address, region: event.target.value } })}>
            <option value="">{common.select}</option>{regionOptions('US', locale).map(region => <option key={region.value} value={region.value}>{region.label}</option>)}
          </select>) : addressInput('region', c.region, 'address-level1', false)}
          {addressInput('postal', c.postal, 'postal-code', isUS, false, isUS ? undefined : c.postalHint)}
        </div>
      </fieldset>
      {field('shipping', c.shipping, <select {...access('shipping', true, true)} disabled={!shippingOptions(value.address.country).length} value={value.shipping} onChange={event => onChange({ ...value, shipping: event.target.value })}>
        <option value="">{common.select}</option>{shippingOptions(value.address.country).map(rate => <option key={rate.id} value={rate.id}>{p('services.' + rate.label)} · {formatPrice(rate.price, locale, p)} · {formatTurnaround(rate.turnaround!, p)}</option>)}
      </select>, true, false, selectedShipping ? `${formatPrice(selectedShipping.price, locale, p)} · ${formatTurnaround(selectedShipping.turnaround!, p)}. ${c.shippingHint}` : c.shippingHint)}
    </>}
  </section>;
}

export function DeliveryReview({ locale, value, email }: { locale: Locale; value: ReportDelivery; email: string }) {
  const c = deliveryCopy[locale];
  const p = useTranslations('pricing');
  const address = value.address;
  const region = address.country === 'US' ? regionOptions('US').find(item => item.value === address.region)?.label : address.region;
  return <dl className={s.reviewGrid}>
    <div><dt>{c.format}</dt><dd>{p('services.' + (value.report === 'pdf' ? 'reportPdf' : 'reportPaper'))}</dd></div>
    <div><dt><Mail size={14} aria-hidden="true" /> {applicationCopy[locale].email}</dt><dd>{email}</dd></div>
    {value.report === 'paper' && <>
      <div><dt>{c.extraCopies}</dt><dd>{value.extraCopies}</dd></div>
      <div><dt>{c.shipping}</dt><dd>{value.shipping ? p('services.' + value.shipping) : '—'}</dd></div>
      <div className={s.fullWidth}><dt>{c.mailingTitle}</dt><dd className={s.reviewAddress}>{[address.name, address.street, address.street2, [address.city, region, address.postal].filter(Boolean).join(', '), countryLabel(address.country, locale)].filter(Boolean).join('\n')}</dd></div>
    </>}
  </dl>;
}
