import { Resend } from "resend";
import { table, db, type Row } from "./db";
import { configuration, required } from "./config";
import { customerEmail, escapeHtml as escape } from "./email-template";

export async function enqueueEmail({
  applicationId,
  kind,
  key,
  subject,
  html,
}: {
  applicationId?: string | null;
  kind: string;
  key: string;
  subject: string;
  html: string;
}) {
  // All pilot email, including any legacy CC/BCC, is contained in one owner-approved inbox.
  await db()`insert into ${table("preeval.emails")}(application_id,kind,dedupe_key,subject,recipient,html) values (${applicationId || null},${kind},${key},${subject},${configuration().recipient},${html}) on conflict(dedupe_key) do nothing`;
}
export async function applicationEmail(
  app: Row,
  kind: "confirmation" | "result" | "access" | "information",
  message = "",
) {
  const key =
    kind === "confirmation"
      ? "application:" + app.id
      : kind === "result"
        ? `result:${app.id}:${app.result_version}`
        : `${kind}:${app.id}:${crypto.randomUUID()}`;
  if (
    (await db()`select id from ${table("preeval.emails")} where dedupe_key=${key}`).length
  )
    return;
  const [education] = await db()`select school_name,degree_obtained,country_of_study,start_date,end_date from ${table("preeval.educations")} where application_id=${app.id} order by id limit 1`;
  const { subject, html } = customerEmail(app as Parameters<typeof customerEmail>[0], education as Parameters<typeof customerEmail>[1], kind, configuration().origin, message);
  await enqueueEmail({
    applicationId: app.id,
    kind,
    key,
    subject,
    html,
  });
}
export async function administratorEmail() {
  const { makeLink } = await import("./auth");
  const link = await makeLink(null, "admin", configuration().admin, "en");
  await enqueueEmail({
    kind: "admin_access",
    key: "admin:" + crypto.randomUUID(),
    subject: "AET Workspace — Sign in",
    html: `<p>Sign in to the AET workspace:</p><p><a href="${escape(link)}">Open workspace</a></p><p>This single-use link expires in 24 hours.</p>`,
  });
}
export async function flushEmails() {
  if (configuration().cloudPreview) return;
  const sql = db();
  await sql`update ${table("preeval.emails")} set state='failed',error='interrupted' where state='sending' and locked_at<now()-interval '3 minutes'`;
  const rows =
    await sql`update ${table("preeval.emails")} set state='sending',locked_at=now(),attempts=attempts+1 where id in
    (select id from ${table("preeval.emails")} where state in ('queued','failed') and attempts<5 and available_at<=now() order by created_at limit 5 for update skip locked) returning *`;
  const resend = new Resend(required("RESEND_API_KEY"));
  for (const row of rows) {
    try {
      const { data, error } = await resend.emails.send(
        {
          from: `${required("RESEND_DEFAULT_FROM_NAME")} <${required("RESEND_DEFAULT_FROM_ADDRESS")}>`,
          to: configuration().recipient,
          subject: row.subject,
          html: row.html,
        },
        { idempotencyKey: row.id },
      );
      if (error || !data) throw new Error(error?.name || "delivery_failed");
      await sql`update ${table("preeval.emails")} set state='sent',provider_id=${data.id},sent_at=now(),error=null,locked_at=null where id=${row.id}`;
    } catch (error) {
      await sql`update ${table("preeval.emails")} set state='failed',error=${error instanceof Error ? error.message.slice(0, 150) : "delivery_failed"},available_at=now()+interval '60 seconds',locked_at=null where id=${row.id}`;
    }
  }
}
