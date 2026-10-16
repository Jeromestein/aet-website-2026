import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { staffDb } from "./db";
const digest = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export async function issueRecovery(email: string) {
  const [row] =
    await staffDb()`select migration_id,legacy_user_id,auth_user_id,migration_state from aet_private.staff_accounts where email=${email} and active`;
  if (
    !row ||
    row.migration_state === "blocked" ||
    (!row.auth_user_id && process.env.STAFF_LEGACY_MIGRATION_ENABLED !== "true")
  )
    return null;
  const token = randomBytes(32).toString("hex");
  await staffDb()`insert into aet_private.password_recovery(token_hash,staff_id,legacy_user_id,expires_at) values(${digest(token)},${row.migration_id},${row.legacy_user_id},now()+interval '30 minutes')`;
  await staffDb()`delete from aet_private.password_recovery where expires_at<now()-interval '1 day'`;
  return token;
}
export async function consumeRecovery(token: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const [row] =
    await staffDb()`update aet_private.password_recovery r set consumed_at=now()
    from aet_private.staff_accounts s where (r.staff_id=s.migration_id or (r.staff_id is null and r.legacy_user_id=s.legacy_user_id)) and s.active and s.migration_state<>'blocked'
    and r.token_hash=${digest(token)} and r.expires_at>now() and r.consumed_at is null returning s.email`;
  return row?.email as string | undefined;
}
