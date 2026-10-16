import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import postgres from 'postgres';
import { CLOUD_PROJECT, PREVIEW_ROLE } from '../../lib/preeval/config';

assert.equal(process.env.PREEVAL_ORIGIN,'http://localhost:3022');
assert.equal(process.env.STAFF_LEGACY_MIGRATION_ENABLED,'false');
assert.equal(process.env.STAFF_AUTH_CUTOVER_ENABLED,'false');
const adminUrl = new URL(process.env.STAFF_AUTH_DATABASE_URL!);
assert.ok(adminUrl.hostname===`db.${CLOUD_PROJECT}.supabase.co` || (adminUrl.hostname.endsWith('.pooler.supabase.com') && decodeURIComponent(adminUrl.username).endsWith(`.${CLOUD_PROJECT}`)));
const sql=postgres(adminUrl.toString(),{max:1,prepare:false,connect_timeout:10,connection:{statement_timeout:30000},onnotice:()=>{}});
const schemas=['aet_preview_legacy','aet_preview_preeval','aet_preview_evaluation'];
const legacy=['aet_core_applications','aet_core_educations','aet_core_payments','fce_applications','fce_educations'];
const envPath=new URL('../../.env.local',import.meta.url);
const current=await readFile(envPath,'utf8');
const priorUrl=process.env.PREEVAL_DATABASE_MODE==='cloud-preview' ? new URL(process.env.PREEVAL_DATABASE_URL!) : null;
const password=priorUrl ? decodeURIComponent(priorUrl.password) : randomBytes(36).toString('hex');
const restricted=new URL(adminUrl);
restricted.username=adminUrl.hostname.startsWith('db.') ? PREVIEW_ROLE : `${PREVIEW_ROLE}.${CLOUD_PROJECT}`;
restricted.password=password;
function render(source:string){return source.replace(/\bpublic\.(aet_core_applications|aet_core_educations|aet_core_payments|fce_applications|fce_educations)\b/g,'aet_preview_legacy.$1').replace(/\bpreeval\b/g,'aet_preview_preeval').replace(/\bevaluation\b/g,'aet_preview_evaluation');}
try {
 await sql.begin(async tx=>{
  await tx`set local lock_timeout='5s'`;
  const [role]=await tx`select rolname,rolsuper,rolbypassrls,rolcreatedb,rolcreaterole from pg_roles where rolname=${PREVIEW_ROLE}`;
  if(role) {assert.ok(priorUrl,'Existing preview role requires matching local configuration; refusing password rotation');assert.ok(!role.rolsuper&&!role.rolbypassrls&&!role.rolcreatedb&&!role.rolcreaterole);}
  else await tx.unsafe(`create role ${PREVIEW_ROLE} login password '${password}' nosuperuser nocreatedb nocreaterole noinherit nobypassrls`);
  const existing=await tx`select nspname from pg_namespace where nspname=any(${schemas})`;
  if(existing.length===0){
   await tx`create schema aet_preview_legacy`;
   // LIKE copies definitions, defaults, checks and indexes; never customer rows, policies or triggers.
   for(const name of legacy) await tx.unsafe(`create table aet_preview_legacy.${name} (like public.${name} including all)`);
   for(const name of ['20261002000100_pre_evaluation.sql','20261002000200_formal_evaluation.sql','20261002000300_evaluation_workflow.sql']) {
    const source=await readFile(new URL(`../../supabase/migrations/${name}`,import.meta.url),'utf8');
    await tx.unsafe(render(source));
   }
   await tx.unsafe(render(await readFile(new URL('../legacy/workflow-bridge.sql',import.meta.url),'utf8')));
  } else assert.equal(existing.length,3,'Partial preview schema; inspect manually');
  // LIKE intentionally omits foreign keys; reproduce only relationships inside this fixture set.
  const foreignKeys=await tx`select c.relname as table_name,k.conname,pg_get_constraintdef(k.oid) as definition from pg_constraint k join pg_class c on c.oid=k.conrelid join pg_namespace n on n.oid=c.relnamespace where k.contype='f' and n.nspname='public' and c.relname=any(${legacy})`;
  for(const key of foreignKeys) {
   const exists=await tx`select 1 from pg_constraint k join pg_class c on c.oid=k.conrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='aet_preview_legacy' and c.relname=${key.table_name} and k.conname=${key.conname}`;
   if(exists.length) continue;
   assert.match(key.conname,/^[a-z0-9_]+$/);
   const definition=key.definition.replace(/REFERENCES (?:public\.)?([a-z0-9_]+)/,(_match:string,name:string)=>{assert.ok(legacy.includes(name),'External foreign key requires review');return `REFERENCES aet_preview_legacy.${name}`;});
   await tx.unsafe(`alter table aet_preview_legacy.${key.table_name} add constraint ${key.conname} ${definition}`);
  }
  for(const schema of schemas){
   await tx.unsafe(`revoke all on schema ${schema} from public,anon,authenticated`);
   await tx.unsafe(`grant usage on schema ${schema} to ${PREVIEW_ROLE}`);
   await tx.unsafe(`revoke all on all tables in schema ${schema} from public,anon,authenticated`);
   await tx.unsafe(`revoke all on all sequences in schema ${schema} from public,anon,authenticated`);
   await tx.unsafe(`revoke all on all functions in schema ${schema} from public,anon,authenticated`);
   await tx.unsafe(`grant select,insert,update,delete on all tables in schema ${schema} to ${PREVIEW_ROLE}`);
   await tx.unsafe(`grant usage,select on all sequences in schema ${schema} to ${PREVIEW_ROLE}`);
   await tx.unsafe(`grant execute on all functions in schema ${schema} to ${PREVIEW_ROLE}`);
   const tables=await tx`select tablename from pg_tables where schemaname=${schema}`;
   for(const {tablename} of tables){
    await tx.unsafe(`alter table ${schema}.${tablename} enable row level security`);
    await tx.unsafe(`drop policy if exists preview_server on ${schema}.${tablename}`);
    await tx.unsafe(`create policy preview_server on ${schema}.${tablename} for all to ${PREVIEW_ROLE} using (true) with check (true)`);
   }
  }
  // A preview connection must have no ability to read or mutate production business/auth tables.
  const [rights]=await tx`select exists(select 1 from pg_tables where schemaname in ('public','auth','aet_private') and (has_table_privilege(${PREVIEW_ROLE},quote_ident(schemaname)||'.'||quote_ident(tablename),'SELECT') or has_table_privilege(${PREVIEW_ROLE},quote_ident(schemaname)||'.'||quote_ident(tablename),'INSERT,UPDATE,DELETE'))) as exposed`;
  assert.equal(rights.exposed,false,'Restricted role unexpectedly has production access');
 });
 const preview=postgres(restricted.toString(),{max:1,prepare:false,connect_timeout:15});
 try { const [identity]=await preview`select current_user`; assert.equal(identity.current_user,PREVIEW_ROLE); await preview`select count(*) from aet_preview_preeval.applications`; }
 finally { await preview.end(); }
 const values={PREEVAL_DATABASE_URL:restricted.toString(),PREEVAL_DATABASE_MODE:'cloud-preview'};
 let updated=current;
 for(const [key,value] of Object.entries(values)) {const line=`${key}=${value}`; const pattern=new RegExp(`^${key}=.*$`,'m'); updated=pattern.test(updated)?updated.replace(pattern,()=>line):`${updated.trimEnd()}\n${line}\n`;}
 // Only business connection/mode change. Staff keys and both cutover flags stay untouched.
 await writeFile(envPath,updated,{mode:0o600});
 console.log('Cloud preview prepared: 3 private schemas, restricted runtime role, zero copied customer rows. Configuration saved without displaying secrets.');
} finally { await sql.end(); }
