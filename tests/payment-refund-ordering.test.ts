import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import postgres from 'postgres';
import type Stripe from 'stripe';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// Explicit opt-in only. Never load .env.local or connect to the business database.
const url = process.env.AET_REFUND_TEST_DATABASE_URL;
if (url) {
  const parsed = new URL(url);
  if (!['127.0.0.1', 'localhost'].includes(parsed.hostname) || parsed.pathname !== '/aet_refund_test')
    throw new Error('Refund tests require a disposable local aet_refund_test database.');
}
const m = vi.hoisted(() => ({ sql: null as unknown as ReturnType<typeof postgres>, prefix: '',
  list: vi.fn(), retrieve: vi.fn(), intent: vi.fn(), resultEmail: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('stripe', () => ({ default: class {
  checkout = { sessions: { list: m.list, retrieve: m.retrieve } };
  paymentIntents = { retrieve: m.intent };
} }));
vi.mock('../lib/preeval/db', () => ({ db: () => m.sql,
  table: (name: string) => m.sql(m.prefix + name) }));
vi.mock('../lib/preeval/config', () => ({ configuration: () => ({ recipient: 'refund@example.invalid' }),
  required: () => 'sk_test_mock', requireExternalServices: () => {} }));
vi.mock('../lib/preeval/email', () => ({ applicationEmail: m.resultEmail }));
import * as preeval from '../lib/preeval/payments';
import * as formal from '../lib/evaluation-application/payments';
import { TOTAL_CENTS } from '../lib/preeval/domain';

const flows = [
  { scope: 'preeval', pilot: 'aet-2026-local', amount: TOTAL_CENTS, api: preeval },
  { scope: 'evaluation', pilot: 'aet-formal-2026-local', amount: 11000, api: formal },
] as const;

describe.skipIf(!url)('F1 refund ordering with PostgreSQL and mocked providers', () => {
  beforeAll(async () => {
    m.prefix = 'refund_' + randomUUID().replaceAll('-', '') + '_';
    m.sql = postgres(url!, { max: 5, connect_timeout: 3, onnotice: () => {}, connection: { statement_timeout: 5000 } });
    // Migrate only unique test schemas; the existing schemas are never touched.
    for (const file of ['20261002000100_pre_evaluation.sql', '20261002000200_formal_evaluation.sql',
      '20261002000300_evaluation_workflow.sql', '20261020173355_formal_email_delivery_records.sql',
      '20261020232924_preeval_gpt_analysis.sql']) {
      const migration = await readFile(new URL('../supabase/migrations/' + file, import.meta.url), 'utf8');
      await m.sql.unsafe(migration.replace(/\bpreeval\b/g, m.prefix + 'preeval').replace(/\bevaluation\b/g, m.prefix + 'evaluation'));
    }
  });
  afterAll(async () => {
    if (!m.sql) return;
    for (const schema of ['preeval', 'evaluation']) await m.sql`drop schema if exists ${m.sql(m.prefix + schema)} cascade`;
    await m.sql.end();
  });

  for (const { scope, pilot, amount, api } of flows) describe(scope, () => {
    let id: string, paymentId: string, session: Stripe.Checkout.Session, charge: Stripe.Charge;
    const table = (name: string) => m.sql(m.prefix + scope + '.' + name);
    const event = (refund = amount, eventId = 'evt_' + randomUUID()) => ({
      id: eventId, type: 'charge.refunded', livemode: false,
      data: { object: { ...charge, amount_refunded: refund } },
    }) as Stripe.Event;
    const paid = (eventId = 'evt_' + randomUUID()) => api.applyCheckout(session, id + eventId, 'checkout.session.completed');
    const state = async () => ({
      app: (await m.sql`select * from ${table('applications')} where id=${id}`)[0],
      payment: (await m.sql`select * from ${table('payments')} where id=${paymentId}`)[0],
    });
    const refunds = async () => (await m.sql`select * from ${table('audit')} where application_id=${id} and action in ('refunded','partially_refunded')`);
    const receipts = async () => scope === 'evaluation'
      ? await m.sql`select * from ${table('emails')} where application_id=${id}` : [];
    const expectRefund = async (value: number) => {
      const status = value === amount ? 'refunded' : 'partially_refunded';
      const rows = await state();
      expect(rows.payment).toMatchObject({ status, refunded_cents: value, payment_intent: 'pi_' + id });
      expect(rows.app.payment_status).toBe(status);
      if (scope === 'evaluation') expect(rows.app.released_file_id).toBeNull();
    };
    beforeEach(async () => {
      vi.clearAllMocks(); m.list.mockReset(); m.retrieve.mockReset(); m.intent.mockReset();
      id = randomUUID(); paymentId = randomUUID();
      if (scope === 'preeval') {
        await m.sql`insert into ${table('applications')}(id,request_id,request_hash,email,first_name,last_name,country,locale,payment_status,result,ai_status)
          values (${id},${randomUUID()},'test','refund@example.invalid','Test','Refund','US','en','pending','{}','completed')`;
      } else {
        await m.sql`insert into ${table('applications')}(id,request_id,request_hash,access_hash,locale,data,quote,payment_status)
          values (${id},${randomUUID()},'test','test','en','{}',${m.sql.json({ min: amount, max: amount, needsQuote: false })},'pending')`;
      }
      await m.sql`insert into ${table('payments')}(id,application_id,session_id,amount_cents,status)
        values (${paymentId},${id},${'cs_' + id},${amount},'open')`;
      session = { id: 'cs_' + id, livemode: false, mode: 'payment', client_reference_id: id,
        metadata: { pilot, applicationId: id }, currency: 'usd', amount_total: amount,
        payment_status: 'paid', status: 'complete', payment_intent: 'pi_' + id } as unknown as Stripe.Checkout.Session;
      charge = { id: 'ch_' + id, livemode: false, currency: 'usd', amount, amount_refunded: 0,
        payment_intent: 'pi_' + id } as Stripe.Charge;
      m.list.mockImplementation(async () => ({ data: [session], has_more: false }));
      m.retrieve.mockImplementation(async () => session);
      m.intent.mockImplementation(async () => ({ id: 'pi_' + id, livemode: false, status: 'succeeded',
        amount, currency: 'usd', latest_charge: { ...charge } }));
    });

    it.each([100, 'full'] as const)('refund first (%s), duplicates and late checkout never restore paid', async value => {
      const refunded = value === 'full' ? amount : value;
      const refund = event(refunded);
      await api.handleStripeEvent(refund);
      expect(m.list).toHaveBeenCalledWith({ payment_intent: 'pi_' + id, limit: 2 });
      await api.handleStripeEvent(refund);
      // Even a stale provider snapshot must not decrease the recorded refund.
      await paid('late'); await paid('late'); await api.reconcile(id);
      await expectRefund(refunded);
      expect(await refunds()).toHaveLength(1);
      expect(await receipts()).toHaveLength(0);
      expect(m.resultEmail).not.toHaveBeenCalled();
    });
    it.each([100, 'full'] as const)('payment first (%s), refund repeats and stale events are monotonic', async value => {
      const refunded = value === 'full' ? amount : value;
      await paid('first'); await paid('first'); await paid('other-success');
      expect((await state()).app.payment_status).toBe('paid');
      if (scope === 'evaluation') {
        expect(await receipts()).toHaveLength(1);
        await m.sql`update ${table('applications')} set status='completed',released_file_id=${randomUUID()} where id=${id}`;
      } else expect((await state()).app.status).toBe('completed');
      m.resultEmail.mockClear();
      const refund = event(refunded);
      await api.handleStripeEvent(refund); await api.handleStripeEvent(refund);
      await api.handleStripeEvent(event(50)); await paid();
      await expectRefund(refunded);
      expect(await refunds()).toHaveLength(1);
      expect(m.list).not.toHaveBeenCalled();
      expect(m.resultEmail).not.toHaveBeenCalled();
      if (scope === 'evaluation') expect((await state()).app.status).toBe('reviewing');
    });
    it('advances partial to full and rejects an older partial snapshot', async () => {
      await api.handleStripeEvent(event(100)); await api.handleStripeEvent(event(amount));
      await api.handleStripeEvent(event(50)); await paid();
      await expectRefund(amount); expect(await refunds()).toHaveLength(2);
    });
    it('reconciliation discovers refunds without webhook delivery, even with the same reconciliation key', async () => {
      await api.reconcile(id);
      expect((await state()).app.payment_status).toBe('paid');
      m.resultEmail.mockClear();
      charge.amount_refunded = 100;
      await api.reconcile(id); await expectRefund(100);
      charge.amount_refunded = amount;
      await api.reconcile(id); await expectRefund(amount);
      expect(await refunds()).toHaveLength(2);
      expect(m.resultEmail).not.toHaveBeenCalled();
    });
    it.each([100, 'full'] as const)('checkout sees a prior provider refund (%s) before its webhook arrives', async value => {
      charge.amount_refunded = value === 'full' ? amount : value;
      await paid(); await expectRefund(charge.amount_refunded);
      expect(await receipts()).toHaveLength(0); expect(m.resultEmail).not.toHaveBeenCalled();
    });
    it('does not acknowledge an unresolved refund, and succeeds when retried', async () => {
      const refund = event();
      m.list.mockResolvedValueOnce({ data: [], has_more: false });
      await expect(api.handleStripeEvent(refund)).rejects.toMatchObject({ status: 409 });
      expect(await m.sql`select id from ${table('payment_events')} where id=${refund.id}`).toHaveLength(0);
      await api.handleStripeEvent(refund); await expectRefund(amount);
    });
    it('waits for the local checkout row rather than discarding the refund', async () => {
      const refund = event();
      await m.sql`update ${table('payments')} set session_id=null where id=${paymentId}`;
      await expect(api.handleStripeEvent(refund)).rejects.toThrow('unresolved_refund');
      await m.sql`update ${table('payments')} set session_id=${session.id} where id=${paymentId}`;
      await api.handleStripeEvent(refund); await expectRefund(amount);
    });
    it('provider failure rolls back the event and blocks publication until retry', async () => {
      m.intent.mockRejectedValueOnce(new Error('provider unavailable'));
      await expect(paid('retry')).rejects.toThrow('provider unavailable');
      expect((await state()).app.payment_status).toBe('pending');
      expect(await m.sql`select id from ${table('payment_events')} where id=${id + 'retry'}`).toHaveLength(0);
      expect(m.resultEmail).not.toHaveBeenCalled(); expect(await receipts()).toHaveLength(0);
      charge.amount_refunded = amount;
      await paid('retry'); await expectRefund(amount);
    });
    it('refund association failure is retryable and does not record the event', async () => {
      const refund = event(); m.list.mockRejectedValueOnce(new Error('lookup unavailable'));
      await expect(api.handleStripeEvent(refund)).rejects.toThrow('lookup unavailable');
      expect(await m.sql`select id from ${table('payment_events')} where id=${refund.id}`).toHaveLength(0);
      await api.handleStripeEvent(refund); await expectRefund(amount);
    });
    it.each([-1, 0, 0.5, 'over'] as const)('rejects invalid refunded amount %s', async value => {
      await expect(api.handleStripeEvent(event(value === 'over' ? amount + 1 : value))).rejects.toThrow('invalid_payment');
      expect((await state()).app.payment_status).toBe('pending');
    });
    it.each(['currency', 'amount', 'reference', 'intent', 'mode'] as const)('rejects an invalid provider association: %s', async field => {
      if (field === 'currency') session.currency = 'eur';
      if (field === 'amount') session.amount_total = 1;
      if (field === 'reference') session.client_reference_id = randomUUID();
      if (field === 'intent') session.payment_intent = 'pi_wrong';
      if (field === 'mode') session.mode = 'subscription';
      await expect(api.handleStripeEvent(event())).rejects.toThrow('invalid_payment');
      expect((await state()).app.payment_status).toBe('pending');
    });
    it('ignores only a provider-confirmed session from another payment flow', async () => {
      session.metadata = { pilot: 'another-flow', applicationId: id };
      await api.handleStripeEvent(event());
      expect((await state()).app.payment_status).toBe('pending'); expect(await refunds()).toHaveLength(0);
    });
    it('rejects ambiguous provider lookup', async () => {
      m.list.mockResolvedValueOnce({ data: [session, session], has_more: false });
      await expect(api.handleStripeEvent(event())).rejects.toThrow('unresolved_refund');
    });
    it.each(['currency', 'amount', 'intent', 'live', 'missing-charge', 'unexpanded-charge', 'not-succeeded'] as const)('blocks checkout on an invalid current payment: %s', async field => {
      const current = { id: 'pi_' + id, livemode: false, status: 'succeeded', amount, currency: 'usd', latest_charge: { ...charge } };
      if (field === 'currency') current.latest_charge.currency = 'eur';
      if (field === 'amount') current.latest_charge.amount = 1;
      if (field === 'intent') current.latest_charge.payment_intent = 'pi_wrong';
      if (field === 'live') current.livemode = true;
      if (field === 'not-succeeded') current.status = 'processing';
      m.intent.mockResolvedValueOnce({ ...current,
        latest_charge: field === 'missing-charge' ? null : field === 'unexpanded-charge' ? charge.id : current.latest_charge });
      await expect(paid()).rejects.toThrow('invalid_payment');
      expect((await state()).app.payment_status).toBe('pending');
      expect(await receipts()).toHaveLength(0); expect(m.resultEmail).not.toHaveBeenCalled();
    });
    it('accepts expanded payment intent references', async () => {
      charge.payment_intent = { id: 'pi_' + id } as Stripe.PaymentIntent;
      session.payment_intent = { id: 'pi_' + id } as Stripe.PaymentIntent;
      await api.handleStripeEvent(event(100)); await paid(); await expectRefund(100);
    });
    if (scope === 'preeval') it.each(['missing-result', 'ai-running', 'uploads-pending', 'needs_information', 'cancelled'])('preserves the result publication gate: %s', async blocked => {
      if (blocked === 'missing-result') await m.sql`update ${table('applications')} set result=null where id=${id}`;
      if (blocked === 'ai-running') await m.sql`update ${table('applications')} set ai_status='running' where id=${id}`;
      if (blocked === 'uploads-pending') await m.sql`update ${table('applications')} set uploads_pending=true where id=${id}`;
      if (blocked === 'needs_information' || blocked === 'cancelled') await m.sql`update ${table('applications')} set status=${blocked} where id=${id}`;
      await paid();
      expect((await state()).app.payment_status).toBe('paid');
      expect((await state()).app.status).not.toBe('completed');
      expect(m.resultEmail).not.toHaveBeenCalled();
    });
    it('does not relink a payment to another intent', async () => {
      await m.sql`update ${table('payments')} set payment_intent='pi_other' where id=${paymentId}`;
      await expect(api.handleStripeEvent(event())).rejects.toThrow('invalid_payment');
      await expect(paid()).rejects.toThrow('invalid_payment');
    });
    it('rejects live events before database or provider access', async () => {
      await expect(api.handleStripeEvent({ ...event(), livemode: true })).rejects.toThrow('live_event_rejected');
      expect(m.list).not.toHaveBeenCalled(); expect((await state()).app.payment_status).toBe('pending');
    });
    it('rejects a refund without an intent instead of acknowledging it', async () => {
      charge.payment_intent = null;
      await expect(api.handleStripeEvent(event())).rejects.toThrow('unresolved_refund');
    });
    it('stale expiry and async-failure events cannot clear a refund', async () => {
      await api.handleStripeEvent(event(100));
      await api.applyCheckout({ ...session, status: 'expired', payment_status: 'unpaid' }, 'expired', 'checkout.session.expired');
      await api.applyCheckout({ ...session, payment_status: 'unpaid' }, 'failed', 'checkout.session.async_payment_failed');
      await expectRefund(100);
    });
    it('concurrent refund and checkout use compatible row locks and never restore paid', async () => {
      charge.amount_refunded = amount;
      await Promise.all([api.handleStripeEvent(event()), paid(), api.reconcile(id)]);
      await expectRefund(amount);
      expect(await refunds()).toHaveLength(1); expect(await receipts()).toHaveLength(0);
      expect(m.resultEmail).not.toHaveBeenCalled();
    });
    it('concurrent partial, full and duplicate refunds keep the maximum amount', async () => {
      const refund = event(amount);
      await Promise.all([api.handleStripeEvent(event(100)), api.handleStripeEvent(refund), api.handleStripeEvent(refund)]);
      await expectRefund(amount);
      expect((await refunds()).length).toBeLessThanOrEqual(2);
    });
  });
});
