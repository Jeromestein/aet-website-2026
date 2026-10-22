import 'server-only';
import postgres from 'postgres';
import { PAYMENT_DEADLINE_HOURS } from './payment-window';

// Keep this worker independent of the preview application runtime.
const CLOUD_PROJECT = 'qrxztgdemfodemlcabcq';
export const EXPIRY_ROLE = 'aet_payment_expiry';
export const EXPIRY_BATCH_SIZE = 1000;
/** Atomic recheck prevents a stale candidate list from overwriting a payment.
 * Only fixed, internal relation names are passed by callers. No customer writes. */
export async function expireApplications(sql: ReturnType<typeof postgres>, relation = 'public.fce_applications') {
  const rows = await sql`
    update ${sql(relation)} set payment_status='expired'
    where id in (
      select id from ${sql(relation)}
      where status in ('submitted','cancelled') and payment_status='pending'
        and submitted_at < now() - ${PAYMENT_DEADLINE_HOURS} * interval '1 hour'
      order by submitted_at,id limit ${EXPIRY_BATCH_SIZE}
    ) and status in ('submitted','cancelled') and payment_status='pending'
      and submitted_at < now() - ${PAYMENT_DEADLINE_HOURS} * interval '1 hour'
    returning id`;
  return { expired: rows.length, batchFull: rows.length === EXPIRY_BATCH_SIZE };
}
export function expiryConnection(raw: string) {
  const url = new URL(raw);
  const user = decodeURIComponent(url.username);
  const valid = (url.hostname === `db.${CLOUD_PROJECT}.supabase.co` && user === EXPIRY_ROLE)
    || (url.hostname.endsWith('.pooler.supabase.com') && user === `${EXPIRY_ROLE}.${CLOUD_PROJECT}`);
  if (!valid) throw new Error('Payment expiry requires its dedicated restricted project role');
  return url.href;
}
export async function runPaymentExpiry() {
  const url = expiryConnection(process.env.STATUS_EXPIRY_DATABASE_URL || '');
  const sql = postgres(url, { max: 1, prepare: false, connect_timeout: 10, idle_timeout: 5,
    connection: { statement_timeout: 15000, lock_timeout: 3000 } });
  try { return await expireApplications(sql); }
  finally { await sql.end({ timeout: 5 }); }
}
