import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../lib/preeval/db', () => ({ db: vi.fn(), table: (name: string) => name }));
vi.mock('../lib/preeval/email', () => ({ applicationEmail: vi.fn() }));
import { stripeClient, handleStripeEvent, canVerifyPreEvaluationPayment } from '../lib/preeval/payments';
import { CLOUD_PROJECT, PREVIEW_ROLE, requireExternalServices } from '../lib/preeval/config';
import type Stripe from 'stripe';

beforeEach(() => {
  vi.stubEnv('APP_ENV', 'local');
  vi.stubEnv('APP_ORIGIN', 'http://localhost:3022');
  vi.stubEnv('APPLICATION_TEST_EMAIL', 'test@example.invalid');
  vi.stubEnv('STAFF_LEGACY_MIGRATION_ENABLED', 'false');
  vi.stubEnv('STAFF_AUTH_CUTOVER_ENABLED', 'false');
  vi.stubEnv('APPLICATION_DATABASE_MODE', 'cloud-preview');
  vi.stubEnv('APPLICATION_DATABASE_URL', `postgresql://${PREVIEW_ROLE}.${CLOUD_PROJECT}:test@aws-0-us-west-1.pooler.supabase.com:6543/postgres`);
  vi.stubEnv('STRIPE_TEST_SECRET_KEY', 'sk_test_synthetic');
  vi.stubEnv('PREEVAL_STRIPE_TEST_ENABLED', 'true');
});
afterEach(() => vi.unstubAllEnvs());

describe('pre-evaluation Stripe test containment', () => {
  it.each(['', 'false', '1'])('keeps preview closed without the explicit true opt-in (%s)', value => {
    vi.stubEnv('PREEVAL_STRIPE_TEST_ENABLED', value);
    expect(() => stripeClient('pre-evaluation')).toThrow('External services are disabled');
    expect(canVerifyPreEvaluationPayment()).toBe(false);
  });
  it.each(['sk_test_synthetic', 'rk_test_synthetic'])('permits the selected test key type (%s)', key => {
    vi.stubEnv('STRIPE_TEST_SECRET_KEY', key);
    expect(stripeClient('pre-evaluation').checkout.sessions).toBeDefined();
    expect(canVerifyPreEvaluationPayment()).toBe(true);
  });
  it('does not opt formal payments or the combined worker into preview', () => {
    expect(() => stripeClient()).toThrow('External services are disabled');
    expect(() => stripeClient('formal-evaluation')).toThrow('External services are disabled');
    expect(() => requireExternalServices()).toThrow('External services are disabled');
  });
  it.each(['sk_live_synthetic', 'rk_live_synthetic', 'invalid'])('rejects non-test keys (%s)', key => {
    vi.stubEnv('STRIPE_TEST_SECRET_KEY', key);
    expect(() => stripeClient('pre-evaluation')).toThrow('Only Stripe test keys');
    expect(canVerifyPreEvaluationPayment()).toBe(false);
  });
  it('disables CRM verification when the test key is missing', () => {
    vi.stubEnv('STRIPE_TEST_SECRET_KEY', '');
    expect(canVerifyPreEvaluationPayment()).toBe(false);
  });
  it('still validates database role and approved origin when opted in', () => {
    vi.stubEnv('APP_ORIGIN', 'http://localhost:3021');
    expect(() => stripeClient('pre-evaluation')).toThrow();
    expect(canVerifyPreEvaluationPayment()).toBe(false);
    vi.stubEnv('APP_ORIGIN', 'http://localhost:3022');
    vi.stubEnv('APPLICATION_DATABASE_URL', `postgresql://postgres.${CLOUD_PROJECT}:test@aws-0-us-west-1.pooler.supabase.com:6543/postgres`);
    expect(() => stripeClient('pre-evaluation')).toThrow();
    expect(canVerifyPreEvaluationPayment()).toBe(false);
  });
  it('preserves local test-pilot behavior without the preview opt-in', () => {
    vi.stubEnv('APPLICATION_DATABASE_MODE', 'local');
    vi.stubEnv('APPLICATION_DATABASE_URL', 'postgresql://postgres:test@localhost:55422/postgres');
    vi.stubEnv('PREEVAL_STRIPE_TEST_ENABLED', 'false');
    expect(stripeClient().checkout.sessions).toBeDefined();
    expect(canVerifyPreEvaluationPayment()).toBe(true);
  });
  it('rejects live events before accessing any application', async () => {
    await expect(handleStripeEvent({ livemode: true } as Stripe.Event)).rejects.toThrow('live_event_rejected');
  });
});
