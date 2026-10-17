import type { Price, Turnaround } from './pricing';
type Translate = (key: string, values?: Record<string, string | number>) => string;
export function formatMoney(amount: number, locale: string) {
  return new Intl.NumberFormat(locale === 'zh' ? 'zh-CN' : locale === 'es' ? 'es-US' : 'en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2,
  }).format(amount);
}
export function formatPrice(price: Price, locale: string, t: Translate): string {
  if (price.kind === 'quote' || price.kind === 'variable') return t(`format.${price.kind}`);
  const amount = price.kind === 'range'
    ? `${formatMoney(price.min, locale)}–${formatMoney(price.max, locale)}`
    : formatMoney(price.amount, locale);
  const value = price.kind === 'from' ? t('format.from', { amount }) : amount;
  return price.unit ? t(`units.${price.unit}`, { amount: value }) : value;
}
export function formatTurnaround(time: Turnaround, t: Translate): string {
  switch (time.kind) {
    case 'businessDays': return t('format.businessDays', { count: time.value });
    case 'hours': return t('format.hours', { count: time.value });
    case 'businessDayRange': return t('format.dayRange', { min: time.min, max: time.max });
    case 'hourRange': return t('format.hourRange', { min: time.min, max: time.max });
    default: return t(`format.${time.kind}`);
  }
}
