import { Resend } from "resend";
import { db, type Row } from "./db";
import { configuration, required } from "./config";
import { makeLink } from "./auth";

const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
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
  await db()`insert into preeval.emails(application_id,kind,dedupe_key,subject,recipient,html) values (${applicationId || null},${kind},${key},${subject},${configuration().recipient},${html}) on conflict(dedupe_key) do nothing`;
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
    (await db()`select id from preeval.emails where dedupe_key=${key}`).length
  )
    return;
  const link = await makeLink(app.id, "customer", app.email, app.locale);
  const title = {
    confirmation: "AET Degree Equivalency Application Confirmation",
    result: "AET Degree Equivalency Results",
    access: "AET Application Access Link",
    information: "AET Degree Equivalency — Additional Information",
  }[kind];
  const intro =
    kind === "confirmation"
      ? "Thank you for submitting your degree equivalency application."
      : kind === "result"
        ? "Your preliminary degree equivalency result is ready."
        : kind === "information"
          ? "Please review the following request for additional information."
          : "Use the secure link below to access your application.";
  const html = `<div style="font-family:Arial,sans-serif;color:#18334e;max-width:600px;margin:auto;padding:28px"><h1 style="font-size:24px">${title}</h1><p>Dear ${escape(app.first_name)} ${escape(app.last_name)},</p><p>${intro}</p><p><strong>Application ID:</strong> ${escape(app.id)}</p>${message ? `<p>${escape(message).replace(/\n/g, "<br>")}</p>` : ""}<p><a href="${escape(link)}" style="display:inline-block;background:#284f75;color:white;padding:14px 22px;border-radius:8px;text-decoration:none">View your application</a></p><p>This link can be used once within 24 hours. Request another link on the application status page whenever you need it.</p><p>Any degree equivalency shown is based on the information you provided. It is not derived from verified documents and cannot be used as proof of attendance or degree completion. AET may update this provisional result after document verification and analysis.</p><hr><p>American Education and Translation Services, CORP (AET)</p></div>`;
  await enqueueEmail({
    applicationId: app.id,
    kind,
    key,
    subject: title,
    html,
  });
}
export async function administratorEmail(locale: string) {
  const link = await makeLink(null, "admin", configuration().admin, locale);
  await enqueueEmail({
    kind: "admin_access",
    key: "admin:" + crypto.randomUUID(),
    subject: "AET Workspace — Sign in",
    html: `<p>Sign in to the AET workspace:</p><p><a href="${escape(link)}">Open workspace</a></p><p>This single-use link expires in 24 hours.</p>`,
  });
}
export async function flushEmails() {
  const sql = db();
  await sql`update preeval.emails set state='failed',error='interrupted' where state='sending' and locked_at<now()-interval '3 minutes'`;
  const rows =
    await sql`update preeval.emails set state='sending',locked_at=now(),attempts=attempts+1 where id in
    (select id from preeval.emails where state in ('queued','failed') and attempts<5 and available_at<=now() order by created_at limit 5 for update skip locked) returning *`;
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
      await sql`update preeval.emails set state='sent',provider_id=${data.id},sent_at=now(),error=null,locked_at=null where id=${row.id}`;
    } catch (error) {
      await sql`update preeval.emails set state='failed',error=${error instanceof Error ? error.message.slice(0, 150) : "delivery_failed"},available_at=now()+interval '60 seconds',locked_at=null where id=${row.id}`;
    }
  }
}
