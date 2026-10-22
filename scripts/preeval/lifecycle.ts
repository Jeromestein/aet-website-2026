import { legacyTestActor } from "../legacy-test-actor";
import { environmentValue } from "../../lib/application-environment.mjs";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { db } from "../../lib/preeval/db";
import { configuration } from "../../lib/preeval/config";
import { hash, makeSession, makeLink } from "../../lib/preeval/auth";
import {
  applyCheckout,
  handleStripeEvent,
  publishIfReady,
  stripeClient,
} from "../../lib/preeval/payments";
import { application, addFile, staffAction } from "../../lib/preeval/service";
import { enqueueEmail, flushEmails } from "../../lib/preeval/email";
import { downloadFile } from "../../lib/preeval/dropbox";
// Test-only audit identity: supply for this command, never through website configuration.
const testActor = legacyTestActor();
let checks = 0;
const origin = configuration().origin;
function check(value: unknown, message: string) {
  assert.ok(value, message);
  checks++;
}
async function request(
  path: string,
  body?: unknown,
  cookie = "",
  status = 200,
) {
  const r = await fetch(origin + "/api/pre-evaluation/" + path, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Origin: origin,
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  assert.equal(r.status, status, path);
  checks++;
  return r;
}
async function main() {
  const report = JSON.parse(
    await readFile(".local/integration-report.json", "utf8"),
  );
  const id = report.application;
  const customer =
    "aet_preeval_session=" +
    (await makeSession(id, "customer", configuration().recipient));
  // Supply a password-authenticated test staff session with access to the fixtures.
  const admin = process.env.PREEVAL_TEST_STAFF_COOKIE;
  assert.ok(admin, "Set PREEVAL_TEST_STAFF_COOKIE from a password-authenticated test staff session.");
  const [other] =
    await db()`select id from preeval.applications where payment_status='paid' and exists(select 1 from preeval.ai_runs r where r.application_id=preeval.applications.id and r.state='completed') order by created_at desc limit 1`;
  check(other, "Run the real browser payment/AI acceptance first.");
  await request("applications/" + other.id, undefined, customer, 401);
  const [file] =
    await db()`select * from preeval.files where application_id=${other.id} and state='ready' limit 1`;
  check(file, "The browser test must upload a private fixture.");
  await request("files/" + file.id, undefined, "", 401);
  await request("files/" + file.id, undefined, customer, 401);
  check(
    Buffer.compare(
      await downloadFile(file.dropbox_path),
      await readFile("pre-evaluation-test-document.pdf"),
    ) === 0,
    "Dropbox download round-trips exact bytes",
  );
  const before = await application(other.id, true);
  await addFile(
    other.id,
    new File(
      [new Uint8Array(await readFile("pre-evaluation-test-document.pdf"))],
      file.name,
      { type: "application/pdf" },
    ),
    "test",
  );
  const after = await application(other.id, true);
  check(
    before.result_version === after.result_version &&
      after.files.length === before.files.length,
    "Duplicate upload does not rerun AI",
  );
  const link = await makeLink(id, "customer", configuration().recipient, "en"),
    token = link.split("#token=")[1];
  await request("access/consume", { token });
  await request("access/consume", { token }, "", 400);
  const expired = (
    await makeLink(id, "customer", configuration().recipient, "en")
  ).split("#token=")[1];
  await db()`update preeval.tokens set expires_at=now()-interval '1 second' where hash=${hash(expired)}`;
  await request("access/consume", { token: expired }, "", 400);
  await db()`update preeval.sessions set expires_at=now()-interval '1 second' where hash=${hash(customer.split("=")[1])}`;
  await request("applications/" + id, undefined, customer, 401);
  await request("admin/applications", undefined, admin);
  const [payment] =
    await db()`select session_id from preeval.payments where application_id=${other.id} and status='paid' limit 1`;
  const session = await stripeClient().checkout.sessions.retrieve(
    payment.session_id,
  );
  const replay = "test-replay:" + randomUUID();
  await applyCheckout(session, replay, "checkout.session.completed");
  await applyCheckout(session, replay, "checkout.session.completed");
  check(
    (await db()`select id from preeval.payment_events where id=${replay}`)
      .length === 1,
    "Duplicate Stripe callback stored once",
  );
  const emailCount = (
    await db()`select id from preeval.emails where application_id=${other.id} and kind='result'`
  ).length;
  const [stable] =
    await db()`select updated_at from preeval.applications where id=${other.id}`;
  await publishIfReady(other.id);
  await publishIfReady(other.id);
  check(
    (
      await db()`select id from preeval.emails where application_id=${other.id} and kind='result'`
    ).length === emailCount,
    "Result notification is idempotent",
  );
  check(
    (
      await db()`select updated_at from preeval.applications where id=${other.id}`
    )[0].updated_at.getTime() === stable.updated_at.getTime(),
    "Publishing does not rewrite completed timestamps",
  );
  await assert.rejects(() =>
    applyCheckout(
      { ...session, amount_total: 1 },
      "bad-amount:" + randomUUID(),
      "checkout.session.completed",
    ),
  );
  checks++;
  await assert.rejects(() =>
    applyCheckout(
      { ...session, client_reference_id: randomUUID() },
      "bad-owner:" + randomUUID(),
      "checkout.session.completed",
    ),
  );
  checks++;
  await assert.rejects(() => handleStripeEvent({ livemode: true } as any));
  checks++;
  // Controlled state transitions use only the isolated cancelled integration fixture.
  await db()`update preeval.applications set status='processing',payment_status='unpaid',result=null where id=${id}`;
  const fake = "fixture_" + randomUUID();
  await db()`insert into preeval.payments(application_id,session_id,amount_cents,status) values (${id},${fake},1988,'open')`;
  await applyCheckout(
    {
      id: fake,
      livemode: false,
      metadata: { pilot: "aet-2026-local", applicationId: id },
      client_reference_id: id,
      currency: "usd",
      amount_total: 1988,
      status: "complete",
      payment_status: "unpaid",
    } as any,
    "failure:" + randomUUID(),
    "checkout.session.async_payment_failed",
  );
  check(
    (await application(id)).payment_status === "unpaid",
    "Failed asynchronous payment permits retry",
  );
  const intent = "fixture_pi_" + randomUUID();
  await db()`update preeval.payments set payment_intent=${intent},status='paid' where session_id=${fake}`;
  await db()`update preeval.applications set payment_status='paid',status='completed',result='{"result":"Synthetic test result","reasoning":"State machine test only; not an assessment."}'::jsonb where id=${id}`;
  const refund = (n: number) =>
    ({
      id: "fixture_evt_" + randomUUID(),
      type: "charge.refunded",
      livemode: false,
      data: {
        object: {
          payment_intent: intent,
          currency: "usd",
          amount: 1988,
          amount_refunded: n,
        },
      },
    }) as any;
  await handleStripeEvent(refund(500));
  check(
    (await application(id)).payment_status === "partially_refunded" &&
      (await application(id)).result === null,
    "Partial refund hides result",
  );
  await handleStripeEvent(refund(1988));
  await handleStripeEvent(refund(500));
  check(
    (await application(id)).payment_status === "refunded",
    "Out-of-order refunds never reduce refunded amount",
  );
  await staffAction(
    id,
    { action: "notes", notes: "Local acceptance verified persistence." },
    testActor,
  );
  check(
    (await application(id, true)).notes.includes("verified persistence"),
    "Staff notes persist",
  );
  await db()`update preeval.applications set status='needs_information',payment_status='unpaid' where id=${id}`;
  await staffAction(
    id,
    {
      action: "result",
      result: {
        result: "Unable to determine",
        reasoning:
          "Synthetic local acceptance fixture. No valid academic credential supplied.",
      },
    },
    testActor,
  );
  check(
    (await application(id)).status === "processing" &&
      (await application(id)).result === null,
    "Staff correction resolves information hold but preserves paywall",
  );
  // A interrupted upload must reject a concurrent duplicate, then resume after its lease expires.
  const fixture = await readFile("pre-evaluation-test-document.pdf"),
    digest = hash(fixture.toString("base64")),
    fileId = randomUUID();
  await db()`insert into preeval.files(id,application_id,name,mime_type,bytes,sha256,dropbox_path) values (${fileId},${id},'interrupted-test.pdf','application/pdf',${fixture.length},${digest},${environmentValue("DROPBOX_LEGACY_PILOT_ROOT") + "/" + id + "/" + fileId + ".pdf"}) on conflict(application_id,sha256) do update set state='uploading',created_at=now()`;
  const upload = new File([new Uint8Array(fixture)], "interrupted-test.pdf", {
    type: "application/pdf",
  });
  await assert.rejects(() => addFile(id, upload, "test"), /upload_in_progress/);
  checks++;
  await db()`update preeval.files set created_at=now()-interval '3 minutes' where application_id=${id} and sha256=${digest}`;
  await addFile(id, upload, "test");
  check(
    (
      await db()`select state from preeval.files where application_id=${id} and sha256=${digest}`
    )[0].state === "ready",
    "Interrupted upload resumes to a private file",
  );
  await db()`update preeval.applications set status='cancelled',ai_status='idle' where id=${id}`;
  await assert.rejects(() =>
    staffAction(id, { action: "retry_ai" }, testActor),
  );
  checks++;
  // Exercise a real Resend rejection followed by one controlled successful retry.
  const key = "retry-test:" + randomUUID();
  await enqueueEmail({
    applicationId: id,
    kind: "access",
    key,
  });
  const saved = process.env.RESEND_API_KEY;
  process.env.RESEND_API_KEY = "invalid-local-test-key";
  await flushEmails();
  process.env.RESEND_API_KEY = saved;
  const [failed] =
    await db()`select * from preeval.emails where dedupe_key=${key}`;
  check(
    failed.state === "failed" && !failed.provider_id,
    "Rejected delivery is recorded",
  );
  await staffAction(
    id,
    { action: "retry_email", emailId: failed.id },
    testActor,
  );
  await flushEmails();
  await flushEmails();
  const [sent] =
    await db()`select * from preeval.emails where dedupe_key=${key}`;
  check(
    sent.state === "sent" && !!sent.provider_id,
    "Delivery retry succeeds once",
  );
  const logout = await fetch(origin + "/api/staff-auth/logout", {
    method: "POST", headers: { Origin: origin, "Content-Type": "application/json", Cookie: admin }, body: "{}",
  });
  check(logout.ok, "Password-authenticated staff logout succeeds");
  await request("admin/applications", undefined, admin, 401);
  await writeFile(
    ".local/lifecycle-report.json",
    JSON.stringify(
      {
        checks,
        completedAt: new Date().toISOString(),
        realPayment: "Stripe test mode; actual paid browser checkout",
        simulated:
          "Async failure and refund events on isolated synthetic fixture",
      },
      null,
      2,
    ),
    { mode: 0o600 },
  );
  console.log(`Passed ${checks} lifecycle checks.`);
  await db().end();
}
main().catch(async (error) => {
  console.error(error.message);
  process.exitCode = 1;
  await db().end();
});
