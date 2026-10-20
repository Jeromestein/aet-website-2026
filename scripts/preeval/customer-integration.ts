import { renderQueuedEmail } from "../../lib/preeval/email";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { db } from "../../lib/preeval/db";
import { configuration } from "../../lib/preeval/config";

const { origin, recipient, cloudPreview } = configuration();
if (cloudPreview) throw new Error("Customer regression fixtures require the isolated local database and local server.");
const ids: string[] = [];
let checks = 0;
const verify = (condition: unknown, message: string) => { assert.ok(condition, message); checks++; };
async function request(path: string, body?: unknown, cookie = "", expected = 200, originHeader = origin) {
  const response = await fetch(origin + "/api/pre-evaluation/" + path, {
    method: body === undefined ? "GET" : "POST", headers: { Origin: originHeader, Cookie: cookie, "Content-Type": "application/json", "x-forwarded-for": "preeval-customer-regression" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json();
  assert.equal(response.status, expected, `${path}: ${response.status} ${JSON.stringify(data)}`); checks++;
  return { data, cookie: response.headers.get("set-cookie")?.split(";")[0] || cookie, response };
}
async function main() {
  const input = { requestId: randomUUID(), locale: "en", email: recipient, firstName: "Disposable", lastName: "Customer Regression", country: "CN", schoolName: "Fictional Regression University", countryOfStudy: "CN", degreeObtained: "Test-only degree", startDate: "2018-09", endDate: "2022-06", terms: true };
  try {
    for (let i = 0; i < 2; i++) {
      const created = await request("applications", { ...input, requestId: randomUUID() }, "", 201);
      ids.push(created.data.id);
      await db()`update preeval.applications set ai_status='idle' where id=${created.data.id}`;
    }
    const [id, other] = ids;
    const [email] = await db()`select * from preeval.emails where application_id=${id} and kind='confirmation'`;
    const rendered = await renderQueuedEmail(email);
    verify(rendered.html.includes(`applicationId=${id}`) && !rendered.html.includes("#token="), "Confirmation must use a reusable application link");
    verify(rendered.html.includes(input.schoolName) && rendered.html.includes("$19.88"), "Confirmation includes education and exact total");
    verify(email.recipient === recipient, "Test email containment");
    await request("lookup", { applicationId: "invalid" }, "", 400);
    await request("lookup", { applicationId: randomUUID() }, "", 404);
    await request("lookup", { applicationId: id, role: "admin" }, "", 400);
    await request("lookup", { applicationId: id }, "", 403, "https://unrelated.example");
    await request("lookup", { applicationId: id, padding: "x".repeat(600) }, "", 413);
    const found = await request("lookup", { applicationId: ` ${id.toUpperCase()} `, locale: "zh" });
    verify(found.data.url === `/zh/degree-equivalency-tool/application/success?applicationId=${id}`, "Lookup preserves selected locale");
    verify(found.response.headers.get("cache-control") === "no-store", "Lookup is not cacheable");
    verify(found.response.headers.get("set-cookie")?.includes("HttpOnly"), "Internal access cookie stays HTTP-only");
    await request(`applications/${id}`, undefined, "", 401);
    await request(`applications/${other}`, undefined, found.cookie, 401);
    await request(`applications/${id}/staff`, { action: "note", note: "Forbidden test" }, found.cookie, 401);
    await db()`update preeval.applications set result='{"result":"PRIVATE TEST RESULT","reasoning":"Private assessment used only to verify the payment gate."}'::jsonb,result_version=1,ai_status='completed' where id=${id}`;
    await db()`update public.aet_core_educations set ai_output=${JSON.stringify({ result: 'PRIVATE LEGACY RESULT', reasoning: 'Private legacy assessment test.' })} where application_id=${id}`;
    const unpaid = await request(`applications/${id}`, undefined, found.cookie);
    verify(unpaid.data.result === null, "Unpaid top-level result is hidden");
    verify(!JSON.stringify(unpaid.data).includes("PRIVATE"), "Legacy education cannot leak an unpaid result");
    verify(!("notes" in unpaid.data) && !("emails" in unpaid.data), "Customer receives no internal staff information");
    await db()`update preeval.sessions set expires_at=now()-interval '1 minute' where application_id=${id}`;
    await request(`applications/${id}`, undefined, found.cookie, 401);
    const reopened = await request("lookup", { applicationId: id, locale: "es" });
    await request(`applications/${id}`, undefined, reopened.cookie);
    const again = await request("lookup", { applicationId: id });
    verify(again.data.url.endsWith(id), "Application ID remains reusable");
    const [count] = await db()`select count(*)::int as value from preeval.emails where application_id=${id}`;
    verify(count.value === 1, "Lookup must not send new email");
    await db()`update preeval.applications set payment_status='paid',status='completed' where id=${id}`;
    const paid = await request(`applications/${id}`, undefined, again.cookie);
    verify(paid.data.result.result === "PRIVATE TEST RESULT", "Paid result is visible");
    await db()`update preeval.applications set payment_status='refunded' where id=${id}`;
    verify((await request(`applications/${id}`, undefined, again.cookie)).data.result === null, "Refund hides the result again");
    await mkdir(".local", { recursive: true });
    await writeFile(".local/preeval-customer-regression.json", JSON.stringify({ checks, completedAt: new Date().toISOString() }, null, 2));
    console.log(`Passed ${checks} customer-flow integration checks.`);
  } finally {
    for (const id of ids) {
      await db().begin(async tx => {
        for (const table of ["emails", "audit", "ai_runs", "files", "payments", "tokens", "sessions", "educations"]) await tx.unsafe(`delete from preeval.${table} where application_id=$1`, [id]);
        await tx`delete from preeval.applications where id=${id}`;
        await tx`delete from public.aet_core_applications where id=${id}`;
      });
    }
    await db().end();
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
