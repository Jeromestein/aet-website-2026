import { configuration, required } from './config';

export function preEvaluationPaymentMode() {
  const production = configuration().production;
  const selected = process.env.PREEVAL_STRIPE_MODE || 'test';
  if (selected !== (production ? 'live' : 'test'))
    throw new Error('Stripe mode does not match the pre-evaluation environment');
  return production ? 'live' as const : 'test' as const;
}
export const preEvaluationPaymentTag = () => preEvaluationPaymentMode() === 'live'
  ? 'aet-2026-production' : 'aet-2026-local';
export const preEvaluationWebhookSecret = () => required(preEvaluationPaymentMode() === 'live'
  ? 'PREEVAL_STRIPE_LIVE_WEBHOOK_SECRET' : 'STRIPE_TEST_WEBHOOK_SECRET');
export const paymentModeMatches = (object: {livemode: boolean}) =>
  object.livemode === (preEvaluationPaymentMode() === 'live');
