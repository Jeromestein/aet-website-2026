import "server-only";
import { createHash } from "node:crypto";
import { staffDb } from "./db";
import { staffAdmin } from "./client";
import { normalizeEmail, verifyLegacyPassword } from "./password";
export type MigrationResult =
  | "ready"
  | "invalid"
  | "paused"
  | "password_update_required";
export async function authAttempt(value: string, limit = 10) {
  const key = createHash("sha256").update(value).digest("hex");
  const sql = staffDb();
  const [row] =
    await sql`insert into aet_private.auth_attempts(key) values (${key})
    on conflict(key) do update set attempts=case when auth_attempts.window_started_at<now()-interval '15 minutes' then 1 else auth_attempts.attempts+1 end,
    window_started_at=case when auth_attempts.window_started_at<now()-interval '15 minutes' then now() else auth_attempts.window_started_at end returning attempts`;
  await sql`delete from aet_private.auth_attempts where window_started_at<now()-interval '1 day'`;
  return row.attempts <= limit;
}
/** Legacy credentials can create an identity once; they can never reset an existing one. */
export async function prepareStaffIdentity(
  emailInput: string,
  password: string,
  replacement?: string,
): Promise<MigrationResult> {
  const email = normalizeEmail(emailInput);
  return staffDb().begin(async (sql) => {
    await sql`set local lock_timeout='5s'`;
    const [account] =
      await sql`select s.*,u.hash,u.salt,u.lock_until from aet_private.staff_accounts s
      left join public.users u on u.id=s.legacy_user_id where s.email=${email} and s.active for update of s`;
    if (!account || account.migration_state === "blocked") return "invalid";
    if (account.auth_user_id) return "ready";
    // Native staff are provisioned explicitly; they never enter legacy migration.
    if (account.legacy_user_id == null) return "invalid";
    const [existing] =
      await sql`select id,raw_app_meta_data from auth.users where lower(email)=${email}`;
    let authId: string;
    if (existing) {
      if (
        existing.raw_app_meta_data?.aet_migration_id !== account.migration_id
      ) {
        await sql`update aet_private.staff_accounts set migration_state='blocked' where legacy_user_id=${account.legacy_user_id}`;
        return "invalid";
      }
      authId = existing.id;
    } else {
      if (account.migration_state !== "pending") return "invalid";
      // Local previews must not retire an employee's still-active production login.
      if (process.env.STAFF_LEGACY_MIGRATION_ENABLED !== "true")
        return "paused";
      if (
        (account.lock_until &&
          new Date(account.lock_until).getTime() > Date.now()) ||
        !(await verifyLegacyPassword(
          password,
          account.salt || "",
          account.hash || "",
        ))
      )
        return "invalid";
      const { data, error } = await staffAdmin().auth.admin.createUser({
        email,
        password: replacement || password,
        email_confirm: true,
        app_metadata: { aet_migration_id: account.migration_id },
      });
      if (error || !data.user) {
        if (
          error?.code === "weak_password" ||
          error?.code === "validation_failed"
        )
          return "password_update_required";
        throw new Error("Identity provisioning failed");
      }
      authId = data.user.id;
    }
    await sql`update aet_private.staff_accounts set auth_user_id=${authId},migration_state='complete',migrated_at=now() where legacy_user_id=${account.legacy_user_id}`;
    await sql`update public.users set hash=null,salt=null,reset_password_token=null,reset_password_expiration=null where id=${account.legacy_user_id}`;
    return "ready";
  });
}
