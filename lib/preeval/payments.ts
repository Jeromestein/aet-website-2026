import Stripe from "stripe";
import { table, db } from "./db";
import { required, configuration, requireExternalServices } from "./config";
import { TOTAL_CENTS, AppError, resultPath } from "./domain";
import { applicationEmail } from "./email";

export function stripeClient() {
  requireExternalServices();
  const key = required("STRIPE_TEST_SECRET_KEY");
  if (!key.startsWith("sk_test_") && !key.startsWith("rk_test_"))
    throw new Error("Only Stripe test keys are permitted.");
  return new Stripe(key, { maxNetworkRetries: 2, timeout: 20000 });
}
export async function publishIfReady(id: string) {
  const [app] = await db().begin(async (tx) => {
    const ready =
      await tx`select * from ${table("preeval.applications")} where id=${id} and payment_status='paid' and result is not null and ai_status='completed' and not uploads_pending and status not in ('cancelled','needs_information') for update`;
    if (ready[0] && ready[0].status !== "completed")
      await tx`update ${table("preeval.applications")} set status='completed',updated_at=now() where id=${id}`;
    return ready;
  });
  if (app) await applicationEmail(app, "result");
}
export async function checkout(id: string) {
  const sql = db();
  const stripe = stripeClient();
  return await sql.begin(async (tx) => {
    const [app] =
      await tx`select * from ${table("preeval.applications")} where id=${id} for update`;
    if (!app) throw new AppError("not_found", 404);
    if (app.status === "cancelled")
      throw new AppError("application_cancelled", 409);
    if (["paid", "partially_refunded", "refunded"].includes(app.payment_status))
      throw new AppError("already_paid", 409);
    const [existing] =
      await tx`select * from ${table("preeval.payments")} where application_id=${id} and status in ('creating','open') order by created_at desc limit 1`;
    if (existing?.session_id) {
      const old = await stripe.checkout.sessions.retrieve(existing.session_id);
      if (old.status === "open") return old.url!;
      if (old.payment_status === "paid")
        throw new AppError("payment_reconciliation_required", 409);
      await tx`update ${table("preeval.payments")} set status='expired',updated_at=now() where id=${existing.id}`;
    }
    const [payment] =
      await tx`insert into ${table("preeval.payments")}(application_id,amount_cents) values (${id},${TOTAL_CENTS}) returning id`;
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        allowed_payment_method_types: ["card", "alipay"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Degree Equivalency Service",
                description:
                  "Degree Equivalency Service Payment: 19.00 + Stripe Fee: 0.88",
              },
              unit_amount: TOTAL_CENTS,
            },
            quantity: 1,
          },
        ],
        client_reference_id: id,
        customer_email: configuration().recipient,
        metadata: {
          applicationId: id,
          paymentType: "degree-equivalency",
          pilot: "aet-2026-local",
        },
        success_url:
          configuration().origin +
          resultPath(app.locale, id) +
          "&checkout=success",
        cancel_url:
          configuration().origin +
          resultPath(app.locale, id) +
          "&checkout=cancelled",
        expires_at: Math.floor(Date.now() / 1000) + 1800,
      },
      { idempotencyKey: "preeval-checkout-" + payment.id },
    );
    await tx`update ${table("preeval.payments")} set session_id=${session.id},status='open',updated_at=now() where id=${payment.id}`;
    await tx`update ${table("preeval.applications")} set payment_status='pending',updated_at=now() where id=${id}`;
    return session.url!;
  });
}
export async function applyCheckout(
  session: Stripe.Checkout.Session,
  eventId: string,
  eventType: string,
) {
  if (session.livemode || session.metadata?.pilot !== "aet-2026-local") return;
  const id = session.metadata?.applicationId;
  if (!id) throw new AppError("invalid_payment");
  const sql = db();
  await sql.begin(async (tx) => {
    await tx`select id from ${table("preeval.applications")} where id=${id} for update`;
    const [payment] =
      await tx`select * from ${table("preeval.payments")} where session_id=${session.id} and application_id=${id} for update`;
    if (!payment) throw new AppError("unknown_payment", 409);
    if (
      session.client_reference_id !== id ||
      session.currency !== "usd" ||
      session.amount_total !== payment.amount_cents ||
      payment.amount_cents !== TOTAL_CENTS
    )
      throw new AppError("invalid_payment");
    const event =
      await tx`insert into ${table("preeval.payment_events")}(id,type) values (${eventId},${eventType}) on conflict do nothing returning id`;
    if (!event.length) return;
    if (
      session.payment_status === "paid" &&
      !["refunded", "partially_refunded"].includes(payment.status)
    ) {
      const intent =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id;
      if (!intent) throw new AppError("invalid_payment");
      await tx`update ${table("preeval.payments")} set status='paid',payment_intent=${intent},updated_at=now() where id=${payment.id}`;
      await tx`update ${table("preeval.applications")} set payment_status='paid',updated_at=now() where id=${id} and payment_status not in ('refunded','partially_refunded')`;
    } else if (
      (session.status === "expired" ||
        eventType === "checkout.session.async_payment_failed") &&
      !["paid", "refunded", "partially_refunded"].includes(payment.status)
    ) {
      await tx`update ${table("preeval.payments")} set status='expired',updated_at=now() where id=${payment.id}`;
      await tx`update ${table("preeval.applications")} set payment_status='unpaid',updated_at=now() where id=${id} and payment_status='pending'
        and not exists(select 1 from ${table("preeval.payments")} where application_id=${id} and status in ('paid','open','creating'))`;
    }
    await tx`insert into ${table("preeval.audit")}(application_id,actor,action,detail) values (${id},'stripe',${eventType},${tx.json({ session: session.id, paymentStatus: session.payment_status })})`;
  });
  await publishIfReady(id);
}
export async function reconcile(id: string) {
  const rows =
    await db()`select session_id from ${table("preeval.payments")} where application_id=${id} and status in ('open','paid') order by created_at desc limit 3`;
  for (const row of rows) {
    const s = await stripeClient().checkout.sessions.retrieve(row.session_id);
    await applyCheckout(
      s,
      `reconcile:${s.id}:${s.status}:${s.payment_status}`,
      "checkout.reconciled",
    );
  }
}
export async function handleStripeEvent(event: Stripe.Event) {
  if (event.livemode) throw new AppError("live_event_rejected");
  if (
    [
      "checkout.session.completed",
      "checkout.session.async_payment_succeeded",
      "checkout.session.expired",
      "checkout.session.async_payment_failed",
    ].includes(event.type)
  ) {
    await applyCheckout(
      event.data.object as Stripe.Checkout.Session,
      event.id,
      event.type,
    );
  } else if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;
    const intent =
      typeof charge.payment_intent === "string"
        ? charge.payment_intent
        : charge.payment_intent?.id;
    if (!intent) return;
    await db().begin(async (tx) => {
      const [payment] =
        await tx`select * from ${table("preeval.payments")} where payment_intent=${intent} for update`;
      if (!payment) return;
      if (charge.currency !== "usd" || charge.amount !== payment.amount_cents)
        throw new AppError("invalid_payment");
      if (
        !(
          await tx`insert into ${table("preeval.payment_events")}(id,type) values (${event.id},${event.type}) on conflict do nothing returning id`
        ).length
      )
        return;
      const refund = Math.max(payment.refunded_cents, charge.amount_refunded);
      const status =
        refund >= payment.amount_cents ? "refunded" : "partially_refunded";
      await tx`update ${table("preeval.payments")} set status=${status},refunded_cents=${refund},updated_at=now() where id=${payment.id}`;
      await tx`update ${table("preeval.applications")} set payment_status=${status},updated_at=now() where id=${payment.application_id}`;
      await tx`insert into ${table("preeval.audit")}(application_id,actor,action) values (${payment.application_id},'stripe',${status})`;
    });
  }
}
export async function cancelApplication(id: string, actor: string) {
  const paid = await db().begin(async (tx) => {
    const [app] =
      await tx`select * from ${table("preeval.applications")} where id=${id} for update`;
    if (!app) throw new AppError("not_found", 404);
    if (["paid", "partially_refunded"].includes(app.payment_status))
      throw new AppError("contact_for_cancellation", 409);
    if (app.status === "cancelled") return null;
    for (const payment of await tx`select session_id from ${table("preeval.payments")} where application_id=${id} and status='open'`) {
      const session = await stripeClient().checkout.sessions.retrieve(
        payment.session_id,
      );
      if (session.payment_status === "paid") return session;
      if (session.status === "open")
        await stripeClient().checkout.sessions.expire(payment.session_id);
      await tx`update ${table("preeval.payments")} set status='expired',updated_at=now() where session_id=${payment.session_id}`;
    }
    await tx`update ${table("preeval.applications")} set status='cancelled',payment_status=case when payment_status='pending' then 'unpaid' else payment_status end,updated_at=now() where id=${id}`;
    await tx`insert into ${table("preeval.audit")}(application_id,actor,action) values (${id},${actor},'application.cancelled')`;
    return null;
  });
  if (paid) {
    await applyCheckout(paid, `cancel-check:${paid.id}`, "checkout.reconciled");
    throw new AppError("contact_for_cancellation", 409);
  }
}
