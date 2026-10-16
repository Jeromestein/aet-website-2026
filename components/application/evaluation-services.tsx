'use client';

import { useTranslations } from 'next-intl';
import { ArrowUpRight, BookOpen, FileCheck2, Languages } from 'lucide-react';
import { evaluationAdditionalDegree, hasEvaluationCutoff, pricingPolicy } from '@/lib/pricing';
import { formatMoney, formatPrice, formatTurnaround } from '@/lib/pricing-format';
import { applicationCopy } from '@/lib/application/copy';
import { evaluationCopy } from '@/lib/application/evaluation-copy';
import { deliveryCopy } from '@/lib/application/delivery-copy';
import { quoteDelivery, type ReportDelivery } from '@/lib/application/delivery';
import { evaluationPath, evaluationServiceGroups, quoteEvaluation, selectEvaluationService, usesEducation, type EvaluationRequest } from '@/lib/application/evaluation';
import type { EducationDraft, FormErrors } from '@/lib/application/model';
import type { Locale } from '@/i18n/routing';
import s from './application.module.css';

export function EvaluationServices({ locale, value, educations, errors, onChange }: {
  locale: Locale; value: EvaluationRequest; educations: EducationDraft[]; errors: FormErrors; onChange: (value: EvaluationRequest) => void;
}) {
  const c = evaluationCopy[locale];
  const common = applicationCopy[locale];
  const p = useTranslations('pricing');
  const descriptions = useTranslations('evaluationApplication.serviceNotes');
  const icons = { document: FileCheck2, course: BookOpen };
  const quote = quoteEvaluation(value, educations.length);
  return <section className={s.section} aria-labelledby="evaluation-services-title">
    <h3 id="evaluation-services-title">{c.title} <span className={s.requiredMark} aria-hidden="true">*</span></h3>
    <p className={s.sectionHint} id="evaluation-services-hint">{c.hint}</p>
    {errors.evaluationRequest && <p className={s.fieldError} id="evaluation-services-error">{c.selectionError}</p>}
    <div className={s.evaluationCards} role="radiogroup" aria-required="true" aria-labelledby="evaluation-services-title" aria-describedby={errors.evaluationRequest ? 'evaluation-services-error' : 'evaluation-services-hint'}>
      {evaluationServiceGroups.map(group => {
        const choice = value.services[group.id];
        const path = evaluationPath(group.id);
        const title = p('services.' + group.id);
        const Icon = icons[group.id];
        const line = quote.lines.find(line => line.id === group.id);
        const tierError = errors[path + '.tier'];
        const educationError = errors[path + '.educationIndexes'];
        return <div key={group.id} className={s.evaluationCard + (choice.selected ? ' ' + s.evaluationSelected : '')}>
          <div className={s.evaluationCardHeader}>
            <label className={s.evaluationToggle}>
              <input type="radio" name="evaluation-service" value={group.id} checked={choice.selected} required aria-label={title} aria-controls={choice.selected ? path + '-details' : undefined} onChange={() => onChange(selectEvaluationService(value, group.id, educations.length))} />
              <span className={s.evaluationIcon}><Icon size={22} strokeWidth={1.7} aria-hidden="true" /></span>
              <span className={s.evaluationTitle}><strong>{title}</strong><span>{descriptions(group.id)}</span></span>
            </label>
            <div className={s.evaluationCardMeta}>
              <span className={s.evaluationPrice}>{p('format.from', { amount: formatPrice(group.rates[0].price, locale, p) })}</span>
              <a className={s.sampleReportLink} href={group.id === 'document' ? '/evaluation_report.pdf' : '/cbcevaluation_report.pdf'} target="_blank" rel="noopener noreferrer" aria-label={(group.id === 'document' ? common.degreeSample : common.courseSample) + ' · PDF · ' + common.sampleNewTab}>
                {c.sampleReport}<ArrowUpRight size={15} aria-hidden="true" />
              </a>
            </div>
          </div>
          {choice.selected && <div id={path + '-details'} className={s.evaluationDetails}>
            <div className={s.field}>
              <label htmlFor={path + '.tier'}>{c.turnaround}<span className={s.requiredMark} aria-hidden="true">*</span></label>
              <select id={path + '.tier'} name={path + '.tier'} value={choice.tier} required aria-label={title + ' · ' + c.turnaround} aria-invalid={Boolean(tierError)} aria-describedby={[path + '-cutoff', tierError ? path + '-tier-error' : ''].filter(Boolean).join(' ')} onChange={event => onChange({ ...value, services: { ...value.services, [group.id]: { ...choice, tier: event.target.value } } })}>
                <option value="">{c.selectTier}</option>
                {group.rates.map(rate => <option key={rate.id} value={rate.id}>{formatTurnaround(rate.turnaround!, p)}{hasEvaluationCutoff(rate) ? '*' : ''} · {formatPrice(rate.price, locale, p)}</option>)}
              </select>
              {tierError && <p className={s.fieldError} id={path + '-tier-error'}>{c.tierError}</p>}
              <p className={s.cutoffNote} id={path + '-cutoff'}>{p('notes.cutoff', { time: pricingPolicy.sameDayCutoff })}</p>
            </div>
            {usesEducation(group.id) && <fieldset className={s.qualificationChoices} aria-describedby={educationError ? path + '-education-error' : path + '-education-hint'}>
              <legend>{c.qualifications} <span className={s.requiredMark} aria-hidden="true">*</span></legend>
              <p id={path + '-education-hint'}>{c.qualificationHint}</p>
              {educations.map((education, index) => <label key={index}>
                <input type="checkbox" checked={choice.educationIndexes.includes(index)} aria-invalid={Boolean(educationError)} aria-label={title + ' · ' + common.educationRecord + ' ' + (index + 1)} onChange={event => onChange({ ...value, services: { ...value.services, [group.id]: { ...choice, educationIndexes: event.target.checked ? [...choice.educationIndexes, index] : choice.educationIndexes.filter(item => item !== index) } } })} />
                <span><strong>{education.degree.trim() || common.educationRecord + ' ' + (index + 1)}</strong><small>{education.school.trim() || common.notEntered}</small></span>
              </label>)}
              {educationError && <p className={s.fieldError} id={path + '-education-error'}>{c.educationError}</p>}
              <p className={s.degreePriceNote}>{c.included} {c.additional.replace('{amount}', formatMoney(evaluationAdditionalDegree[group.id], locale))}</p>
            </fieldset>}
            <div className={s.serviceSubtotal}><span>{c.serviceTotal}</span><strong>{line?.totalCents != null ? formatMoney(line.totalCents / 100, locale) : '—'}</strong></div>
          </div>}
        </div>;
      })}
    </div>
    <div className={s.evaluationExtras}>
      <label className={s.extraChoice}><input type="checkbox" checked={value.translation} onChange={event => onChange({ ...value, translation: event.target.checked })} /><Languages size={20} aria-hidden="true" /><span><strong>{c.translation}</strong><small>{c.translationHint}</small></span></label>
    </div>
  </section>;
}

