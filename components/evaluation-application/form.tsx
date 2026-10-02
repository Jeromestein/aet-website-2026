'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ApplicationDate } from '@/components/application-date';
import { countryOptions, countryLabel, regionOptions } from '@/lib/legacy-application/countries';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Check, ChevronRight, ArrowLeft, Plus, Trash2, ShieldCheck, FileText } from 'lucide-react';
import { evaluationGroups, evaluationAdditionalDegree, evaluationReports, evaluationExtraCopy, pricingPolicy } from '@/lib/pricing';
import { formatPrice, formatTurnaround, formatMoney } from '@/lib/pricing-format';
import { initialData, emptyEducation, draftSchema, validate, quote, offices, purposes, shippingOptions, type ApplicationData, type FieldError, type Address } from '@/lib/evaluation-application/domain';
import { QuoteSummary } from './summary';
import s from './application.module.css';

const DRAFT_KEY = 'aet-formal-application-v1';
const steps = ['clientStep', 'evalueeStep', 'servicesStep', 'reviewStep'];
type Draft = { data: ApplicationData; step: number; requestId: string; key: string; updatedAt: number };
function identity() { return { requestId: crypto.randomUUID(), key: Array.from(crypto.getRandomValues(new Uint8Array(32)), x => x.toString(16).padStart(2, '0')).join('') }; }
function Field({ label, id, error, children, optional = false, optionalText = '' }: { label: string; id: string; error?: string; children: ReactNode; optional?: boolean; optionalText?: string }) {
  return <div className={s.field}><label htmlFor={id}>{label}{optional ? <span className={s.optional}> {optionalText}</span> : <span aria-hidden="true"> *</span>}</label>{children}{error && <p className={s.fieldError} id={`${id}-error`}>{error}</p>}</div>;
}

