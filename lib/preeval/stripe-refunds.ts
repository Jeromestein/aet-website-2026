import type Stripe from "stripe";
import type postgres from "postgres";
import { db, table, type Row } from "./db";
import { AppError } from "./domain";

type Scope = "preeval" | "evaluation";
type Client = () => Stripe;
const intentId = (value: string | { id: string } | null) =>
  typeof value === "string" ? value : value?.id;

function validateCharge(charge: Stripe.Charge, intent: string, amount: number) {
  if (charge.livemode || intentId(charge.payment_intent) !== intent ||
      charge.currency !== "usd" || charge.amount !== amount ||
      !Number.isSafeInteger(charge.amount_refunded) ||
      charge.amount_refunded < 0 || charge.amount_refunded > amount)
    throw new AppError("invalid_payment");
}

// Both callers hold the application lock before the payment lock.
async function recordRefund(tx: postgres.TransactionSql, scope: Scope, payment: Row, intent: string, amount: number) {
  const refunded = Math.max(payment.refunded_cents, amount);
  const status = refunded >= payment.amount_cents ? "refunded" : "partially_refunded";
  if (payment.refunded_cents === refunded && payment.status === status && payment.payment_intent === intent) return;
  await tx`update ${table(`${scope}.payments`)} set status=${status},payment_intent=${intent},refunded_cents=${refunded},updated_at=now() where id=${payment.id}`;
  if (scope === "evaluation") {
    await tx`update ${table("evaluation.applications")} set payment_status=${status},status=case when status='completed' then 'reviewing' else status end,released_file_id=null,version=version+1,updated_at=now() where id=${payment.application_id}`;
  } else {
    await tx`update ${table("preeval.applications")} set payment_status=${status},updated_at=now() where id=${payment.application_id}`;
  }
  await tx`insert into ${table(`${scope}.audit`)}(application_id,actor,action) values (${payment.application_id},'stripe',${status})`;
}

/** Recheck Stripe even for a repeated reconciliation key: refunds do not change a session's paid status. */
export async function syncCheckoutRefund(tx: postgres.TransactionSql, scope: Scope, payment: Row, session: Stripe.Checkout.Session, client: Client) {
  if (session.payment_status !== "paid") return false;
  const intent = intentId(session.payment_intent);
  if (!intent || (payment.payment_intent && payment.payment_intent !== intent)) throw new AppError("invalid_payment");
  const current = await client().paymentIntents.retrieve(intent, { expand: ["latest_charge"] });
  if (current.id !== intent || current.livemode || current.status !== "succeeded" ||
      current.currency !== "usd" || current.amount !== payment.amount_cents ||
      !current.latest_charge || typeof current.latest_charge === "string")
    throw new AppError("invalid_payment");
  validateCharge(current.latest_charge, intent, payment.amount_cents);
  if (current.latest_charge.amount_refunded > 0 || payment.refunded_cents > 0) {
    await recordRefund(tx, scope, payment, intent, current.latest_charge.amount_refunded);
    return true;
  }
  return ["refunded", "partially_refunded"].includes(payment.status);
}

export async function applyChargeRefund(event: Stripe.Event, scope: Scope, pilot: string, client: Client) {
  const charge = event.data.object as Stripe.Charge;
  const intent = intentId(charge.payment_intent);
  if (!intent) throw new AppError("unresolved_refund", 409);
  let [known] = await db()`select * from ${table(`${scope}.payments`)} where payment_intent=${intent}`;
  if (!known) {
    // Checkout metadata is not copied to Charges. Resolve via the provider's
    // intent filter, then require the locally recorded session and application.
    const sessions = await client().checkout.sessions.list({ payment_intent: intent, limit: 2 });
    if (sessions.has_more || sessions.data.length !== 1) throw new AppError("unresolved_refund", 409);
    const session = sessions.data[0];
    if (session.livemode || intentId(session.payment_intent) !== intent) throw new AppError("invalid_payment");
    if (session.metadata?.pilot !== pilot) return; // Confirmed to belong to another flow.
    const id = session.metadata.applicationId;
    if (!id || session.client_reference_id !== id || session.mode !== "payment" ||
        session.currency !== charge.currency || session.amount_total !== charge.amount)
      throw new AppError("invalid_payment");
    [known] = await db()`select * from ${table(`${scope}.payments`)} where application_id=${id} and session_id=${session.id}`;
    if (!known) throw new AppError("unresolved_refund", 409);
  }
  await db().begin(async tx => {
    await tx`select id from ${table(`${scope}.applications`)} where id=${known.application_id} for update`;
    const [payment] = await tx`select * from ${table(`${scope}.payments`)} where id=${known.id} for update`;
    if (!payment) throw new AppError("unresolved_refund", 409);
    if (payment.payment_intent && payment.payment_intent !== intent) throw new AppError("invalid_payment");
    validateCharge(charge, intent, payment.amount_cents);
    if (charge.amount_refunded === 0) throw new AppError("invalid_payment");
    if (!(await tx`insert into ${table(`${scope}.payment_events`)}(id,type) values (${event.id},${event.type}) on conflict do nothing returning id`).length) return;
    await recordRefund(tx, scope, payment, intent, charge.amount_refunded);
  });
}