export function EvaluationFees({ locale, value, delivery, educations, compact = false }: { locale: Locale; value: EvaluationRequest; delivery: ReportDelivery; educations: EducationDraft[]; compact?: boolean }) {
  const c = evaluationCopy[locale];
  const dc = deliveryCopy[locale];
  const common = applicationCopy[locale];
  const p = useTranslations('pricing');
  const quote = quoteEvaluation(value, educations.length);
  const deliveryQuote = quoteDelivery(delivery);
  const money = (cents: number) => formatMoney(cents / 100, locale);
  const range = (min: number, max: number) => min === max ? money(min) : money(min) + '–' + money(max);
  return <div className={s.evaluationFees + (compact ? ' ' + s.compactFees : '')}>
    {compact && <h3>{c.fees}</h3>}
    {!quote.lines.length && !value.translation && <p className={s.feeNote}>{c.empty}</p>}
    <ul className={s.feeLines}>{quote.lines.map(line => <li key={line.id}>
      <div className={s.feeLineHeading}><strong>{p('services.' + line.id)}</strong><span>{line.totalCents === null ? '—' : money(line.totalCents)}</span></div>
      <p>{line.rate ? formatTurnaround(line.rate.turnaround!, p) + (hasEvaluationCutoff(line.rate) ? '*' : '') : c.selectTier}{usesEducation(line.id) && ' · ' + c.count.replace('{count}', String(line.educationIndexes.length))}</p>
      {hasEvaluationCutoff(line.rate) && <p>{p('notes.cutoff', { time: pricingPolicy.sameDayCutoff })}</p>}
      {!compact && <>
        {usesEducation(line.id) && <div className={s.linkedEducation}><span>{c.linkedEducation}</span><ul>{line.educationIndexes.map(index => <li key={index}>{educations[index].degree.trim() || common.educationRecord + ' ' + (index + 1)}<small>{educations[index].school}</small></li>)}</ul></div>}
        <dl className={s.feeBreakdown}><div><dt>{c.baseFee}</dt><dd>{line.baseCents === null ? '—' : money(line.baseCents)}</dd></div>{line.additionalCount > 0 && <div><dt>{c.additionalFees} × {line.additionalCount}</dt><dd>{money(line.additionalCents)}</dd></div>}</dl>
      </>}
    </li>)}{deliveryQuote.lines.map(line => <li key={line.rate.id}>
      <div className={s.feeLineHeading}><strong>{p('services.' + line.rate.label)}{line.quantity > 1 ? ' × ' + line.quantity : ''}</strong><span>{range(line.minCents, line.maxCents)}</span></div>
      {line.rate.turnaround && <p>{formatTurnaround(line.rate.turnaround, p)}</p>}
    </li>)}</ul>
    {value.translation && <ul className={s.pendingFees}>
      {value.translation && <li><span>{c.translation}</span><strong>{c.awaitingQuote}</strong></li>}
    </ul>}
    <div className={s.quoteTotal}><span>{c.subtotal}</span><strong>{quote.hasPricedServices ? range(quote.subtotalCents + deliveryQuote.minCents, quote.subtotalCents + deliveryQuote.maxCents) : '—'}</strong></div>
    {quote.incomplete && <p className={s.feeNote}>{c.incomplete}</p>}
    {deliveryQuote.incomplete && <p className={s.feeNote}>{dc.incomplete}</p>}
    {deliveryQuote.needsQuote && <p className={s.feeNote}>{dc.rangeNote}</p>}
    {quote.needsQuote && quote.hasPricedServices && <p className={s.feeNote}>{c.pending}</p>}
    <p className={s.feeNote}>{c.feeScope}</p>
  </div>;
}
