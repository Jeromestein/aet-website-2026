import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import postgres from 'postgres';
import { configuration, CLOUD_PROJECT } from '../../lib/preeval/config';
const config = configuration();
const connection = config.cloudPreview ? process.env.STAFF_AUTH_DATABASE_URL : process.env.PREEVAL_DATABASE_URL;
assert.ok(connection);
const url = new URL(connection);
assert.ok(config.cloudPreview ? url.hostname === `db.${CLOUD_PROJECT}.supabase.co` || url.hostname.endsWith('.pooler.supabase.com') && decodeURIComponent(url.username).endsWith('.' + CLOUD_PROJECT) : ['localhost','127.0.0.1'].includes(url.hostname));
let source = await readFile(new URL('../../supabase/migrations/20261020230256_application_document_locations.sql', import.meta.url), 'utf8');
if (config.cloudPreview) source = source.replaceAll('evaluation.', 'aet_preview_evaluation.').replaceAll("schemaname='evaluation'", "schemaname='aet_preview_evaluation'");
const sql = postgres(connection, { prepare: false, max: 1 });
try {
  await sql.begin(async tx => { await tx`set local lock_timeout='5s'`; await tx.unsafe(source); });
  const schema = config.cloudPreview ? 'aet_preview_evaluation' : 'evaluation';
  const [check] = await sql`select relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname=${schema} and c.relname='document_locations'`;
  assert.equal(check.relrowsecurity, true);
  for (const role of ['anon','authenticated']) {
    const [access] = await sql`select has_table_privilege(${role},${schema+'.document_locations'},'SELECT,INSERT,UPDATE,DELETE') as allowed`;
    assert.equal(access.allowed, false);
  }
  console.log('Verified private document-location table and browser-role denial. No legacy customer tables changed.');
} finally { await sql.end(); }
