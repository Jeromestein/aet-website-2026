import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import postgres from 'postgres';
import {CLOUD_PROJECT} from '../../lib/preeval/config';
const role='aet_crm_runtime';
assert.equal(process.env.PREEVAL_ORIGIN,'http://localhost:3022');
assert.equal(process.env.STAFF_LEGACY_MIGRATION_ENABLED,'false');assert.equal(process.env.STAFF_AUTH_CUTOVER_ENABLED,'false');
const url=new URL(process.env.STAFF_AUTH_DATABASE_URL!);
assert.ok(url.hostname===`db.${CLOUD_PROJECT}.supabase.co`||url.hostname.endsWith('.pooler.supabase.com')&&decodeURIComponent(url.username).endsWith(`.${CLOUD_PROJECT}`));
const sql=postgres(url.href,{max:1,prepare:false,connect_timeout:10,onnotice:()=>{}});
const path=new URL('../../.env.local',import.meta.url);const original=await readFile(path,'utf8');
const previous=process.env.CRM_DATABASE_URL?new URL(process.env.CRM_DATABASE_URL):null;
const password=previous?decodeURIComponent(previous.password):randomBytes(36).toString('hex');
const restricted=new URL(url);restricted.username=url.hostname.startsWith('db.')?role:`${role}.${CLOUD_PROJECT}`;restricted.password=password;
const grants:Record<string,string[]>={fce_applications:['status','office','due_amount','purpose_other'],fce_educations:[],fce_external_orders:['status','office','notes'],aet_core_applications:['status','updated_at'],aet_core_educations:['ai_output'],aet_core_payments:['notes']};
try{
 await sql.begin(async tx=>{
  await tx`set local lock_timeout='5s'`;
  const [existing]=await tx`select rolsuper,rolbypassrls,rolcreaterole,rolcreatedb from pg_roles where rolname=${role}`;
  if(existing){assert.ok(previous,'Existing role requires its saved local connection; refusing rotation');assert.ok(!existing.rolsuper&&!existing.rolbypassrls&&!existing.rolcreaterole&&!existing.rolcreatedb);}
  else await tx.unsafe(`create role ${role} login password '${password}' nosuperuser nocreatedb nocreaterole noinherit nobypassrls`);
  await tx.unsafe(`grant usage on schema public to ${role}`);
  for(const [name,columns] of Object.entries(grants)){
   await tx.unsafe(`grant select on public.${name} to ${role}`);
   if(columns.length)await tx.unsafe(`grant update (${columns.join(',')}) on public.${name} to ${role}`);
   // Add only policies for the new server role. Existing policies and table definitions stay intact.
   const found=await tx`select 1 from pg_policies where schemaname='public' and tablename=${name} and policyname='aet_crm_server'`;
   if(!found.length)await tx.unsafe(`create policy aet_crm_server on public.${name} to ${role} using (true) with check (true)`);
  }
  await tx`create schema if not exists aet_crm`;
  await tx`create table if not exists aet_crm.audit(id uuid primary key default gen_random_uuid(),kind text not null,record_id text not null,actor text not null,action text not null,before_version text not null,after_version text not null,changes jsonb not null,created_at timestamptz not null default now())`;
  await tx`create index if not exists audit_record on aet_crm.audit(kind,record_id,created_at desc)`;
  await tx`revoke all on schema aet_crm from public,anon,authenticated`;
  await tx`revoke all on all tables in schema aet_crm from public,anon,authenticated`;
  await tx`alter table aet_crm.audit enable row level security`;
  await tx.unsafe(`grant usage on schema aet_crm to ${role}`);
  await tx.unsafe(`grant select,insert on aet_crm.audit to ${role}`);
  const policy=await tx`select 1 from pg_policies where schemaname='aet_crm' and tablename='audit' and policyname='server_audit'`;
  if(!policy.length)await tx.unsafe(`create policy server_audit on aet_crm.audit to ${role} using (true) with check (true)`);
  const [rights]=await tx`select has_table_privilege(${role},'public.users','SELECT') or has_table_privilege(${role},'auth.users','SELECT') or has_table_privilege(${role},'aet_private.staff_accounts','SELECT') as exposed`;
  assert.equal(rights.exposed,false);
 });
 const test=postgres(restricted.href,{max:1,prepare:false});try{assert.equal((await test`select current_user`)[0].current_user,role);for(const name of Object.keys(grants))await test`select 1 from ${test('public.'+name)} limit 1`;}finally{await test.end();}
 let text=original;for(const [key,value] of Object.entries({CRM_DATABASE_URL:restricted.href,CRM_DATA_SOURCE:'live'})){const re=new RegExp('^'+key+'=.*$','m');text=re.test(text)?text.replace(re,()=>key+'='+value):text.trimEnd()+'\n'+key+'='+value+'\n';}
 await writeFile(path,text,{mode:0o600});
 console.log('Live CRM role and private audit prepared. Only CRM configuration updated; employee credentials and business rows unchanged.');
}catch(e){console.error('Live setup failed: '+((e as any).code||'validation'));process.exitCode=1;}finally{await sql.end();}
