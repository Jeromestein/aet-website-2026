import { environmentValue } from "../../lib/application-environment.mjs";
import assert from "node:assert/strict";
import { randomBytes, randomInt, pbkdf2Sync, createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { staffDb } from "../../lib/staff/db";
import { staffAdmin } from "../../lib/staff/client";
import { prepareStaffIdentity } from "../../lib/staff/migrate";

// Explicitly scoped synthetic acceptance test. No employee is migrated and no email is sent.
assert.ok(
  Number(process.versions.node.split(".")[0]) >= 22,
  "Cloud acceptance CLI requires Node 22+",
);
const project = "qrxztgdemfodemlcabcq";
assert.equal(
  new URL(process.env.SUPABASE_URL!).hostname,
  `${project}.supabase.co`,
);
assert.equal(environmentValue("APP_ORIGIN"), "http://localhost:3022");
assert.equal(process.env.STAFF_LEGACY_MIGRATION_ENABLED, "false");
assert.equal(process.env.STAFF_AUTH_CUTOVER_ENABLED, "false");
assert.equal(
  process.env.STAFF_AUTH_SYNTHETIC_TEST,
  "true",
  "Set STAFF_AUTH_SYNTHETIC_TEST=true to run",
);
const sql = staffDb(),
  admin = staffAdmin();
const id = -randomInt(100000000, 2000000000);
const email = `aet-auth-test-${-id}@example.invalid`;
const password = ` Aet-${randomBytes(18).toString("hex")}-测试! `;
const salt = randomBytes(32).toString("hex");
const hash = pbkdf2Sync(password, salt, 25000, 512, "sha256").toString("hex");
const origin = environmentValue("APP_ORIGIN")!;
const clients: ReturnType<typeof createClient>[] = [];
const client = () => {
  const c = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
  clients.push(c);
  return c;
};
let passed = 0;
function check(condition: unknown, message: string) {
  assert.ok(condition, message);
  passed++;
  console.log(`PASS ${message}`);
}
const realSnapshot = () =>
  sql`select s.*,u.hash,u.salt,u.lock_until from aet_private.staff_accounts s join public.users u on u.id=s.legacy_user_id where s.legacy_user_id>0 order by s.legacy_user_id`;
const baseline = JSON.stringify(await realSnapshot());
const [authBefore] = await sql`select count(*)::int as count from auth.users`;
let authId: string | undefined;
const jar = new Map<string, string>();
async function post(action: string, body: object, requestOrigin = origin) {
  const response = await fetch(`${origin}/api/staff-auth/${action}`, {
    method: "POST",
    headers: {
      Origin: requestOrigin,
      "Content-Type": "application/json",
      Cookie: [...jar].map(([k, v]) => `${k}=${v}`).join("; "),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(45000),
  });
  for (const cookie of response.headers.getSetCookie()) {
    const [pair] = cookie.split(";"),
      i = pair.indexOf("=");
    if (cookie.includes("Max-Age=0")) jar.delete(pair.slice(0, i));
    else jar.set(pair.slice(0, i), pair.slice(i + 1));
  }
  return {
    status: response.status,
    headers: response.headers,
    body: await response.json(),
  };
}
try {
  await sql.begin(async (tx) => {
    await tx`insert into public.users(id,name,email,salt,hash) values(${id},'Temporary Auth Acceptance Fixture',${email},${salt},${hash})`;
    await tx`insert into aet_private.staff_accounts(legacy_user_id,email,role,offices,include_unassigned) values(${id},${email},'staff',ARRAY['Miami'],false)`;
  });
  check(
    (await prepareStaffIdentity(email, password)) === "paused",
    "local migration switch protects pending credentials",
  );
  process.env.STAFF_LEGACY_MIGRATION_ENABLED = "true";
  check(
    (await prepareStaffIdentity(email, "incorrect-password")) === "invalid",
    "wrong legacy password rejected",
  );
  const results = await Promise.all([
    prepareStaffIdentity(email, password),
    prepareStaffIdentity(email, password),
  ]);
  check(
    results.every((v) => v === "ready"),
    "concurrent first logins reconcile one identity",
  );
  const [mapped] =
    await sql`select auth_user_id,migration_state from aet_private.staff_accounts where legacy_user_id=${id}`;
  authId = mapped.auth_user_id;
  const [{ count }] =
    await sql`select count(*)::int as count from auth.users where lower(email)=${email}`;
  check(
    count === 1 && mapped.migration_state === "complete",
    "exactly one completed Supabase identity",
  );
  const [legacy] = await sql`select hash,salt from public.users where id=${id}`;
  check(
    legacy.hash === null && legacy.salt === null,
    "test legacy credentials retired after mapping",
  );
  const login = await client().auth.signInWithPassword({ email, password });
  check(
    !login.error && !!login.data.user?.email_confirmed_at,
    "original password including whitespace and Unicode works without confirmation mail",
  );
  const refreshed = await client().auth.refreshSession({
    refresh_token: login.data.session!.refresh_token,
  });
  check(
    !refreshed.error && !!refreshed.data.session,
    "Supabase session refresh works",
  );
  const httpLogin = await post("login", {
    email,
    password,
    redirect: "https://outside.invalid",
  });
  check(
    httpLogin.status === 200 && httpLogin.body.url === "/admin/CRM",
    "3022 login and safe redirect succeed",
  );
  check(
    httpLogin.headers
      .getSetCookie()
      .some(
        (v) =>
          v.startsWith("aet_staff_auth") &&
          /HttpOnly/i.test(v) &&
          /SameSite=lax/i.test(v),
      ),
    "HTTP session cookies are HttpOnly and SameSite=Lax",
  );
  const protectedPage = await fetch(`${origin}/admin/CRM`, {
    headers: { Cookie: [...jar].map(([k, v]) => `${k}=${v}`).join("; ") },
    redirect: "manual",
    signal: AbortSignal.timeout(45000),
  });
  check(
    protectedPage.status === 200 &&
      (await protectedPage.text()).includes("Pre-Evaluations"),
    "authenticated CRM page renders without local business database",
  );
  check(
    (await post("login", { email, password }, "https://outside.invalid"))
      .status === 403,
    "cross-origin login rejected",
  );
  for (const action of ["forgot-password", "reset-password"]) {
    check(
      (await post(action, { email, password })).status === 404,
      `${action} is unavailable`,
    );
  }
  check(
    (await prepareStaffIdentity(email, password)) === "ready",
    "completed mapping does not reapply legacy password",
  );
  await sql`update aet_private.staff_accounts set active=false where legacy_user_id=${id}`;
  check(
    (await post("login", { email, password })).status === 401,
    "inactive staff denied even with valid Supabase password",
  );
  const disabledPage = await fetch(`${origin}/admin/CRM`, {
    headers: { Cookie: [...jar].map(([k, v]) => `${k}=${v}`).join("; ") },
    redirect: "manual",
    signal: AbortSignal.timeout(45000),
  });
  check(
    [303, 307].includes(disabledPage.status) &&
      disabledPage.headers.get("location") === "/admin/login",
    "disabled account loses protected page access",
  );
  check((await post("logout", {})).status === 200, "logout succeeds");
  check(
    ![...jar].some(([k, v]) => k.startsWith("aet_staff_auth") && v),
    "logout clears staff session cookies",
  );
} finally {
  process.env.STAFF_LEGACY_MIGRATION_ENABLED = "false";
  // Discover a marker-owned identity even when a test fails after provisioning.
  const owned =
    await sql`select a.id from auth.users a join aet_private.staff_accounts s on s.migration_id::text=a.raw_app_meta_data->>'aet_migration_id' where s.legacy_user_id=${id} and s.email=${email}`;
  authId ||= owned[0]?.id;
  await sql.begin(async (tx) => {
    await tx`delete from aet_private.password_recovery where legacy_user_id=${id}`;
    await tx`delete from aet_private.staff_accounts where legacy_user_id=${id} and email=${email}`;
    await tx`delete from public.users where id=${id} and email=${email}`;
    for (const action of ["login", "forgot-password"]) {
      const key = createHash("sha256")
        .update(`${action}:email:${email}`)
        .digest("hex");
      await tx`delete from aet_private.auth_attempts where key=${key}`;
    }
  });
  if (authId) {
    const result = await admin.auth.admin.deleteUser(authId);
    assert.equal(result.error, null, "synthetic Auth cleanup");
  }
  for (const c of clients) c.auth.stopAutoRefresh();
  check(
    JSON.stringify(await realSnapshot()) === baseline,
    "all real staff credentials, scopes and migration states unchanged",
  );
  const [authAfter] = await sql`select count(*)::int as count from auth.users`;
  check(
    authAfter.count === authBefore.count,
    "Auth user count restored after synthetic cleanup",
  );
  const [{ count }] =
    await sql`select count(*)::int as count from public.users where id=${id}`;
  check(count === 0, "synthetic legacy and private records removed");
  await sql.end();
  console.log(
    `${passed} cloud acceptance checks passed; no invitations or emails sent.`,
  );
}
