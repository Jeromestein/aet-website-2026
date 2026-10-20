import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db, table } from "../../lib/preeval/db";
import { configuration } from "../../lib/preeval/config";
import { submit, staffAction } from "../../lib/preeval/service";
import { applicationEmail, renderQueuedEmail, flushEmails } from "../../lib/preeval/email";

assert.equal(configuration().cloudPreview, true, "Use the isolated preview only");
const sql = db(), ids: string[] = [];
let checks = 0;
function check(value: unknown, message: string) { assert.ok(value, message); checks++; console.log("PASS " + message); }
const before = await sql`select id,state,provider_id,sent_at from ${table("evaluation.intake_emails")} order by id`;
try {
  const created = await submit({
    requestId: randomUUID(), locale: "en", email: "synthetic@example.invalid",
    firstName: "Synthetic", middleName: "", lastName: "Email Check", country: "GB",
    schoolName: "Synthetic University", countryOfStudy: "GB", degreeObtained: "Test Degree",
    startDate: "2018-09", endDate: "2022-06", terms: true,
  });
  const id = created.app.id;
  ids.push(id);
  await sql`update ${table("preeval.applications")} set ai_status='idle',first_name='Updated before send' where id=${id}`;
  const [confirmation] = await sql`select * from ${table("preeval.emails")} where application_id=${id} and kind='confirmation'`;
  check(!("html" in confirmation) && !("subject" in confirmation), "pre-evaluation delivery row contains no message content");
  check((await renderQueuedEmail(confirmation)).html.includes("Updated before send"), "template reads application changes at send time");
  const [result] = await sql`update ${table("preeval.applications")} set payment_status='paid',status='completed',result_version=1,
    result=${sql.json({ result: "Synthetic degree", reasoning: "Synthetic assessment only" })} where id=${id} returning *`;
  await applicationEmail(result, "result");
  await applicationEmail(result, "result");
  const results = await sql`select * from ${table("preeval.emails")} where application_id=${id} and kind='result'`;
  check(results.length === 1 && results[0].result_version === 1, "one delivery record per result version");
  check((await renderQueuedEmail(results[0])).html.includes("Synthetic degree"), "referenced current result renders");
  await sql`update ${table("preeval.applications")} set result_version=2 where id=${id}`;
  await assert.rejects(() => renderQueuedEmail(results[0]), /result_superseded_or_withheld/);
  check(true, "superseded result is not silently replaced with new content");
  await staffAction(id, { action: "information", message: "Original synthetic transcript request" }, "synthetic-test");
  const [information] = await sql`select * from ${table("preeval.emails")} where application_id=${id} and kind='information'`;
  await staffAction(id, { action: "information", message: "Later synthetic diploma request" }, "synthetic-test");
  const content = await renderQueuedEmail(information);
  check(content.html.includes("Original synthetic transcript request") && !content.html.includes("Later synthetic diploma request"), "each information email reads its own business request");
  check(information.information_request_id && !("html" in information), "queue stores the business request ID, not its text or HTML");
  let sends = 0;
  await flushEmails(async () => { sends++; return "not-used"; });
  check(sends === 0, "cloud-preview worker remains paused");
  const permissions = await sql`select c.relname,c.relrowsecurity,
    has_table_privilege('anon',c.oid,'SELECT') as anon_read,
    has_table_privilege('authenticated',c.oid,'SELECT') as authenticated_read
    from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where (n.nspname='aet_preview_preeval' and c.relname='emails')
       or (n.nspname='aet_preview_evaluation' and c.relname='intake_emails')`;
  check(permissions.length === 2 && permissions.every(row => row.relrowsecurity && !row.anon_read && !row.authenticated_read), "both delivery tables retain RLS and deny browser roles");
  check(JSON.stringify(await sql`select id,state,provider_id,sent_at from ${table("evaluation.intake_emails")} order by id`) === JSON.stringify(before), "existing intake delivery receipts are unchanged");
} finally {
  for (const id of ids) await sql.begin(async tx => {
    for (const name of ["emails", "audit", "ai_runs", "files", "payments", "tokens", "sessions", "educations"])
      await tx`delete from ${table("preeval." + name)} where application_id=${id}`;
    await tx`delete from ${table("preeval.applications")} where id=${id}`;
    await tx`delete from ${table("public.aet_core_applications")} where id=${id}`;
  });
  await sql.end();
}
console.log(`Completed ${checks} email-record checks; synthetic records removed and no email sent.`);
