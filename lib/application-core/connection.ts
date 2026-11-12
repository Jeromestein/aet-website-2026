import 'server-only';
import type { Sql, TransactionSql } from 'postgres';
import { configuration, PREVIEW_ROLE, PRODUCTION_ROLE } from '../preeval/config';

type DB = Sql | TransactionSql;
/** This opt-in is accepted only in the existing restricted configured Preview. */
export function corePreviewConfiguration() {
  const mode = process.env.APPLICATION_CORE_MODE;
  if (!mode) return null;
  if (!['preview','six-preview'].includes(mode) || process.env.VERCEL !== '1' || process.env.VERCEL_ENV !== 'preview'
    || !configuration().cloudPreview)
    throw new Error('Core runtime requires the restricted configured Preview');
  const providerAccount = process.env.APPLICATION_CORE_PROVIDER_ACCOUNT || '';
  if (!/^acct_[a-zA-Z0-9_]+$/.test(providerAccount)) throw new Error('Verified Stripe test account required');
  return { providerAccount, sixTables: mode === 'six-preview' };
}
/** Production reuses the six-table contract but never its Preview credentials. */
export function coreRuntimeConfiguration(): {providerAccount: string; sixTables: boolean; production?: boolean} | null {
  if (process.env.APPLICATION_CORE_MODE !== 'six-production') return corePreviewConfiguration();
  if (!configuration().production) throw new Error('Production runtime is not enabled');
  const providerAccount = process.env.APPLICATION_CORE_PROVIDER_ACCOUNT || '';
  if (!/^acct_[a-zA-Z0-9_]+$/.test(providerAccount)) throw new Error('Verified Stripe live account required');
  return {providerAccount, sixTables: true, production: true};
}
export function coreSchema() {
  const config = coreRuntimeConfiguration();
  return config?.production ? 'aet' : config?.sixTables ? 'aet_preview_shared' : config ? 'aet_preview_core' : 'aet';
}
const tables = ['aet_core_applications','aet_education','aet_service_detail','aet_documents','aet_payments','aet_ai_runs','aet_uploads','aet_emails','aet_payment_events','aet_access_tokens','aet_sessions','aet_audit','aet_rate_limits'];
export function coreTable(sql: DB, name: string) {
  if (!tables.includes(name)) throw new Error('Invalid core table');
  return sql(`${coreSchema()}.${name}`);
}
/** Check the actual database identity, not just the connection string. */
export async function assertCoreConnection(sql: DB) {
  const preview = coreRuntimeConfiguration();
  const [target] = await sql`select current_database() as name, session_user as owner, inet_server_addr() as address,
    r.rolsuper, r.rolbypassrls from pg_roles r where r.rolname=session_user`;
  if (!preview) {
    if (target.name !== 'aet_core_rehearsal' || target.owner !== 'core_rehearsal' || target.address !== null)
      throw new Error('Core reads require the disposable rehearsal database');
    return;
  }
  if (target.owner !== (preview.production ? PRODUCTION_ROLE : PREVIEW_ROLE) || target.rolsuper || target.rolbypassrls)
    throw new Error('Core Preview requires the restricted database role');
  const [permissions] = await sql`select exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where (n.nspname in ('public','preeval','evaluation') or
      ((${Boolean(preview.production)} and left(n.nspname,11)='aet_preview') or
      (${!preview.production} and n.nspname='aet'))) and c.relkind in ('r','p')
      and has_table_privilege(session_user,c.oid,'INSERT,UPDATE,DELETE,TRUNCATE')) as production_write,
    to_regclass(${coreSchema()+'.aet_core_applications'}) is not null as ready`;
  if (permissions.production_write || !permissions.ready) throw new Error('Core Preview database isolation is not ready');
}
