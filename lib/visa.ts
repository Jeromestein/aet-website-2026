import { visaFees } from '@/lib/pricing';

/** Interpolate numbers only into reviewed static source HTML; preserve its wording. */
export function renderVisaPrices(html: string) {
  return html.replace(/\{\{visa:(\w+)\}\}/g, (_, key: string) => {
    if (!(key in visaFees)) throw new Error(`Unknown Visa fee: ${key}`);
    return String(visaFees[key as keyof typeof visaFees]);
  });
}
