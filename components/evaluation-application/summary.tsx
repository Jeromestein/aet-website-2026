'use client';
import { useTranslations } from 'next-intl';
import { formatMoney, formatTurnaround } from '@/lib/pricing-format';
import type { Quote } from '@/lib/evaluation-application/domain';
import s from './application.module.css';

export function QuoteSummary({ value, locale }: { value: Quote; locale: string }) {
  const t = useTranslations('evaluationApplication');
  const p = useTranslations('pricing');
  const money = (min: number, max = min) => min === max ? formatMoney(min / 100, locale) : `${formatMoney(min / 100, locale)}–${formatMoney(max / 100, locale)}`;
  return <section className={s.summary} aria-labelledby="quote-title">
    <p className={s.eyebrow}>{t('estimateLabel')}</p><h2 id="quote-title">{t('summary')}</h2>
    <dl>{value.lines.map(line => {
      return <div key={line.id}><dt>{['documentAdditional', 'courseAdditional'].includes(line.id) ? t(line.id) : p(`services.${line.id}`)}{line.quantity > 1 && ` × ${line.quantity}`}{line.turnaround && <small>{formatTurnaround(line.turnaround, p)}</small>}</dt><dd>{money(line.min, line.max)}</dd></div>;
    })}</dl>
    <div className={s.total}><span>{t(value.needsQuote ? 'knownSubtotal' : 'estimatedTotal')}</span><strong>{money(value.min, value.max)}</strong></div>
    <p className={s.hint}>{t(value.needsQuote ? 'quoteNote' : 'estimateNote')}</p>
    <a href={(locale === 'en' ? '' : `/${locale}`) + '/pricing#evaluation'} target="_blank" rel="noreferrer">{t('viewPrices')}</a>
    <p className={s.hint}>{t('noCharge')}</p>
  </section>;
}
