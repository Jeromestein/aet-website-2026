import { copy } from '@/lib/preeval/copy';
import { checkoutTotal } from '@/lib/application/checkout-pricing';
import s from '@/components/customer-status/status.module.css';

const serviceLabel: Record<string, string> = {
  en: 'Services and delivery', zh: '服务及配送', es: 'Servicios y envío',
};

export function PaymentTotals({ locale, base, total = checkoutTotal(base) }: {
  locale: string; base: number; total?: number;
}) {
  const labels = copy(locale);
  const currency = new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' });
  return <dl className={s.feeLines}>
    <div><dt>{serviceLabel[locale] ?? serviceLabel.en}</dt><dd>{currency.format(base / 100)}</dd></div>
    {total > base && <div><dt>{labels.fee}</dt><dd>{currency.format((total - base) / 100)}</dd></div>}
    <div className={s.feeTotal}><dt>{labels.total}</dt><dd>{currency.format(total / 100)}</dd></div>
  </dl>;
}
