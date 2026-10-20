import "server-only";
import { randomUUID } from "node:crypto";
import type postgres from "postgres";
import { Resend } from "resend";
import { configuration, required } from "../preeval/config";
import { db, table, type Row } from "../preeval/db";
import { deliveryHash, EmailReviewRequired, type EmailTransport } from "../email/delivery";
import { feeUpdateEmail, paymentConfirmationEmail, type PaymentReceipt } from "./email-template";

/** Enqueue in the same transaction as the confirmed business event. */
export async function queuePaymentEmail(tx: postgres.TransactionSql, applicationId: string, paymentId: string) {
  await tx`insert into ${table("evaluation.emails")}(application_id,kind,dedupe_key,recipient,payment_id)
    values(${applicationId},'payment',${'payment:' + paymentId},${configuration().recipient},${paymentId}) on conflict(dedupe_key) do nothing`;
}
export async function queueFeeUpdateEmail(tx: postgres.TransactionSql, applicationId: string, auditId: number | string) {
  await tx`insert into ${table("evaluation.emails")}(application_id,kind,dedupe_key,recipient,audit_id)
    values(${applicationId},'fee_update',${'fee:' + applicationId + ':' + auditId},${configuration().recipient},${auditId}) on conflict(dedupe_key) do nothing`;
}
export async function renderFormalEmail(row: Row) {
  const config = configuration();
  if (row.recipient !== config.recipient) throw new EmailReviewRequired("recipient_changed");
  if (!["payment", "fee_update"].includes(row.kind)) throw new EmailReviewRequired("unknown_email_kind");
  // Reuse the application's canonical reader, including its legacy-data mapping.
  const { application } = await import("./service");
  const app = await application(row.application_id, false);
  const options = { notice: "Test-mode notification · This email belongs to the isolated local workflow. No live payment is requested." };
  if (row.kind === "payment") {
    const [payment] = await db()`select id,amount_cents,paid_at,status from ${table("evaluation.payments")}
      where id=${row.payment_id} and application_id=${app.id}`;
    if (!payment || payment.status !== "paid" || app.payment_status !== "paid" || !payment.paid_at)
      throw new EmailReviewRequired("payment_receipt_unavailable");
    return paymentConfirmationEmail(app, payment as PaymentReceipt, config.origin, options);
  }
  const [event] = await db()`select detail from ${table("evaluation.audit")}
    where id=${row.audit_id} and application_id=${app.id} and action='staff.quote'`;
  const current = app.confirmed_quote;
  if (!event || !current || app.status === "cancelled" || app.payment_status !== "unpaid" ||
    current.base !== event.detail.base || current.additional !== event.detail.additional || current.explanation !== event.detail.explanation)
    throw new EmailReviewRequired("fee_update_superseded");
  return feeUpdateEmail(app, current, config.origin, options);
}
const resendTransport: EmailTransport = async mail => {
  const { data, error } = await new Resend(required("RESEND_API_KEY")).emails.send({
    from: mail.from, to: mail.recipient, subject: mail.subject, html: mail.html,
  }, { idempotencyKey: mail.id });
  if (error || !data) throw new Error("delivery_failed");
  return data.id;
};
export async function flushFormalEmails(transport: EmailTransport = resendTransport) {
  if (configuration().cloudPreview) return;
  const sql = db(), lease = randomUUID();
  await sql`update ${table("evaluation.emails")} set state='failed',error='interrupted',locked_at=null,lease=null
    where state='sending' and locked_at<now()-interval '3 minutes'`;
  const rows = await sql`update ${table("evaluation.emails")} set state='sending',locked_at=now(),lease=${lease},
    attempts=attempts+1,first_attempt_at=coalesce(first_attempt_at,now()) where id in
    (select id from ${table("evaluation.emails")} where state in ('queued','failed') and attempts<5 and available_at<=now()
      and (first_attempt_at is null or first_attempt_at>now()-interval '23 hours') order by created_at limit 5 for update skip locked) returning *`;
  for (const row of rows) {
    try {
      const content = await renderFormalEmail(row);
      const mail = { id: row.id, recipient: row.recipient, from: `${required("RESEND_DEFAULT_FROM_NAME")} <${required("RESEND_DEFAULT_FROM_ADDRESS")}>`, ...content };
      const digest = deliveryHash(mail, row.payload_hash);
      if (!(await sql`update ${table("evaluation.emails")} set payload_hash=${digest} where id=${row.id} and lease=${lease} returning id`).length) continue;
      const providerId = await transport(mail);
      await sql`update ${table("evaluation.emails")} set state='sent',provider_id=${providerId},sent_at=now(),error=null,locked_at=null,lease=null where id=${row.id} and lease=${lease}`;
    } catch (error) {
      const blocked = error instanceof EmailReviewRequired;
      await sql`update ${table("evaluation.emails")} set state='failed',error=${blocked ? error.message : "delivery_failed"},
        available_at=case when ${blocked} then 'infinity'::timestamptz else now()+interval '60 seconds' end,
        locked_at=null,lease=null where id=${row.id} and lease=${lease}`;
    }
  }
}
