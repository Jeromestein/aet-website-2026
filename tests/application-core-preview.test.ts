import { afterAll,beforeAll,describe,expect,it,vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync,readFileSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash,randomUUID } from 'node:crypto';
import postgres from 'postgres';
const m=vi.hoisted(()=>({sql:undefined as ReturnType<typeof postgres>|undefined}));
vi.mock('server-only',()=>({}));
vi.mock('../lib/preeval/db',async()=>{
  const {businessTableName}=await import('../lib/preeval/config');
  return {db:()=>m.sql!,table:(name:string)=>m.sql!(businessTableName(name))};
});
import { assertCoreConnection } from '../lib/application-core/connection';
import { submit,application } from '../lib/preeval/service';
import { coreAdminApplications } from '../lib/application-core/runtime';
import { workspaceSnapshot } from '../lib/crm/workspace-server';
import { renderQueuedEmail } from '../lib/preeval/email';
import { applicationSchema } from '../lib/preeval/domain';
const pgBin=process.env.APPLICATION_CORE_TEST_PG_BIN;
const read=(path:string)=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const input=()=>({requestId:randomUUID(),locale:'zh',email:'synthetic@example.invalid',firstName:'Preview',middleName:'',lastName:'Applicant',country:'US',
 schoolName:'Preview University',countryOfStudy:'US',degreeObtained:'Bachelor of Science',startDate:'2018-09',endDate:'2022-06',terms:true,uploadsPending:true});
