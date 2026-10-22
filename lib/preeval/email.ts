import { randomUUID } from "node:crypto";
import { Resend } from "resend";
import { table, db, type Row } from "./db";
import { configuration, required } from "./config";
import { customerEmail, type CustomerEmailKind, type EmailApplication, type EmailEducation } from "./email-template";
import { deliveryHash, EmailReviewRequired, type EmailTransport } from "../email/delivery";

type QueueInput = {
  applicationId?: string | null;
  kind: CustomerEmailKind;
  key: string;
  resultVersion?: number;
  informationRequestId?: number | string;
};
export async function enqueueEmail(input: QueueInput) {
  // Store routing/business references only; templates and rendered content stay in code/memory.
  await db()`insert into ${table("preeval.emails")}(application_id,kind,dedupe_key,recipient,result_version,information_request_id)
    values (${input.applicationId || null},${input.kind},${input.key},${configuration().recipient},${input.resultVersion ?? null},${input.informationRequestId ?? null})
    on conflict(dedupe_key) do nothing`;
}
export async function applicationEmail(app: Row, kind: CustomerEmailKind, informationRequestId?: number | string) {
  if (kind === "information" && !informationRequestId) throw new Error("Missing information request reference");
  const key = kind === "confirmation" ? `application:${app.id}`
    : kind === "result" ? `result:${app.id}:${app.result_version}`
    : kind === "information" ? `information:${app.id}:${informationRequestId}`
    : `access:${app.id}:${randomUUID()}`;
  await enqueueEmail({
    applicationId: app.id, kind, key,
    resultVersion: kind === "result" ? app.result_version : undefined,
    informationRequestId,
  });
}
/** Load the current application, and reject stale result references rather than sending a newer result. */
export async function renderQueuedEmail(row: Row) {
  const config = configuration();
  if (row.recipient !== config.recipient) throw new EmailReviewRequired("recipient_changed");
  if (!["confirmation", "result", "access", "information"].includes(row.kind)) throw new EmailReviewRequired("unknown_email_kind");
  const [app] = await db()`select * from ${table("preeval.applications")} where id=${row.application_id}`;
  if (!app) throw new EmailReviewRequired("application_missing");
  if (row.kind === "result" && (
    row.result_version !== app.result_version || app.payment_status !== "paid" || !app.result ||
    ["cancelled", "needs_information"].includes(app.status)
  )) throw new EmailReviewRequired("result_superseded_or_withheld");
  let message = "";
  if (row.kind === "information") {
    const [request] = await db()`select detail->>'message' as message from ${table("preeval.audit")}
      where id=${row.information_request_id} and application_id=${app.id} and action='information.requested'`;
    if (!request?.message) throw new EmailReviewRequired("information_request_missing");
    message = request.message;
  }
  const [education] = await db()`select school_name,degree_obtained,country_of_study,start_date,end_date from ${table("preeval.educations")}
    where application_id=${app.id} order by id limit 1`;
  return customerEmail(app as EmailApplication, education as EmailEducation | undefined, row.kind, config.origin, message);
}

