import { useLocale, useTranslations } from 'next-intl';
import { formatPrice, formatTurnaround } from '@/lib/pricing-format';
import { pricingPolicy, type Rate } from '@/lib/pricing';
import styles from './pricing.module.css';

/** Reusable on Pricing and service pages; accepts shared catalog records. */
export function PricingTable({ rates, caption, showService = true, showTime = true, showNotes = false, showTracking = false }: {
  rates: readonly Rate[]; caption: string; showService?: boolean; showTime?: boolean; showNotes?: boolean; showTracking?: boolean;
}) {
  const t = useTranslations('pricing');
  const locale = useLocale();
  return <div className={styles.tableWrap}>
    <table className={styles.table}>
      <caption className={styles.srOnly}>{caption}</caption>
      <thead><tr>
        {showService && <th scope="col">{t('columns.service')}</th>}
        <th scope="col">{t('columns.price')}</th>
        {showTime && <th scope="col">{t(showTracking ? 'columns.shippingTime' : 'columns.time')}</th>}
        {showNotes && <th scope="col">{t('columns.notes')}</th>}
        {showTracking && <th scope="col">{t('columns.tracking')}</th>}
      </tr></thead>
      <tbody>{rates.map(rate => <tr key={rate.id}>
        {showService && <th scope="row">{t(`services.${rate.label}`)}</th>}
        <td className={styles.price} data-label={t('columns.price')}>{formatPrice(rate.price, locale, t)}</td>
        {showTime && <td data-label={t(showTracking ? 'columns.shippingTime' : 'columns.time')}>{rate.turnaround ? formatTurnaround(rate.turnaround, t) : t('format.notApplicable')}</td>}
        {showNotes && <td className={styles.rateNote} data-label={t('columns.notes')}>{rate.note && t(`notes.${rate.note}`, {
          simultaneousMinimumHours: pricingPolicy.simultaneousMinimumHours,
          telephoneMinimumHours: pricingPolicy.telephoneMinimumHours,
        })}</td>}
        {showTracking && <td data-label={t('columns.tracking')}>{t(rate.tracking ? 'format.yes' : 'format.no')}</td>}
      </tr>)}</tbody>
    </table>
  </div>;
}