describe.skipIf(!pgBin)('hosted schema mapping and retained cohort (disposable local database)',()=>{
 let directory:string,started=false,admin:ReturnType<typeof postgres>,oldId:string,formalId:string,oldInput:ReturnType<typeof input>;
 beforeAll(async()=>{
  directory=mkdtempSync(join(tmpdir(),'aet-core-preview-'));
  execFileSync(join(pgBin!,'initdb'),['-D',join(directory,'data'),'-U','core_rehearsal','-A','trust','--locale=C','--encoding=UTF8'],{stdio:'pipe'});
  execFileSync(join(pgBin!,'pg_ctl'),['-D',join(directory,'data'),'-l',join(directory,'pg.log'),'-o',`-F -k ${directory} -h '' -p 55443`,'-w','start'],{stdio:'pipe'});started=true;
  const options={host:directory,port:55443,database:'postgres',max:3,onnotice:()=>{},connection:{statement_timeout:5000}};
  admin=postgres({...options,username:'core_rehearsal'});
  await admin.unsafe('create role anon; create role authenticated; create role aet_preview_runtime login; create schema aet_preview_legacy;');
  const map=(sql:string)=>sql.replace(/\bpreeval\b/g,'aet_preview_preeval').replace(/\bevaluation\b/g,'aet_preview_evaluation').replace(/\bpublic\./g,'aet_preview_legacy.');
  for(const name of ['20261002000100_pre_evaluation.sql','20261002000200_formal_evaluation.sql','20261002000300_evaluation_workflow.sql',
   '20261020165103_email_delivery_records.sql','20261020173355_formal_email_delivery_records.sql','20261020230256_application_document_locations.sql','20261020232924_preeval_gpt_analysis.sql'])
   await admin.unsafe(map(read(`supabase/migrations/${name}`)));
  await admin.unsafe(map(read('scripts/legacy/schema-fixture.sql')).replace(/REFERENCES (aet_core_applications|fce_applications)\(/g,'REFERENCES aet_preview_legacy.$1('));
  await admin.unsafe(map(read('scripts/legacy/workflow-bridge.sql')));
  await admin.unsafe(read('supabase/migrations/20261106230843_preview_application_core.sql'));
  for(const schema of ['aet_preview_preeval','aet_preview_evaluation','aet_preview_legacy']) {
   await admin.unsafe(`grant usage on schema ${schema} to aet_preview_runtime; grant select,insert,update,delete on all tables in schema ${schema} to aet_preview_runtime;
    grant usage,select on all sequences in schema ${schema} to aet_preview_runtime; grant execute on all functions in schema ${schema} to aet_preview_runtime;`);
   const tables=await admin`select tablename from pg_tables where schemaname=${schema}`;
   for(const t of tables) await admin.unsafe(`create policy fixture_runtime on ${schema}.${t.tablename} to aet_preview_runtime using(true) with check(true)`);
  }
  formalId=randomUUID();
  await admin`insert into aet_preview_evaluation.applications(id,request_id,request_hash,access_hash,locale,data,quote)
    values(${formalId},${randomUUID()},'synthetic','synthetic','en','{}','{}')`;
  oldInput=input();oldId=randomUUID();
  const parsed=applicationSchema.parse(oldInput),hash=createHash('sha256').update(JSON.stringify(parsed)).digest('hex');
  await admin`insert into aet_preview_preeval.applications(id,request_id,request_hash,email,first_name,middle_name,last_name,country,locale,uploads_pending)
    values(${oldId},${parsed.requestId},${hash},${parsed.email},'Old','',${parsed.lastName},'US','en',true)`;
  await admin`insert into aet_preview_preeval.educations(application_id,school_name,country_of_study,degree_obtained,start_date,end_date)
    values(${oldId},'Retained University','US','Bachelor','2010-01','2014-01')`;
  m.sql=postgres({...options,username:'aet_preview_runtime'});
  const host='aet-website-2026-git-dev-test.vercel.app';
  for(const [key,value] of Object.entries({APPLICATION_CORE_MODE:'preview',APPLICATION_CORE_PROVIDER_ACCOUNT:'acct_synthetic',
   APP_ENV:'preview',APP_ORIGIN:`https://${host}`,APPLICATION_DATABASE_MODE:'cloud-preview',VERCEL:'1',VERCEL_ENV:'preview',VERCEL_GIT_COMMIT_REF:'dev',VERCEL_BRANCH_URL:host,
   STAFF_LEGACY_MIGRATION_ENABLED:'false',STAFF_AUTH_CUTOVER_ENABLED:'false',APPLICATION_TEST_EMAIL:'synthetic@example.invalid',
   APPLICATION_DATABASE_URL:'postgresql://aet_preview_runtime.qrxztgdemfodemlcabcq:test@aws-0-us-west-1.pooler.supabase.com:6543/postgres'}))vi.stubEnv(key,value);
  vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('External network forbidden')));
 },60000);
 afterAll(async()=>{
  vi.unstubAllGlobals();vi.unstubAllEnvs();await m.sql?.end({timeout:1});await admin?.end({timeout:1});
  if(started)execFileSync(join(pgBin!,'pg_ctl'),['-D',join(directory,'data'),'-m','immediate','-w','stop'],{stdio:'pipe'});
  if(directory)rmSync(directory,{recursive:true,force:true});
 });
 it('accepts only the restricted role and denies anonymous access to all five core tables',async()=>{
  await assertCoreConnection(m.sql!);await expect(assertCoreConnection(admin)).rejects.toThrow('restricted');
  const permissions=await admin`select count(*)::int count from pg_tables where schemaname='aet_preview_core' and rowsecurity
    and not has_table_privilege('anon',quote_ident(schemaname)||'.'||quote_ident(tablename),'SELECT')`;
  expect(permissions[0].count).toBe(5);
 });
 it('writes only the mapped core tables and keeps old Status, replay and CRM rows working',async()=>{
  const {app}=await submit(input());
  expect((await application(app.id)).education.school_name).toBe('Preview University');
  expect((await application(oldId)).education.school_name).toBe('Retained University');
  expect((await submit(oldInput)).app.id).toBe(oldId);
  await expect(submit({...oldInput,firstName:'Changed'})).rejects.toMatchObject({code:'duplicate_conflict'});
  const staff={email:'staff@example.invalid',offices:[],include_unassigned:true};
  const workspace=await workspaceSnapshot({},staff);
  expect(workspace.rows.map(row=>row.id).sort()).toEqual([oldId,formalId,app.id].sort());
  expect((await coreAdminApplications('','all',1,staff)).map(row=>row.id).sort()).toEqual([oldId,app.id].sort());
  const [oldEmail]=await m.sql!`select * from aet_preview_preeval.emails where application_id=${oldId}`;
  expect((await renderQueuedEmail(oldEmail)).html).toContain('Retained University');
  expect(await m.sql!`select id from aet_preview_preeval.educations where application_id=${app.id}`).toHaveLength(0);
  expect(await m.sql!`select id from aet_preview_core.aet_core_applications where id=${oldId}`).toHaveLength(0);
 });
});