const resendTransport: EmailTransport = async mail => {
  const { data, error } = await new Resend(required("RESEND_API_KEY")).emails.send({
    from: mail.from, to: mail.recipient, subject: mail.subject, html: mail.html,
  }, { idempotencyKey: mail.id, signal: AbortSignal.timeout(15000) });
  if (error || !data) throw new Error("delivery_failed");
  return data.id;
};
/** Cloud preview only dispatches an explicitly enabled, application-scoped batch. */
export function emailDispatchEnabled(applicationId?: string) {
  return !configuration().cloudPreview || (
    process.env.PREEVAL_EMAIL_ENABLED === "true" &&
    typeof applicationId === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(applicationId)
  );
}
export async function flushEmails(transport: EmailTransport = resendTransport, applicationId?: string) {
  if (!emailDispatchEnabled(applicationId)) return;
  const scope = applicationId || null;
  const recipient = configuration().recipient;
  const sql = db(), lease = randomUUID();
  // Terminal/uncertain deliveries retain their IDs and receipts for reconciliation.
  // Never reset first_attempt_at: the provider's deduplication window is finite.
  const reviewed = await sql`update ${table("preeval.emails")} set state='failed',
    error=case when first_attempt_at<=now()-interval '23 hours' then 'delivery_window_expired_review' else 'delivery_retry_exhausted_review' end,
    available_at='infinity'::timestamptz,locked_at=null,lease=null where id in
    (select id from ${table("preeval.emails")} where
      (state in ('queued','failed') or (state='sending' and locked_at<now()-interval '3 minutes'))
      and (${scope}::uuid is null or application_id=${scope}::uuid) and recipient=${recipient}
      and available_at<>'infinity'::timestamptz
      and (attempts>=5 or first_attempt_at<=now()-interval '23 hours')
      order by created_at,id limit 5 for update skip locked) returning id`;
  await sql`update ${table("preeval.emails")} set state='failed',error='interrupted',locked_at=null,lease=null
    where id in (select id from ${table("preeval.emails")} where state='sending' and locked_at<now()-interval '3 minutes'
      and (${scope}::uuid is null or application_id=${scope}::uuid) and recipient=${recipient}
      and attempts<5 and first_attempt_at>now()-interval '23 hours'
      order by created_at,id limit 5 for update skip locked)`;
  const rows = await sql`update ${table("preeval.emails")} set state='sending',locked_at=now(),lease=${lease},
    attempts=attempts+1,first_attempt_at=coalesce(first_attempt_at,now()) where id in
    (select id from ${table("preeval.emails")} where
      state in ('queued','failed')
      and (${scope}::uuid is null or application_id=${scope}::uuid) and recipient=${recipient}
      and attempts<5 and available_at<=now()
      and (first_attempt_at is null or first_attempt_at>now()-interval '23 hours')
      order by created_at limit 5 for update skip locked) returning *`;
  const outcome = { attempted: 0, sent: 0, reviewRequired: reviewed.length };
  for (const row of rows) {
    try {
      const content = await renderQueuedEmail(row);
      const mail = {
        id: row.id, recipient: row.recipient,
        from: `${required("RESEND_DEFAULT_FROM_NAME")} <${required("RESEND_DEFAULT_FROM_ADDRESS")}>`,
        ...content,
      };
      const digest = deliveryHash(mail, row.payload_hash);
      // A slow render must not send after its lease or retry window has expired.
      const claimed = await sql`update ${table("preeval.emails")} set payload_hash=${digest},locked_at=now()
        where id=${row.id} and lease=${lease} and state='sending'
        and locked_at>=now()-interval '3 minutes' and first_attempt_at>now()-interval '23 hours' returning id`;
      if (!claimed.length) continue;
      outcome.attempted++;
      const providerId = await transport(mail);
      const saved = await sql`update ${table("preeval.emails")} set state='sent',provider_id=${providerId},sent_at=now(),error=null,locked_at=null,lease=null where id=${row.id} and lease=${lease} returning id`;
      outcome.sent += saved.length;
    } catch (error) {
      const blocked = error instanceof EmailReviewRequired;
      const review = blocked || row.attempts >= 5;
      await sql`update ${table("preeval.emails")} set state='failed',error=${blocked ? error.message : "delivery_failed"},
        available_at=case when ${review} then 'infinity'::timestamptz else now()+interval '60 seconds' end,
        locked_at=null,lease=null where id=${row.id} and lease=${lease}`;
      if (review) outcome.reviewRequired++;
    }
  }
  return outcome;
}

/** Notification outages must not change a successful save or AI result. */
export async function deliverApplicationEmails(applicationId: string) {
  try { await flushEmails(undefined, applicationId); }
  catch { console.error("Pre-evaluation email dispatch failed; saved delivery remains recoverable."); }
}
