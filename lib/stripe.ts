import 'server-only';
import { createHash } from 'node:crypto';

const apiBase = 'https://api.stripe.com/v1';
// Keep both accounts on the same tested API contract, regardless of their defaults.
const apiVersion = '2026-09-30.endive';
const source = 'aet-website-2026-payment';

export function stripePaymentMode(): 'test' | 'live' | 'disabled' {
  const mode = process.env.STRIPE_PAYMENT_MODE;
  if (mode === 'test' || mode === 'live') return mode;
  if (!mode && process.env.NODE_ENV === 'development') return 'test';
  return 'disabled';
}

type CheckoutSession = {
  id: string;
  url: string | null;
  livemode: boolean;
  mode: string;
  status: string;
  payment_status: string;
  metadata: Record<string, string> | null;
};

function stripeKey(office: string) {
  // The server selects the mode and account; never fall back across either.
  const mode = stripePaymentMode();
  if (mode === 'disabled') return '';
  const prefix = mode === 'live' ? 'STRIPE_LIVE' : 'STRIPE_TEST';
  switch (office) {
    case 'boston':
    case 'nyc':
      return process.env[`${prefix}_SECRET_KEY_BOS`] ?? '';
    case 'miami':
    case 'california':
      return process.env[`${prefix}_SECRET_KEY`] ?? '';
    default:
      return '';
  }
}

export function stripeAvailable(office?: string): boolean {
  if (office === undefined) {
    return ['miami', 'boston', 'california', 'nyc'].some(entry => stripeAvailable(entry));
  }
  return new RegExp(`^(?:sk|rk)_${stripePaymentMode()}_[A-Za-z0-9]+$`).test(stripeKey(office));
}

export function stripeAmount(amount: string) {
  if (!/^\d{1,6}(?:\.\d{1,2})?$/.test(amount)) return null;
  const [dollars, cents = ''] = amount.split('.');
  const total = Number(dollars) * 100 + Number(cents.padEnd(2, '0'));
  return total >= 50 && total <= 99_999_999 ? total : null;
}

function returnBase(requestUrl: string) {
  const request = new URL(requestUrl);
  const local = process.env.NODE_ENV !== 'production' && request.hostname === 'localhost';
  const live = stripePaymentMode() === 'live';
  const configured = live ? process.env.PAYMENT_SITE_URL
    : process.env.STRIPE_TEST_SITE_URL || (local ? request.origin : process.env.PAYMENT_SITE_URL);
  if (!configured) throw new Error('Stripe return URL is not configured.');
  const url = new URL(configured);
  if ((url.protocol !== 'https:' && !(!live && url.protocol === 'http:' && url.hostname === 'localhost')) ||
      (live && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('Invalid Stripe return URL.');
  }
  return url.origin;
}

async function stripeRequest(office: string, path: string, body?: URLSearchParams, idempotencyKey?: string): Promise<CheckoutSession> {
  if (!stripeAvailable(office)) throw new Error('Stripe key is not configured for this office.');
  const response = await fetch(`${apiBase}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${stripeKey(office)}`,
      'Stripe-Version': apiVersion,
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
      ...(body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
    },
    body,
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });
  // Never return Stripe's raw error response or customer data to the browser.
  if (!response.ok) throw new Error('Stripe request failed.');
  return response.json();
}

export async function createStripeCheckout(input: {
  amount: string; email: string; name: string; serviceDetails: string;
  office: string; service: string; locale: string; requestUrl: string; token: string;
}) {
  const mode = stripePaymentMode();
  const live = mode === 'live';
  if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(input.token)) throw new Error('Invalid checkout token.');
  const cents = stripeAmount(input.amount);
  if (cents === null) throw new Error('Invalid Stripe amount.');
  const base = returnBase(input.requestUrl);
  const prefix = input.locale === 'en' ? '' : `/${input.locale}`;
  const result = `${base}${prefix}/payment/result?provider=stripe&office=${encodeURIComponent(input.office)}`;
  const fields = new URLSearchParams({
    mode: 'payment',
    'allowed_payment_method_types[0]': 'card',
    'line_items[0][price_data][currency]': 'usd',
    'line_items[0][price_data][unit_amount]': String(cents),
    'line_items[0][price_data][product_data][name]': live ? 'AET services' : 'AET services — test payment',
    'line_items[0][quantity]': '1',
    customer_email: input.email,
    locale: input.locale,
    success_url: `${result}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${result}&state=cancelled`,
    'metadata[source]': source,
    'metadata[customer_name]': input.name,
    'metadata[service_details]': input.serviceDetails,
    'metadata[office]': input.office,
    'metadata[service]': input.service,
    'payment_intent_data[metadata][source]': source,
    'payment_intent_data[metadata][customer_name]': input.name,
    'payment_intent_data[metadata][service_details]': input.serviceDetails,
    'payment_intent_data[metadata][office]': input.office,
    'payment_intent_data[metadata][service]': input.service,
  });
  // Identical retries from this form reuse a session; changed details get a new key.
  const digest = createHash('sha256').update(fields.toString()).digest('hex');
  const session = await stripeRequest(input.office, '/checkout/sessions', fields, `aet-${mode}-${input.office}-${input.token}-${digest}`);
  if (session.livemode !== live || !session.id?.startsWith(`cs_${mode}_`) || !session.url) {
    throw new Error('Expected a Stripe Checkout Session.');
  }
  const checkout = new URL(session.url);
  if (checkout.protocol !== 'https:' || checkout.hostname !== 'checkout.stripe.com' || checkout.username || checkout.password) {
    throw new Error('Invalid Stripe Checkout URL.');
  }
  return checkout.href;
}

export async function stripeResult(sessionId: string | undefined, office: string | undefined): Promise<'paid' | 'unpaid' | 'unverified'> {
  const mode = stripePaymentMode();
  if (!sessionId || !new RegExp(`^cs_${mode}_[A-Za-z0-9]{1,200}$`).test(sessionId) || !office || !stripeAvailable(office)) return 'unverified';
  try {
    const session = await stripeRequest(office, `/checkout/sessions/${encodeURIComponent(sessionId)}`);
    if (session.id !== sessionId || session.livemode !== (mode === 'live') || session.mode !== 'payment' ||
        !(session.metadata?.source === source || (mode === 'test' && session.metadata?.source === `${source}-test`)) || session.metadata.office !== office) {
      return 'unverified';
    }
    return session.status === 'complete' && session.payment_status === 'paid' ? 'paid' : 'unpaid';
  } catch {
    return 'unverified';
  }
}
