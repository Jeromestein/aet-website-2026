import 'server-only';
import type { Sql } from 'postgres';
import { corePreviewConfiguration, assertCoreConnection } from './connection';

// Shared across Next.js server bundles; each server instance verifies its own pool.
type Mode = { providerAccount: string; compact?: boolean; paymentStateOnly?: boolean; minimal?: boolean; schema?: string };
const runtime = globalThis as typeof globalThis & { aetConvergenceModes?: WeakMap<Sql,Mode> };
const active = runtime.aetConvergenceModes ??= new WeakMap<Sql,Mode>();

export async function activateSixTablePreview(sql: Sql) {
  const config = corePreviewConfiguration();
  if (!config?.sixTables) throw new Error('Six-table Preview opt-in required');
  await assertCoreConnection(sql);
  const tables = (await sql`select tablename from pg_tables where schemaname='aet_preview_shared' order by tablename`).map(r=>r.tablename);
  const expected = ['aet_core_applications','aet_education','aet_service_detail','aet_documents','aet_payments','aet_ai_runs'].sort();
  if (JSON.stringify(tables)!==JSON.stringify(expected)) throw new Error('Six-table Preview migration incomplete');
  await sql`select notification_state,result_version from aet_preview_shared.aet_service_detail limit 0`;
  await sql`select upload_state,upload_version,upload_context from aet_preview_shared.aet_documents limit 0`;
  const [privileges] = await sql`select bool_and(c.relrowsecurity and has_table_privilege(session_user,c.oid,'SELECT,INSERT,UPDATE,DELETE')
    and not has_table_privilege('anon',c.oid,'SELECT,INSERT,UPDATE,DELETE')
    and not has_table_privilege('authenticated',c.oid,'SELECT,INSERT,UPDATE,DELETE')) valid
    from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='aet_preview_shared' and c.relkind='r'`;
  if (!privileges.valid) throw new Error('Six-table Preview grants are not ready');
  active.set(sql,{providerAccount:config.providerAccount,compact:true,paymentStateOnly:true,minimal:true,schema:'aet_preview_shared'});
}
export async function activateConvergenceRehearsal(sql: Sql, providerAccount: string) {
  const [r] = await sql`select current_database() name,session_user owner,inet_server_addr() address`;
  if (r.name !== 'aet_core_rehearsal' || r.owner !== 'core_rehearsal' || r.address !== null)
    throw new Error('Convergence requires the disposable rehearsal database');
  if (!/^acct_[a-zA-Z0-9_]+$/.test(providerAccount)) throw new Error('Verified test account required');
  const [schema] = await sql`select to_regclass('aet.aet_uploads') ready,to_regclass('preeval.applications') retired`;
  if (!schema.ready || schema.retired) throw new Error('Convergence schema has not passed retirement');
  active.set(sql, { providerAccount });
}
export const activateNineTableRehearsal = (sql: Sql, providerAccount: string) => activateCompactRehearsal(sql, providerAccount, false);
export const activateEightTableRehearsal = (sql: Sql, providerAccount: string) => activateCompactRehearsal(sql, providerAccount, true);
export const activateSixTableRehearsal = (sql: Sql, providerAccount: string) => activateCompactRehearsal(sql, providerAccount, true, true);
async function activateCompactRehearsal(sql: Sql, providerAccount: string, paymentStateOnly: boolean, minimal = false) {
  const [r] = await sql`select current_database() name,session_user owner,inet_server_addr() address`;
  if (r.name !== 'aet_core_rehearsal' || r.owner !== 'core_rehearsal' || r.address !== null)
    throw new Error('Compact mode requires the disposable rehearsal database');
  if (!/^acct_[a-zA-Z0-9_]+$/.test(providerAccount)) throw new Error('Verified test account required');
  const tables=(await sql`select tablename from pg_tables where schemaname='aet' order by tablename`).map(r=>r.tablename);
  const expected=['aet_core_applications','aet_education','aet_service_detail','aet_documents','aet_payments','aet_ai_runs',...(minimal?[]:['aet_audit','aet_rate_limits']),...(paymentStateOnly?[]:['aet_payment_events'])].sort();
  if(JSON.stringify(tables)!==JSON.stringify(expected))throw new Error('Compact retirement incomplete');
  await sql`select notification_state,result_version from aet.aet_service_detail limit 0`;
  await sql`select upload_state,upload_version,upload_context from aet.aet_documents limit 0`;
  active.set(sql,{providerAccount,compact:true,paymentStateOnly,minimal});
}
export const sixTableMode = (sql: Sql) => Boolean(active.get(sql)?.minimal);
export const paymentStateOnlyMode = (sql: Sql) => Boolean(active.get(sql)?.paymentStateOnly);
export const nineTableMode = (sql: Sql) => Boolean(active.get(sql)?.compact);
export const convergenceConfiguration = (sql: Sql) => {
  if (process.env.APPLICATION_CORE_MODE === 'six-preview' && !active.has(sql))
    throw new Error('Six-table Preview startup verification has not completed');
  return active.get(sql);
};
export const convergedTableName = (sql: Sql, name: string) => {
  if (!convergenceConfiguration(sql)) return null;
  const names: Record<string,string> = {
    'preeval.files':'aet_uploads', 'preeval.ai_runs':'aet_ai_runs',
    'preeval.emails':'aet_emails', 'preeval.payment_events':'aet_payment_events',
    'preeval.tokens':'aet_access_tokens', 'preeval.sessions':'aet_sessions',
    'preeval.audit':'aet_audit', 'preeval.rate_limits':'aet_rate_limits',
  };
  if (active.get(sql)?.compact && ['preeval.files','preeval.emails','preeval.tokens','preeval.sessions'].includes(name))
    throw new Error('Removed nine-table relation requested: '+name);
  if (paymentStateOnlyMode(sql) && name === 'preeval.payment_events')
    throw new Error('Retired payment events requested');
  if (sixTableMode(sql) && ['preeval.audit','preeval.rate_limits'].includes(name))
    throw new Error('Retired audit/rate-limit relation requested: '+name);
  if (names[name]) return (active.get(sql)?.schema || 'aet') + '.' + names[name];
  if (name.startsWith('preeval.') || /^public.aet_core_/.test(name))
    throw new Error('Retired relation requested: ' + name);
  return null;
};
