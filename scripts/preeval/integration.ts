import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { db } from "../../lib/preeval/db";
import { configuration } from "../../lib/preeval/config";
import { stripeClient } from "../../lib/preeval/payments";
const { origin } = configuration();
let checks = 0;
async function request(
  path: string,
  body?: unknown,
  cookie = "",
  expected = 200,
  originHeader = origin,
) {
  const res = await fetch(origin + "/api/pre-evaluation/" + path, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Origin: originHeader,
      Cookie: cookie,
      ...(body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
    },
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
  });
  const data = await res.json();
  assert.equal(
    res.status,
    expected,
    JSON.stringify({ path, status: res.status, data }),
  );
  checks++;
  return {
    data,
    cookie: res.headers.get("set-cookie")?.split(";")[0] || cookie,
  };
}
async function main() {
  const value = {
    requestId: randomUUID(),
    locale: "en",
    email: configuration().recipient,
    firstName: "Integrity",
    middleName: "",
    lastName: "Example",
    country: "China",
    schoolName: "Peking University",
    countryOfStudy: "China",
    degreeObtained: "Bachelor of Engineering",
    startDate: "2018-09",
    endDate: "2022-06",
    terms: true,
  };
  await request("applications", { ...value, amount: 1 }, "", 400);
  await request("applications", value, "", 403, "https://untrusted.example");
  const created = await request("applications", value, "", 201),
    id = created.data.id;
  await db()`update preeval.applications set ai_status='idle' where id=${id}`;
  const duplicate = await request("applications", value, "", 201);
  assert.equal(id, duplicate.data.id);
  await request("applications", { ...value, firstName: "Different" }, "", 409);
  const [counts] =
    await db()`select (select count(*)::int from preeval.educations where application_id=${id}) educations,(select count(*)::int from preeval.emails where application_id=${id} and kind='confirmation') emails`;
  assert.equal(counts.educations, 1);
  assert.equal(counts.emails, 1);
  checks++;
  await request("applications/" + id, undefined, "", 401);
  await request("admin/applications", undefined, created.cookie, 401);
  const { data: app } = await request(
    "applications/" + id,
    undefined,
    created.cookie,
  );
  assert.equal(app.result, null);
  assert.equal(app.education.school_name, value.schoolName);
  await db()`update preeval.applications set result='{"result":"Private draft","reasoning":"This draft is not paid."}'::jsonb where id=${id}`;
  assert.equal(
    (await request("applications/" + id, undefined, created.cookie)).data
      .result,
    null,
  );
  const bad = new FormData();
  bad.set(
    "file",
    new File(["not a diploma"], "test.pdf", { type: "application/pdf" }),
  );
  await request("applications/" + id + "/files", bad, created.cookie, 400);
  await request(
    "applications/" + id + "/staff",
    {
      action: "result",
      result: {
        result: "Tampered result",
        reasoning: "Unauthorized customer changes.",
      },
    },
    created.cookie,
    401,
  );
  await request("access/consume", { token: "wrong" }, "", 400);
  await request("stripe-webhook", {}, "", 400);
  const paid = await request(
    "applications/" + id + "/checkout",
    {},
    created.cookie,
  );
  assert.match(paid.data.url, /^https:\/\/checkout\.stripe\.com\//);
  const [payment] =
    await db()`select session_id from preeval.payments where application_id=${id} order by created_at desc limit 1`;
  const checkout = await stripeClient().checkout.sessions.retrieve(
    payment.session_id,
  );
  assert.equal(checkout.amount_total, 1988);
  assert.equal(checkout.livemode, false);
  checks++;
  const repeat = await request(
    "applications/" + id + "/checkout",
    {},
    created.cookie,
  );
  assert.equal(repeat.data.url, paid.data.url);
  await request("applications/" + id + "/cancel", {}, created.cookie);
  assert.equal(
    (await stripeClient().checkout.sessions.retrieve(payment.session_id))
      .status,
    "expired",
  );
  await request("applications/" + id + "/checkout", {}, created.cookie, 409);
  await request("applications/" + id + "/reconcile", {}, created.cookie);
  assert.equal(
    (await request("applications/" + id, undefined, created.cookie)).data
      .status,
    "cancelled",
  );
  await mkdir(".local", { recursive: true });
  await writeFile(
    ".local/integration-report.json",
    JSON.stringify(
      { checks, application: id, completedAt: new Date().toISOString() },
      null,
      2,
    ),
    { mode: 0o600 },
  );
  console.log(
    `Passed ${checks} local integration checks, including a real Stripe test Checkout and its expiry.`,
  );
  await db().end();
}
main().catch(async (error) => {
  console.error(error.message);
  process.exitCode = 1;
  await db().end();
});
