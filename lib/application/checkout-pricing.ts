// Application quotes are in USD cents. Gross up once so that the service
// subtotal remains after the 2.9% processing fee and fixed 30-cent charge.
export const PROCESSING_FIXED_CENTS = 30;
export const NET_PER_THOUSAND = 971;

export function checkoutTotal(base: number): number {
  return base === 0 ? 0 : Math.round((base + PROCESSING_FIXED_CENTS) * 1000 / NET_PER_THOUSAND);
}

export function applicationLineItems(name: string, base: number, total: number) {
  if (!Number.isSafeInteger(base) || !Number.isSafeInteger(total) || base <= 0 || total < base) {
    throw new Error('Invalid application payment amounts');
  }
  const item = (label: string, cents: number) => ({
    price_data: { currency: 'usd', product_data: { name: label }, unit_amount: cents },
    quantity: 1,
  });
  const items = [item(name, base)];
  if (total > base) items.push(item('Payment processing fee', total - base));
  return items;
}
