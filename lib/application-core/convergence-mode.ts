import 'server-only';
import type { Sql } from 'postgres';

// Deliberately no environment switch or HTTP entry point. Only an owned local
// cluster can activate this stage; hosted Preview keeps its existing runtime.
const active = new WeakMap<Sql, { providerAccount: string; compact?: boolean }>();
export async function activateConvergenceRehearsal(sql: Sql, providerAccount: string) {
  const [r] = await sql`select current_database() name,session_user owner,inet_server_addr() address`;
  if (r.name !== 'aet_core_rehearsal' || r.owner !== 'core_rehearsal' || r.address !== null)
    throw new Error('Convergence requires the disposable rehearsal database');
  if (!/^acct_[a-zA-Z0-9_]+$/.test(providerAccount)) throw new Error('Verified test account required');
  const [schema] = await sql`select to_regclass('aet.aet_uploads') ready,to_regclass('preeval.applications') retired`;
  if (!schema.ready || schema.retired) throw new Error('Convergence schema has not passed retirement');
  active.set(sql, { providerAccount });
}
export async function activateNineTableRehearsal(sql: Sql, providerAccount: string) {
  const [r] = await sql`select current_database() name,session_user owner,inet_server_addr() address`;
  if (r.name !== 'aet_core_rehearsal' || r.owner !== 'core_rehearsal' || r.address !== null)
    throw new Error('Nine-table mode requires the disposable rehearsal database');
  if (!/^acct_[a-zA-Z0-9_]+$/.test(providerAccount)) throw new Error('Verified test account required');
  const tables=(await sql`select tablename from pg_tables where schemaname='aet' order by tablename`).map(r=>r.tablename);
  const expected=['aet_core_applications','aet_education','aet_service_detail','aet_documents','aet_payments','aet_ai_runs','aet_payment_events','aet_audit','aet_rate_limits'].sort();
  if(JSON.stringify(tables)!==JSON.stringify(expected))throw new Error('Nine-table retirement incomplete');
  await sql`select notification_state,result_version from aet.aet_service_detail limit 0`;
  await sql`select upload_state,upload_version,upload_context from aet.aet_documents limit 0`;
  active.set(sql,{providerAccount,compact:true});
}
export const nineTableMode = (sql: Sql) => Boolean(active.get(sql)?.compact);
export const convergenceConfiguration = (sql: Sql) => active.get(sql);
export const convergedTableName = (sql: Sql, name: string) => {
  if (!active.has(sql)) return null;
  const names: Record<string,string> = {
    'preeval.files':'aet_uploads', 'preeval.ai_runs':'aet_ai_runs',
    'preeval.emails':'aet_emails', 'preeval.payment_events':'aet_payment_events',
    'preeval.tokens':'aet_access_tokens', 'preeval.sessions':'aet_sessions',
    'preeval.audit':'aet_audit', 'preeval.rate_limits':'aet_rate_limits',
  };
  if (active.get(sql)?.compact && ['preeval.files','preeval.emails','preeval.tokens','preeval.sessions'].includes(name))
    throw new Error('Removed nine-table relation requested: '+name);
  if (names[name]) return 'aet.' + names[name];
  if (name.startsWith('preeval.') || /^public.aet_core_/.test(name))
    throw new Error('Retired relation requested: ' + name);
  return null;
};
