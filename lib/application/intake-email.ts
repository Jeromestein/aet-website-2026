import "server-only";
import { randomUUID } from "node:crypto";
import { db, table } from "../preeval/db";
import { configuration, required } from "../preeval/config";
import { requireIntakePreview, readIntake } from "./intake-server";
import { TEST_RECIPIENT } from "./intake";
import { confirmationEmail } from "./intake-template";
import { deliveryHash, EmailReviewRequired, type EmailTransport } from "../email/delivery";
import { officeCc } from "../email/office-routing";

export type IntakeTransport = EmailTransport;
const resendTransport: IntakeTransport = async mail => {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${required("RESEND_API_KEY")}`, "Content-Type": "application/json", "Idempotency-Key": mail.id },
    body: JSON.stringify({ from: mail.from, to: [mail.recipient], cc: mail.cc, subject: mail.subject, html: mail.html }),
    signal: AbortSignal.timeout(15000),
  });
  const body = await response.json();
  if (!response.ok || typeof body.id !== "string") throw new Error("delivery_failed");
  return body.id;
};

/** Read both the letter and its office routing from the saved application. */
export async function renderIntakeEmail(applicationId: string) {
  const application = await readIntake(applicationId);
  return {
    from: `${required("RESEND_DEFAULT_FROM_NAME")} <${required("RESEND_DEFAULT_FROM_ADDRESS")}>`,
    cc: officeCc(application.data.office, TEST_RECIPIENT),
    ...await confirmationEmail(application.id, application.locale, application.data, application.quote, configuration().origin),
  };
}

/** Render from saved application data after claiming this delivery record. */
export async function sendIntakeEmail(applicationId: string, transport: IntakeTransport = resendTransport) {
  requireIntakePreview();
  const sql = db(), lease = randomUUID();
  await sql`update ${table("evaluation.intake_emails")} set state='failed',error='interrupted',locked_at=null,lease=null
    where application_id=${applicationId} and state='sending' and locked_at<now()-interval '3 minutes'`;
  const [row] = await sql`update ${table("evaluation.intake_emails")} set state='sending',lease=${lease},locked_at=now(),attempts=attempts+1,first_attempt_at=coalesce(first_attempt_at,now())
    where application_id=${applicationId} and recipient=${TEST_RECIPIENT} and available_at<=now()
    and (state in ('queued','failed') or (state='sending' and locked_at<now()-interval '3 minutes'))
    and (first_attempt_at is null or first_attempt_at>now()-interval '23 hours') returning id,recipient,payload_hash`;
  if (!row) return;
  try {
    const content = await renderIntakeEmail(applicationId);
    const mail = {
      id: row.id, recipient: row.recipient,
      ...content,
    };
    const digest = deliveryHash(mail, row.payload_hash);
    const claimed = await sql`update ${table("evaluation.intake_emails")} set payload_hash=${digest} where application_id=${applicationId} and lease=${lease} returning id`;
    if (!claimed.length) return;
    const providerId = await transport(mail);
    await sql`update ${table("evaluation.intake_emails")} set state='sent',provider_id=${providerId},sent_at=now(),error=null,lease=null,locked_at=null where application_id=${applicationId} and lease=${lease}`;
  } catch (error) {
    const blocked = error instanceof EmailReviewRequired;
    await sql`update ${table("evaluation.intake_emails")} set state='failed',error=${blocked ? error.message : "delivery_failed"},
      available_at=case when ${blocked} then 'infinity'::timestamptz else now()+interval '60 seconds' end,
      lease=null,locked_at=null where application_id=${applicationId} and lease=${lease}`;
  }
}
