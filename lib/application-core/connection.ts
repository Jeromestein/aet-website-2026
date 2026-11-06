import 'server-only';
import type { Sql, TransactionSql } from 'postgres';
import { configuration, PREVIEW_ROLE } from '../preeval/config';

type DB = Sql | TransactionSql;
/** This opt-in is accepted only in the existing restricted dev Preview. */
export function corePreviewConfiguration() {
  const mode = process.env.APPLICATION_CORE_MODE;
  if (!mode) return null;
  if (mode !== 'preview' || process.env.VERCEL !== '1' || process.env.VERCEL_ENV !== 'preview'
    || process.env.VERCEL_GIT_COMMIT_REF !== 'dev' || !configuration().cloudPreview)
    throw new Error('Core runtime requires the restricted dev Preview');
  const providerAccount = process.env.APPLICATION_CORE_PROVIDER_ACCOUNT || '';
  if (!/^acct_[a-zA-Z0-9_]+$/.test(providerAccount)) throw new Error('Verified Stripe test account required');
  return { providerAccount };
}
const tables = ['aet_core_applications','aet_education','aet_service_detail','aet_documents','aet_payments'];
export function coreTable(sql: DB, name: string) {
  if (!tables.includes(name)) throw new Error('Invalid core table');
  return sql(`${corePreviewConfiguration() ? 'aet_preview_core' : 'aet'}.${name}`);
}
/** Check the actual database identity, not just the connection string. */
export async function assertCoreConnection(sql: DB) {
  const preview = corePreviewConfiguration();
  const [target] = await sql`select current_database() as name, session_user as owner, inet_server_addr() as address,
    r.rolsuper, r.rolbypassrls from pg_roles r where r.rolname=session_user`;
  if (!preview) {
    if (target.name !== 'aet_core_rehearsal' || target.owner !== 'core_rehearsal' || target.address !== null)
      throw new Error('Core reads require the disposable rehearsal database');
    return;
  }
  if (target.owner !== PREVIEW_ROLE || target.rolsuper || target.rolbypassrls)
    throw new Error('Core Preview requires the restricted database role');
  const [permissions] = await sql`select exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname in ('public','preeval','evaluation','aet') and c.relkind in ('r','p')
      and has_table_privilege(session_user,c.oid,'INSERT,UPDATE,DELETE,TRUNCATE')) as production_write,
    to_regclass('aet_preview_core.aet_core_applications') is not null as ready`;
  if (permissions.production_write || !permissions.ready) throw new Error('Core Preview database isolation is not ready');
}