export function EvaluationApplication({ locale, enabled }: { locale: string; enabled: boolean }) {
  const t = useTranslations('evaluationApplication');
  const p = useTranslations('pricing');
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false);
  const [restored, setRestored] = useState(false);
  const [storageFailed, setStorageFailed] = useState(false);
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState('');
  const [clearPrompt, setClearPrompt] = useState(false);
  const credentials = useRef({ requestId: '', key: '' });
  const submitting = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const errorBox = useRef<HTMLDivElement>(null);
  const latest = useRef<Draft | null>(null);
  const successful = useRef(false);
  useEffect(() => {
    credentials.current = identity();
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Draft;
        const parsed = draftSchema.safeParse(saved.data);
        if (parsed.success && Number.isInteger(saved.step) && saved.step >= 0 && saved.step <= 3 && /^[\da-f-]{36}$/.test(saved.requestId) && /^[\da-f]{64}$/.test(saved.key) && Date.now() - saved.updatedAt < 86400000) {
          quote(parsed.data);
          setData({ ...parsed.data, terms: false }); setStep(saved.step); credentials.current = { requestId: saved.requestId, key: saved.key }; setRestored(true);
        } else sessionStorage.removeItem(DRAFT_KEY);
      }
    } catch { setStorageFailed(true); }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready || successful.current) return;
    latest.current = { data, step, ...credentials.current, updatedAt: Date.now() };
    try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(latest.current)); } catch { setStorageFailed(true); }
  }, [data, step, ready]);
  useEffect(() => {
    const save = () => { if (latest.current && !successful.current) { try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(latest.current)); } catch { /* Keep the in-memory draft usable. */ } } };
    window.addEventListener('pagehide', save);
    return () => window.removeEventListener('pagehide', save);
  }, []);
  function update(path: string, value: string | number | boolean) {
    setData(current => {
      const next = structuredClone(current);
      const parts = path.split('.');
      let parent = next as unknown as Record<string, unknown>;
      for (const part of parts.slice(0, -1)) parent = parent[part] as Record<string, unknown>;
      parent[parts[parts.length - 1]] = value;
      const destination = next.client;
      if (path === 'client.country') next.client.region = '';
      if (next.delivery.shipping && !shippingOptions(destination.country).some(r => r.id === next.delivery.shipping)) next.delivery.shipping = '';
      if (path !== 'terms') next.terms = false;
      return next;
    });
    setErrors(current => current.filter(e => e.path !== path)); setServerError('');
  }
  const fieldError = (id: string) => { const found = errors.find(e => e.path === id); return found ? t(`errors.${found.code}`) : undefined; };
  const accessibility = (id: string) => ({ id, name: id, 'aria-invalid': !!fieldError(id), 'aria-describedby': fieldError(id) ? `${id}-error` : undefined });
  const input = (id: string, label: string, value: string, options: { type?: string; optional?: boolean; autoComplete?: string } = {}) => <Field id={id} label={label} error={fieldError(id)} optional={options.optional} optionalText={t('optional')}>{options.type === 'date' || options.type === 'month' ? <ApplicationDate id={id} label={label} value={value} onChange={next => update(id, next)} locale={locale} day={options.type === 'date'} invalid={!!fieldError(id)} /> : <input {...accessibility(id)} aria-required={!options.optional} type={options.type || 'text'} value={value} maxLength={200} autoComplete={options.autoComplete} onChange={e => update(id, e.target.value)} />}</Field>;
  const select = (id: string, label: string, value: string, choices: { value: string; label: string }[], optional = false) => <Field id={id} label={label} error={fieldError(id)} optional={optional} optionalText={t('optional')}><select {...accessibility(id)} aria-required={!optional} value={value} onChange={e => update(id, e.target.value)}><option value="">{t('choose')}</option>{choices.map(option => <option value={option.value} key={option.value}>{option.label}</option>)}</select></Field>;
  const renderAddress = (v: Address, prefix: string) => <div className={s.grid}>
    {input(`${prefix}.name`, t(prefix === 'client' ? 'clientName' : 'recipientName'), v.name, { autoComplete: prefix === 'client' ? 'organization' : 'shipping name' })}
    {select(`${prefix}.country`, t('country'), v.country, countryOptions(locale))}
    {input(`${prefix}.street`, t('street'), v.street, { autoComplete: `${prefix === 'client' ? 'billing' : 'shipping'} address-line1` })}
    {input(`${prefix}.street2`, t('street2'), v.street2, { optional: true, autoComplete: `${prefix === 'client' ? 'billing' : 'shipping'} address-line2` })}
    {input(`${prefix}.city`, t('city'), v.city, { autoComplete: `${prefix === 'client' ? 'billing' : 'shipping'} address-level2` })}
    {select(`${prefix}.region`, t('region'), v.region, regionOptions(v.country, locale))}
    {input(`${prefix}.postal`, t('postal'), v.postal, { autoComplete: `${prefix === 'client' ? 'billing' : 'shipping'} postal-code` })}
  </div>;
  function navigate(target: number) {
    setServerError('');
    const found = target > step ? validate(data, target - 1) : [];
    setErrors(found);
    if (found.length) { setStep(found[0].step); requestAnimationFrame(() => errorBox.current?.focus()); return; }
    setStep(target); requestAnimationFrame(() => { heading.current?.focus(); heading.current?.scrollIntoView({ block: 'start', behavior: 'instant' }); });
  }
  async function submit() {
    if (submitting.current || successful.current) return;
    const found = validate(data);
    setErrors(found);
    if (found.length) { setStep(found[0].step); requestAnimationFrame(() => errorBox.current?.focus()); return; }
    submitting.current = true; setBusy(true); setServerError('');
    try {
      const response = await fetch('/api/evaluation/applications', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Application-Key': credentials.current.key }, body: JSON.stringify({ requestId: credentials.current.requestId, locale, data }) });
      const result = await response.json();
      if (!response.ok) { setServerError(result.error === 'too_many_requests' ? 'rateError' : result.error === 'idempotency_conflict' ? 'conflictError' : 'submitError'); return; }
      successful.current = true;
      try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* Submission succeeded even if browser storage is unavailable. */ }
      router.push(`${locale === 'en' ? '' : '/' + locale}/credential-evaluation-application/success?id=${result.id}`);
    } catch { setServerError('submitError'); }
    finally { setBusy(false); submitting.current = false; }
  }
  const estimate = quote(data);
  const destination = data.client;
  const price = (v: Parameters<typeof formatPrice>[0]) => formatPrice(v, locale, p);
  const reviewRow = (label: string, value: string) => <div><dt>{label}</dt><dd>{value || '—'}</dd></div>;
  const reviewAddress = (v: Address) => [v.name, v.street, v.street2, [v.city, v.region, v.postal].filter(Boolean).join(', '), countryLabel(v.country, locale)].filter(Boolean).join('\n');
  const errorLabel = (path: string) => {
    const names: Record<string, string> = { 'client.name': 'clientName', country: 'country', street: 'street', city: 'city', region: 'region', postal: 'postal', email: 'email', phone: 'phone', fax: 'fax', office: 'office', purpose: 'purpose', title: 'salutation', first: 'firstName', last: 'lastName', birth: 'birth', school: 'school', degree: 'degree', start: 'start', end: 'end', shipping: 'shipping', notes: 'notes', terms: 'termsLink', services: 'servicesStep' };
    const name = names[path] || names[path.split('.').at(-1)!];
    return name ? `${t(name)} — ` : '';
  };
  return <>
    <div className={s.intro}><p className={s.eyebrow}>AET / {t('eyebrow')}</p><h1>{t('title')}</h1><p>{t('intro')}</p><div className={s.saveStatus}><ShieldCheck size={17} aria-hidden="true" /><span>{t(storageFailed ? 'storageFailed' : restored ? 'restored' : 'draftNote')}</span></div></div>
    {!enabled && <div className={s.notice}>{t('unavailable')} <a href="https://app.americantranslationservice.com/credential-evaluation-application">{t('legacy')}</a></div>}
    {enabled && <p className={s.pilot}>{t('pilot')}</p>}
    <nav aria-label={t('progress')} className={s.steps}><ol>{steps.map((key, index) => <li key={key}><button type="button" aria-current={step === index ? 'step' : undefined} onClick={() => navigate(index)} disabled={busy || !ready}><span className={s.stepNumber}>{index < step ? <Check size={18} aria-hidden="true" /> : index + 1}</span><span>{t(key)}</span></button></li>)}</ol></nav>
    <div className={s.layout}>
      <form noValidate onSubmit={event => { event.preventDefault(); if (step < 3) navigate(step + 1); else if (enabled) void submit(); }}>
        <fieldset className={s.formFieldset} disabled={busy || !ready}>
          <section className={s.panel}>
            <div className={s.sectionTitle}><div><p className={s.eyebrow}>{t('stepCount', { step: step + 1 })}</p><h2 ref={heading} tabIndex={-1}>{t(steps[step])}</h2></div><FileText size={28} strokeWidth={1.4} aria-hidden="true" /></div>
            <p className={s.hint}>{t(['clientIntro', 'educationIntro', 'servicesIntro', 'reviewIntro'][step])}</p>
            {!!errors.length && <div className={s.errors} ref={errorBox} tabIndex={-1} role="alert"><strong>{t('fixErrors')}</strong><ul>{errors.filter(e => e.step === step).map(error => <li key={`${error.path}-${error.code}`}><a href={`#${error.path}`} onClick={e => { e.preventDefault(); document.getElementById(error.path)?.focus(); }}>{errorLabel(error.path)}{t(`errors.${error.code}`)}</a></li>)}</ul></div>}
            {serverError && <p className={s.errors} role="alert">{t(serverError)}</p>}
            {step === 0 && <>
              <div className={s.grid}>{select('client.purpose', t('purpose'), data.client.purpose, purposes.map(value => ({ value, label: t(`purposeOptions.${value}`) })))}{select('client.office', t('office'), data.client.office, offices.map(value => ({ value, label: t(`offices.${value}`) })))}</div>
              <h3>{t('contactHeading')}</h3>{renderAddress(data.client, 'client')}
              <div className={s.grid}>{input('client.email', t('email'), data.client.email, { type: 'email', autoComplete: 'email' })}{input('client.phone', t('phone'), data.client.phone, { type: 'tel', autoComplete: 'tel' })}{input('client.fax', t('fax'), data.client.fax, { type: 'tel', optional: true })}</div>
              <Field id="notes" label={t('notes')} error={fieldError('notes')} optional={!data.services.customized} optionalText={t('optional')}><textarea {...accessibility('notes')} rows={4} maxLength={3000} value={data.notes} onChange={e => update('notes', e.target.value)} /></Field>
              <p className={s.hint}>{t('legacyFormatNote')}</p>
            </>}
            {step === 1 && <>
              <div className={s.grid}>{select('evaluee.title', t('salutation'), data.evaluee.title, ['mr', 'ms', 'mx'].map(value => ({ value, label: t(`titles.${value}`) })))}{input('evaluee.first', t('firstName'), data.evaluee.first, { autoComplete: 'given-name' })}{input('evaluee.middle', t('middleName'), data.evaluee.middle, { optional: true, autoComplete: 'additional-name' })}{input('evaluee.last', t('lastName'), data.evaluee.last, { autoComplete: 'family-name' })}{input('evaluee.birth', t('birth'), data.evaluee.birth, { type: 'date', autoComplete: 'bday' })}</div>
              <h3>{t('educationHeading')}</h3><p className={s.hint}>{t('educationNote')}</p>
              {data.educations.map((edu, index) => <fieldset className={s.education} key={index}><legend>{t('educationNumber', { count: index + 1 })}</legend><div className={s.grid}>{select(`educations.${index}.country`, t('studyCountry'), edu.country, countryOptions(locale))}{input(`educations.${index}.school`, t('school'), edu.school)}{input(`educations.${index}.degree`, t('degree'), edu.degree)}{input(`educations.${index}.start`, t('start'), edu.start, { type: 'month' })}{input(`educations.${index}.end`, t('end'), edu.end, { type: 'month' })}</div><button className={s.textButton} type="button" onClick={() => { setData(current => { const next = structuredClone(current); next.educations.splice(index, 1); for (const id of ['document', 'course'] as const) next.services[id].additionalDegrees = Math.min(next.services[id].additionalDegrees, Math.max(0, next.educations.length - 1)); next.terms = false; return next; }); setErrors([]); }}><Trash2 size={16} aria-hidden="true" />{t('removeEducation', { count: index + 1 })}</button></fieldset>)}
              <button className={s.secondary} type="button" disabled={data.educations.length >= 20} onClick={() => setData(current => ({ ...current, terms: false, educations: [...current.educations, emptyEducation()] }))}><Plus size={17} aria-hidden="true" />{t('addEducation')}</button>
            </>}
            {step === 2 && <>
              <div id="services" tabIndex={-1} className={s.services}>{evaluationGroups.map(group => <div className={`${s.service} ${data.services[group.id].tier ? s.selected : ''}`} key={group.id}>
                <label className={s.check}><input type="checkbox" checked={!!data.services[group.id].tier} onChange={e => setData(current => ({ ...current, terms: false, services: { ...current.services, [group.id]: { tier: e.target.checked ? group.rates[0].id : '', additionalDegrees: 0 } } }))} /><span><strong>{p(`services.${group.id}`)}</strong><small>{t(`serviceNotes.${group.id}`)}</small></span><span className={s.fromPrice}>{t('from', { amount: price(group.rates[0].price) })}</span></label>
                {!!data.services[group.id].tier && <div className={s.serviceDetails}>{select(`services.${group.id}.tier`, t('turnaround'), data.services[group.id].tier, group.rates.map(rate => ({ value: rate.id, label: `${formatTurnaround(rate.turnaround!, p)} — ${price(rate.price)}` })))}
                  {(group.id === 'document' || group.id === 'course') && <Field id={`services.${group.id}.additionalDegrees`} label={t('additionalDegrees', { amount: formatMoney(evaluationAdditionalDegree[group.id], locale) })} error={fieldError(`services.${group.id}.additionalDegrees`)} optional optionalText={t('optional')}><input {...accessibility(`services.${group.id}.additionalDegrees`)} type="number" min="0" max={Math.max(0, data.educations.length - 1)} step="1" value={data.services[group.id].additionalDegrees} onChange={e => update(`services.${group.id}.additionalDegrees`, Math.max(0, Math.min(20, Math.trunc(Number(e.target.value) || 0))))} /></Field>}
                </div>}
              </div>)}</div>
              {fieldError('services') && <p className={s.fieldError}>{fieldError('services')}</p>}
              <label className={s.check}><input type="checkbox" checked={data.services.customized} onChange={e => update('services.customized', e.target.checked)} /><span><strong>{t('custom')}</strong><small>{t('customNote')}</small></span></label>
              <label className={s.check}><input type="checkbox" checked={data.services.translation} onChange={e => update('services.translation', e.target.checked)} /><span><strong>{t('translation')}</strong><small>{t('translationNote')}</small></span></label>
              <p className={s.notice}>{p('notes.cutoff', { time: pricingPolicy.sameDayCutoff })}</p>
              <h3>{t('deliveryHeading')}</h3>
              <Field id="delivery.report" label={t('report')} error={fieldError('delivery.report')}><select {...accessibility('delivery.report')} value={data.delivery.report} onChange={e => setData(current => ({ ...current, terms: false, delivery: { ...current.delivery, report: e.target.value as 'pdf' | 'paper' | 'extraCopy', extraCopies: e.target.value === 'extraCopy' ? 1 : 0, shipping: '' } }))}>{evaluationReports.map(rate => <option key={rate.id} value={rate.id}>{p(`services.${rate.label}`)} — {price(rate.price)}</option>)}</select></Field>
              {data.delivery.report !== 'pdf' && <>
                {data.delivery.report === 'extraCopy' && <Field id="delivery.extraCopies" label={t('extraCopies', { amount: price(evaluationExtraCopy) })} error={fieldError('delivery.extraCopies')}><input {...accessibility('delivery.extraCopies')} type="number" min="1" max="20" step="1" value={data.delivery.extraCopies} onChange={e => update('delivery.extraCopies', Math.max(1, Math.min(20, Math.trunc(Number(e.target.value) || 1))))} /></Field>}
                <p className={s.hint}>{t('mailingAddressNote')}</p>
                {select('delivery.shipping', t('shipping'), data.delivery.shipping, shippingOptions(destination.country).map(rate => ({ value: rate.id, label: `${p(`services.${rate.label}`)} — ${price(rate.price)} (${formatTurnaround(rate.turnaround!, p)})` })))}
                <p className={s.hint}>{t('shippingNote')}</p>
              </>}
            </>}
            {step === 3 && <>
              <div className={s.reviewSection}><h3>{t('clientStep')}<button type="button" className={s.textButton} onClick={() => navigate(0)}>{t('edit')}</button></h3><dl className={s.review}>{reviewRow(t('purpose'), data.client.purpose ? t(`purposeOptions.${data.client.purpose}`) : '')}{reviewRow(t('office'), data.client.office ? t(`offices.${data.client.office}`) : '')}{reviewRow(t('contactHeading'), reviewAddress(data.client))}{reviewRow(t('email'), data.client.email)}{reviewRow(t('phone'), data.client.phone)}{data.client.fax && reviewRow(t('fax'), data.client.fax)}</dl></div>
              <div className={s.reviewSection}><h3>{t('evalueeStep')}<button type="button" className={s.textButton} onClick={() => navigate(1)}>{t('edit')}</button></h3><dl className={s.review}>{reviewRow(t('fullName'), [data.evaluee.title ? t(`titles.${data.evaluee.title}`) : '', data.evaluee.first, data.evaluee.middle, data.evaluee.last].filter(Boolean).join(' '))}{reviewRow(t('birth'), data.evaluee.birth)}{data.educations.map((edu, index) => <div key={index}><dt>{t('educationNumber', { count: index + 1 })}</dt><dd>{edu.degree}<br />{edu.school} · {countryLabel(edu.country, locale)}<br />{edu.start} — {edu.end}</dd></div>)}</dl></div>
              <div className={s.reviewSection}><h3>{t('servicesStep')}<button type="button" className={s.textButton} onClick={() => navigate(2)}>{t('edit')}</button></h3><dl className={s.review}>{evaluationGroups.filter(g => data.services[g.id].tier).map(g => <div key={g.id}><dt>{p(`services.${g.id}`)}</dt><dd>{formatTurnaround(g.rates.find(r => r.id === data.services[g.id].tier)!.turnaround!, p)}{data.services[g.id].additionalDegrees > 0 && <small>{t('additionalCount', { count: data.services[g.id].additionalDegrees })}</small>}</dd></div>)}{data.services.translation && reviewRow(t('translation'), t('quoteRequired'))}{data.services.customized && reviewRow(t('custom'), t('quoteRequired'))}{reviewRow(t('report'), p(`services.${data.delivery.report === 'extraCopy' ? 'reportExtra' : data.delivery.report === 'pdf' ? 'reportPdf' : 'reportPaper'}`))}{data.delivery.report !== 'pdf' && <>{reviewRow(t('shipping'), data.delivery.shipping ? p(`services.${data.delivery.shipping}`) : '')}{reviewRow(t('recipientName'), reviewAddress(destination))}{reviewRow(t('copies'), String(data.delivery.extraCopies))}</>}{data.notes && reviewRow(t('notes'), data.notes)}</dl></div>
              <div className={s.notice}><strong>{t('documentsHeading')}</strong><p>{t('documentsNote')}</p></div>
              <label className={s.check}><input {...accessibility('terms')} type="checkbox" checked={data.terms} onChange={e => update('terms', e.target.checked)} /><span>{t('agree')} <a href="/terms" target="_blank" rel="noreferrer">{t('termsLink')}</a> {t('and')} <a href="/privacy" target="_blank" rel="noreferrer">{t('privacy')}</a>.</span></label>
              {fieldError('terms') && <p className={s.fieldError} id="terms-error">{fieldError('terms')}</p>}
            </>}
          </section>
          <div className={s.mobileEstimate}><span>{t(estimate.needsQuote ? 'knownSubtotal' : 'estimatedTotal')}</span><strong>{formatMoney(estimate.min / 100, locale)}{estimate.min !== estimate.max && `–${formatMoney(estimate.max / 100, locale)}`}</strong><a href="#quote-title">{t('summary')}</a></div>
          <div className={s.actions}><button className={s.secondary} type="button" onClick={() => navigate(step - 1)} disabled={step === 0}><ArrowLeft size={17} aria-hidden="true" />{t('back')}</button><button className={s.primary} type="submit" disabled={step === 3 && !enabled}>{busy ? t('submitting') : t(step === 3 ? 'submit' : 'continue')}<ChevronRight size={18} aria-hidden="true" /></button></div>
        </fieldset>
        <div className={s.draftActions}>{clearPrompt ? <><span>{t('clearConfirm')}</span><button type="button" className={s.textButton} onClick={() => { setData(initialData()); setStep(0); setErrors([]); setServerError(''); setRestored(false); credentials.current = identity(); setClearPrompt(false); }}>{t('clearYes')}</button><button type="button" className={s.textButton} onClick={() => setClearPrompt(false)}>{t('cancel')}</button></> : <button disabled={busy} type="button" className={s.textButton} onClick={() => setClearPrompt(true)}>{t('clear')}</button>}</div>
      </form>
      <aside><QuoteSummary value={estimate} locale={locale} /><div className={s.help}><h3>{t('help')}</h3><p>{t('helpText')}</p><a href={`${locale === 'en' ? '' : '/' + locale}/contact`} target="_blank" rel="noreferrer">{t('contact')}</a></div></aside>
    </div>
  </>;
}
