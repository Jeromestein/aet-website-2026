import { z } from 'zod';
import { isCountryCode, regionOptions } from '@/lib/legacy-application/countries';
import { evaluationReports, shipping, type Rate } from '@/lib/pricing';

const text = z.string().max(300);
export const deliverySchema = z.object({
  report: z.enum(['pdf', 'paper']), extraCopies: z.number().int().min(0).max(20), shipping: text,
  address: z.object({ name: text, country: text, street: text, street2: text, city: text, region: text, postal: text }),
});
export type ReportDelivery = z.infer<typeof deliverySchema>;
export type DeliveryError = 'required' | 'country' | 'shipping' | 'postal' | 'copies';
export const emptyDelivery = (): ReportDelivery => ({
  report: 'pdf', extraCopies: 0, shipping: '',
  address: { name: '', country: '', street: '', street2: '', city: '', region: '', postal: '' },
});
export const reportFormats = evaluationReports.filter(rate => rate.id === 'pdf' || rate.id === 'paper');
export const extraReportRate = evaluationReports.find(rate => rate.id === 'extraCopy')!;
export const deliveryPath = (field: string) => `evaluationDelivery.${field}`;
export const shippingOptions = (country: string) => isCountryCode(country)
  ? shipping.filter(rate => rate.id.startsWith(country === 'US' ? 'domestic' : 'international')) : [];

export function selectReport(delivery: ReportDelivery, report: ReportDelivery['report']): ReportDelivery {
  return { ...delivery, report, ...(report === 'pdf' ? { shipping: '', extraCopies: 0 } : {}) };
}
export function selectDeliveryCountry(delivery: ReportDelivery, country: string): ReportDelivery {
  return { ...delivery, address: { ...delivery.address, country, region: country === delivery.address.country ? delivery.address.region : '' },
    shipping: shippingOptions(country).some(rate => rate.id === delivery.shipping) ? delivery.shipping : '' };
}
export function validateDelivery(delivery: ReportDelivery): Record<string, DeliveryError> {
  const errors: Record<string, DeliveryError> = {};
  if (delivery.report === 'pdf') return errors;
  for (const field of ['name', 'country', 'street', 'city'] as const) {
    if (!delivery.address[field].trim()) errors[deliveryPath('address.' + field)] = 'required';
  }
  if (delivery.address.country && !isCountryCode(delivery.address.country)) errors[deliveryPath('address.country')] = 'country';
  if (delivery.address.country === 'US') {
    if (!regionOptions('US').some(region => region.value === delivery.address.region)) errors[deliveryPath('address.region')] = 'required';
    if (!/^\d{5}(-\d{4})?$/.test(delivery.address.postal.trim())) errors[deliveryPath('address.postal')] = 'postal';
  }
  if (!shippingOptions(delivery.address.country).some(rate => rate.id === delivery.shipping)) errors[deliveryPath('shipping')] = 'shipping';
  if (!Number.isInteger(delivery.extraCopies) || delivery.extraCopies < 0 || delivery.extraCopies > 20) errors[deliveryPath('extraCopies')] = 'copies';
  return errors;
}

export type DeliveryQuoteLine = { rate: Rate; quantity: number; minCents: number; maxCents: number };
/** Price only active report/delivery choices; hidden draft addresses incur no fees. */
export function quoteDelivery(delivery: ReportDelivery) {
  const lines: DeliveryQuoteLine[] = [];
  const add = (rate: Rate, quantity = 1) => {
    const price = rate.price;
    if (price.kind !== 'fixed' && price.kind !== 'range') return;
    lines.push({ rate, quantity,
      minCents: Math.round((price.kind === 'range' ? price.min : price.amount) * 100) * quantity,
      maxCents: Math.round((price.kind === 'range' ? price.max : price.amount) * 100) * quantity });
  };
  add(reportFormats.find(rate => rate.id === delivery.report)!);
  const mail = delivery.report === 'paper';
  const shippingRate = mail ? shippingOptions(delivery.address.country).find(rate => rate.id === delivery.shipping) : undefined;
  const validCopies = Number.isInteger(delivery.extraCopies) && delivery.extraCopies >= 0 && delivery.extraCopies <= 20;
  if (mail && validCopies && delivery.extraCopies) add(extraReportRate, delivery.extraCopies);
  if (shippingRate) add(shippingRate);
  return { lines, minCents: lines.reduce((sum, line) => sum + line.minCents, 0), maxCents: lines.reduce((sum, line) => sum + line.maxCents, 0),
    incomplete: mail && (!shippingRate || !validCopies), needsQuote: lines.some(line => line.minCents !== line.maxCents) };
}
