import type Stripe from 'stripe';
import { table, db } from '../preeval/db';
import { configuration } from '../preeval/config';
import { AppError } from '../preeval/domain';
import { stripeClient } from '../preeval/payments';
import { payableTotal, receiptPath, type ApplicationRecord } from './workflow';
import { queuePaymentEmail } from './email';
const pilot = 'aet-formal-2026-local';
export async function checkout(id: string) {
  const stripe = stripeClient();
  return db().begin(async tx => {
    const [app] = await tx`select * from ${table("evaluation.applications")} where id=${id} for update`;
    if (!app || app.status === 'cancelled') throw new AppError('application_locked', 409);
    if (['paid', 'partially_refunded', 'refunded'].includes(app.payment_status)) throw new AppError('already_paid', 409);
    const amount = payableTotal(app as ApplicationRecord);
    if (!amount || !Number.isSafeInteger(amount)) throw new AppError('quote_required', 409);
    const [old] = await tx`select * from ${table("evaluation.payments")} where application_id=${id} and status in ('creating','open')`;
    if (old?.session_id) {
      const previous = await stripe.checkout.sessions.retrieve(old.session_id);
      if (previous.status === 'open') return previous.url!;
      if (previous.payment_status === 'paid') throw new AppError('payment_reconciliation_required', 409);
      await tx`update ${table("evaluation.payments")} set status='expired',updated_at=now() where id=${old.id}`;
    }
    const [payment] = await tx`insert into ${table("evaluation.payments")}(application_id,amount_cents) values(${id},${amount}) returning id`;
    const session = await stripe.checkout.sessions.create({
      mode: 'payment', allowed_payment_method_types: ['card', 'alipay'],
      line_items: [{ price_data: { currency: 'usd', product_data: { name: 'Formal Credential Evaluation', description: 'Evaluation services and delivery shown on your application.' }, unit_amount: amount }, quantity: 1 }],
      client_reference_id: id, customer_email: configuration().recipient,
      metadata: { applicationId: id, paymentType: 'formal-evaluation', pilot },
      success_url: configuration().origin + receiptPath(app.locale, id) + '&checkout=success',
      cancel_url: configuration().origin + receiptPath(app.locale, id) + '&checkout=cancelled',
      expires_at: Math.floor(Date.now() / 1000) + 1800,
    }, { idempotencyKey: 'formal-checkout-' + payment.id });
    await tx`update ${table("evaluation.payments")} set session_id=${session.id},status='open',updated_at=now() where id=${payment.id}`;
    await tx`update ${table("evaluation.applications")} set payment_status='pending',version=version+1,updated_at=now() where id=${id}`;
    await tx`insert into ${table("evaluation.audit")}(application_id,actor,action,detail) values(${id},'customer','checkout.created',${tx.json({ paymentId: payment.id, amount })})`;
    return session.url!;
  });
}
export async function applyCheckout(session: Stripe.Checkout.Session, eventId: string, eventType: string) {
  if (session.livemode || session.metadata?.pilot !== pilot) return;
  const id = session.metadata.applicationId;
  if (!id) throw new AppError('invalid_payment');
  await db().begin(async tx => {
    const [app] = await tx`select * from ${table("evaluation.applications")} where id=${id} for update`;
    const [payment] = await tx`select * from ${table("evaluation.payments")} where application_id=${id} and session_id=${session.id} for update`;
    if (!app || !payment) throw new AppError('unknown_payment', 409);
    if (session.client_reference_id !== id || session.currency !== 'usd' || session.amount_total !== payment.amount_cents || payment.amount_cents !== payableTotal(app as ApplicationRecord)) throw new AppError('invalid_payment');
    if (!(await tx`insert into ${table("evaluation.payment_events")}(id,type) values(${eventId},${eventType}) on conflict do nothing returning id`).length) return;
    if (session.payment_status === 'paid' && !['refunded', 'partially_refunded'].includes(payment.status)) {
      const intent = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
      if (!intent) throw new AppError('invalid_payment');
      await tx`update ${table("evaluation.payments")} set status='paid',payment_intent=${intent},paid_at=coalesce(paid_at,now()),updated_at=now() where id=${payment.id}`;
      if (payment.status !== 'paid') await queuePaymentEmail(tx, id, payment.id);
      await tx`update ${table("evaluation.applications")} set payment_status='paid',version=version+1,updated_at=now() where id=${id} and payment_status not in ('refunded','partially_refunded')`;
    } else if ((session.status === 'expired' || eventType === 'checkout.session.async_payment_failed') && !['paid', 'refunded', 'partially_refunded'].includes(payment.status)) {
      await tx`update ${table("evaluation.payments")} set status='expired',updated_at=now() where id=${payment.id}`;
      await tx`update ${table("evaluation.applications")} set payment_status='unpaid',version=version+1,updated_at=now() where id=${id} and payment_status='pending' and not exists(select 1 from ${table("evaluation.payments")} where application_id=${id} and status in ('open','creating','paid'))`;
    }
    await tx`insert into ${table("evaluation.audit")}(application_id,actor,action,detail) values(${id},'stripe',${eventType},${tx.json({ session: session.id, paymentStatus: session.payment_status })})`;
  });
}
export async function reconcile(id: string) {
  const rows = await db()`select session_id from ${table("evaluation.payments")} where application_id=${id} and status='open' order by created_at desc limit 3`;
  for (const row of rows) {
    const session = await stripeClient().checkout.sessions.retrieve(row.session_id);
    await applyCheckout(session, `reconcile:${session.id}:${session.status}:${session.payment_status}`, 'checkout.reconciled');
  }
}
export async function handleStripeEvent(event: Stripe.Event) {
  if (event.livemode) throw new AppError('live_event_rejected');
  if (['checkout.session.completed', 'checkout.session.async_payment_succeeded', 'checkout.session.expired', 'checkout.session.async_payment_failed'].includes(event.type)) {
    await applyCheckout(event.data.object as Stripe.Checkout.Session, event.id, event.type);
  } else if (event.type === 'charge.refunded') {
    const charge = event.data.object as Stripe.Charge;
    const intent = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id;
    if (!intent) return;
    // Lock the application before its payment everywhere to avoid lock-order inversions.
    const [known] = await db()`select application_id from ${table("evaluation.payments")} where payment_intent=${intent}`;
    if (!known) return;
    await db().begin(async tx => {
      await tx`select id from ${table("evaluation.applications")} where id=${known.application_id} for update`;
      const [payment] = await tx`select * from ${table("evaluation.payments")} where payment_intent=${intent} for update`;
      if (charge.currency !== 'usd' || charge.amount !== payment.amount_cents || charge.amount_refunded <= 0 || charge.amount_refunded > charge.amount) throw new AppError('invalid_payment');
      if (!(await tx`insert into ${table("evaluation.payment_events")}(id,type) values(${event.id},${event.type}) on conflict do nothing returning id`).length) return;
      const refunded = Math.max(payment.refunded_cents, charge.amount_refunded);
      const status = refunded >= payment.amount_cents ? 'refunded' : 'partially_refunded';
      await tx`update ${table("evaluation.payments")} set status=${status},refunded_cents=${refunded},updated_at=now() where id=${payment.id}`;
      await tx`update ${table("evaluation.applications")} set payment_status=${status},status=case when status='completed' then 'reviewing' else status end,released_file_id=null,version=version+1,updated_at=now() where id=${payment.application_id}`;
      await tx`insert into ${table("evaluation.audit")}(application_id,actor,action) values(${payment.application_id},'stripe',${status})`;
    });
  }
}
export async function cancel(id: string, actor: string) {
  const paid = await db().begin(async tx => {
    const [app] = await tx`select * from ${table("evaluation.applications")} where id=${id} for update`;
    if (!app) throw new AppError('not_found', 404);
    if (['paid', 'partially_refunded', 'refunded'].includes(app.payment_status)) throw new AppError('contact_for_cancellation', 409);
    if (app.status === 'cancelled') return null;
    for (const payment of await tx`select session_id from ${table("evaluation.payments")} where application_id=${id} and status='open'`) {
      const session = await stripeClient().checkout.sessions.retrieve(payment.session_id);
      if (session.payment_status === 'paid') return session;
      if (session.status === 'open') await stripeClient().checkout.sessions.expire(session.id);
      await tx`update ${table("evaluation.payments")} set status='expired',updated_at=now() where session_id=${session.id}`;
    }
    await tx`update ${table("evaluation.applications")} set status='cancelled',payment_status='unpaid',version=version+1,updated_at=now() where id=${id}`;
    await tx`insert into ${table("evaluation.audit")}(application_id,actor,action) values(${id},${actor},'application.cancelled')`;
    return null;
  });
  if (paid) { await applyCheckout(paid, `cancel-check:${paid.id}`, 'checkout.reconciled'); throw new AppError('contact_for_cancellation', 409); }
}
