import { afterAll,beforeAll,describe,expect,it,vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync,readFileSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash,randomUUID } from 'node:crypto';
import postgres from 'postgres';
const m=vi.hoisted(()=>({sql:undefined as ReturnType<typeof postgres>|undefined,cookie:'',intent:vi.fn(),checkout:vi.fn()}));
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
import { applicationSchema, BASE_CENTS, resultPath } from '../lib/preeval/domain';

vi.mock('next/headers',()=>({cookies:async()=>({get:()=>m.cookie?{value:m.cookie}:undefined})}));
vi.mock('next/server',async(importOriginal)=>({...await importOriginal<typeof import('next/server')>(),after:()=>{}}));
vi.mock('../lib/staff/session',()=>({staffSession:async()=>null,requireStaffApplication:vi.fn()}));
vi.mock('stripe',async(importOriginal)=>{
 const actual=await importOriginal<typeof import('stripe')>();
 return {default:class extends actual.default {
  constructor(...args:ConstructorParameters<typeof actual.default>){super(...args);this.paymentIntents.retrieve=m.intent;this.checkout.sessions.retrieve=m.checkout;}
 }};
});
import Stripe from 'stripe';
import { NextRequest } from 'next/server';
import { POST as lookup } from '../app/api/pre-evaluation/lookup/route';
import { GET as getRoute, POST as postRoute } from '../app/api/pre-evaluation/[...path]/route';
import { rehearsePreevaluation, assertRehearsalDatabase } from '../scripts/database/preeval-backfill';
import { createCoreShadowReader } from '../lib/application-core/reader';
import { statusComparison, differingPaths } from '../lib/application-core/compare';
import { makeLink, consumeLink } from '../lib/preeval/auth';
import { writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

type RecordRow=Record<string,any>;
let captured:Record<string,RecordRow[]>;
let verified:{providerAccount:string;files:RecordRow[];payments:RecordRow[]};
const snapshotPath=process.env.APPLICATION_CORE_COHORT_SNAPSHOT;
const sourceTables:Record<string,string>={applications:'aet_preview_preeval.applications',educations:'aet_preview_preeval.educations',
 files:'aet_preview_preeval.files',payments:'aet_preview_preeval.payments',legacyApplications:'aet_preview_legacy.aet_core_applications',
 legacyEducations:'aet_preview_legacy.aet_core_educations',legacyPayments:'aet_preview_legacy.aet_core_payments',
 emails:'aet_preview_preeval.emails',audit:'aet_preview_preeval.audit',aiRuns:'aet_preview_preeval.ai_runs',paymentEvents:'aet_preview_preeval.payment_events'};
async function loadCohort(sql:ReturnType<typeof postgres>){
 if(snapshotPath){
  captured=JSON.parse(readFileSync(snapshotPath,'utf8'));
  verified=JSON.parse(readFileSync(join(dirname(snapshotPath),'verified.json'),'utf8'));
  if(captured.applications.length!==4 || captured.applications.some(a=>!a.first_name.startsWith('AET ') || !a.last_name.includes('Test')))
   throw Error('Only the four approved synthetic Preview records may be imported');
  // Known static tables; never use an identifier from the snapshot.
  for(const key of ['legacyApplications','legacyEducations','legacyPayments','applications','educations','files','payments','emails','audit','aiRuns','paymentEvents']){
   const name=sourceTables[key];
   const rows=captured[key]||[];
   if(rows.length)await sql.unsafe(`insert into ${name} overriding system value select * from jsonb_populate_recordset(null::${name},$1::text::jsonb)`,[JSON.stringify(rows)]);
   const [sequence]=await sql`select pg_get_serial_sequence(${name},'id') as name`;
   if(sequence.name)await sql.unsafe(`select setval($1::regclass,greatest(coalesce((select max(id) from ${name}),0),1),true)`,[sequence.name]);
  }
 }else{
  captured={applications:[],payments:[],files:[]};verified={providerAccount:'acct_synthetic',files:[],payments:[]};
  for(const paid of [false,true]){
   const id=randomUUID(),educationId=randomUUID(),fileId=randomUUID();
   await sql`insert into aet_preview_preeval.applications(id,request_id,request_hash,email,first_name,middle_name,last_name,country,locale,status,payment_status,ai_status,result,result_version,uploads_pending)
    values(${id},${randomUUID()},'unavailable','synthetic@example.invalid','Synthetic','','Cohort','US','en','completed','paid','completed',${sql.json({result:'Synthetic degree',reasoning:'Test only'})},1,false)`;
   await sql`insert into aet_preview_preeval.educations(id,application_id,school_name,country_of_study,degree_obtained,start_date,end_date)
    values(${educationId},${id},'Synthetic University','US','Bachelor','2018-09','2022-06')`;
   await sql`insert into aet_preview_preeval.files(id,application_id,name,mime_type,bytes,sha256,dropbox_path,state)
    values(${fileId},${id},'test.pdf','application/pdf',100,'synthetic',${'/synthetic/'+fileId+'.pdf'},'ready')`;
   verified.files.push({legacyFileId:fileId,storageLocation:'AET_App',fileId:'id:'+fileId,revision:'rev1',contentHash:'synthetic',path:'/synthetic/'+fileId+'.pdf',name:'test.pdf',size:100});
   captured.applications.push((await sql`select * from aet_preview_preeval.applications where id=${id}`)[0]);
   captured.files.push((await sql`select * from aet_preview_preeval.files where id=${fileId}`)[0]);
   if(paid){
    const paymentId=randomUUID();
    await sql`insert into aet_preview_preeval.payments(id,application_id,session_id,payment_intent,amount_cents,status) values(${paymentId},${id},${'cs_test_'+id},${'pi_'+id},1988,'paid')`;
    const session={id:'cs_test_'+id,livemode:false,mode:'payment',client_reference_id:id,metadata:{pilot:'aet-2026-local',applicationId:id},currency:'usd',amount_total:1988,payment_status:'paid',status:'complete',payment_intent:'pi_'+id};
    verified.payments.push({id:paymentId,applicationId:id,session,intent:{id:'pi_'+id,livemode:false,status:'succeeded',currency:'usd',amount:1988,latest_charge:{id:'ch_'+id,livemode:false,currency:'usd',amount:1988,amount_refunded:0,payment_intent:'pi_'+id}}});
   }
  }
 }
 for(const payment of verified.payments)await sql`insert into aet_preview_preeval.payment_events(id,type) values(${'evt_local_prior_'+payment.id},'checkout.session.completed')`;
 vi.stubEnv('APPLICATION_CORE_PROVIDER_ACCOUNT',verified.providerAccount);
 m.intent.mockImplementation(async(id:string)=>structuredClone(verified.payments.find(p=>p.intent.id===id)!.intent));
 m.checkout.mockImplementation(async(id:string)=>structuredClone(verified.payments.find(p=>p.session.id===id)!.session));
}

const pgBin=process.env.APPLICATION_CORE_TEST_PG_BIN;
const read=(path:string)=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const input=()=>({requestId:randomUUID(),locale:'zh',email:'synthetic@example.invalid',firstName:'Preview',middleName:'',lastName:'Applicant',country:'US',
 schoolName:'Preview University',countryOfStudy:'US',degreeObtained:'Bachelor of Science',startDate:'2018-09',endDate:'2022-06',terms:true,uploadsPending:true});
describe.skipIf(!pgBin)('historical cohort cutover (owned local database, never hosted writes)',()=>{
 let directory:string,started=false,admin:ReturnType<typeof postgres>,oldId:string,formalId:string,oldInput:ReturnType<typeof input>;
 beforeAll(async()=>{
  directory=mkdtempSync(join(tmpdir(),'aet-core-preview-'));
  execFileSync(join(pgBin!,'initdb'),['-D',join(directory,'data'),'-U','core_rehearsal','-A','trust','--locale=C','--encoding=UTF8'],{stdio:'pipe'});
  execFileSync(join(pgBin!,'pg_ctl'),['-D',join(directory,'data'),'-l',join(directory,'pg.log'),'-o',`-F -k ${directory} -h '' -p 55443`,'-w','start'],{stdio:'pipe'});started=true;
  const options={host:directory,port:55443,database:'postgres',max:3,onnotice:()=>{},connection:{statement_timeout:5000}};
  const bootstrap=postgres({...options,username:'core_rehearsal'});
  await bootstrap.unsafe('create database aet_core_rehearsal');await bootstrap.end();
  options.database='aet_core_rehearsal';
  admin=postgres({...options,username:'core_rehearsal'});
  await admin.unsafe('create role anon; create role authenticated; create role aet_preview_runtime login; create schema aet_preview_legacy;');
  const map=(sql:string)=>sql.replace(/'(?:''|[^'])*'|\b(preeval|evaluation)\b|\bpublic\./g,token=>token.startsWith("'")?token:({preeval:'aet_preview_preeval',evaluation:'aet_preview_evaluation','public.':'aet_preview_legacy.'}[token]!));
  for(const name of ['20261002000100_pre_evaluation.sql','20261002000200_formal_evaluation.sql','20261002000300_evaluation_workflow.sql',
   '20261020165103_email_delivery_records.sql','20261020173355_formal_email_delivery_records.sql','20261020230256_application_document_locations.sql','20261020232924_preeval_gpt_analysis.sql'])
   await admin.unsafe(map(read(`supabase/migrations/${name}`)));
  await admin.unsafe(map(read('scripts/legacy/schema-fixture.sql')).replace(/REFERENCES (aet_core_applications|fce_applications)\(/g,'REFERENCES aet_preview_legacy.$1('));

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
  await loadCohort(admin);
  await admin.unsafe(map(read('scripts/legacy/workflow-bridge.sql')));
  vi.stubEnv('PREEVAL_STRIPE_TEST_ENABLED','true');
  vi.stubEnv('STRIPE_TEST_SECRET_KEY','sk_test_synthetic');
  vi.stubEnv('STRIPE_TEST_WEBHOOK_SECRET','whsec_local_cohort_test');
 },60000);
 afterAll(async()=>{
  vi.unstubAllGlobals();vi.unstubAllEnvs();await m.sql?.end({timeout:1});await admin?.end({timeout:1});
  if(started)execFileSync(join(pgBin!,'pg_ctl'),['-D',join(directory,'data'),'-m','immediate','-w','stop'],{stdio:'pipe'});
  if(directory)rmSync(directory,{recursive:true,force:true});
 });

 const options=(id:string)=>({previewLayout:true,requireCutoverReady:true,providerAccount:verified.providerAccount,
  files:verified.files.filter(f=>captured.files?.some(x=>x.id===f.legacyFileId&&x.application_id===id)) as any,
  verifiedServicePrice:{amountCents:BASE_CENTS,currency:'USD',source:'automatic' as const}});
 const eligible=()=>captured.applications.filter(a=>verified.payments.some(p=>p.applicationId===a.id));
 const staff={email:'staff@example.invalid',offices:['Miami','Boston','Los Angeles','San Francisco','New York'],include_unassigned:true};
 async function sourceDigest(){
  const rows=[];for(const name of Object.values(sourceTables)){
   const [result]=await admin.unsafe(`select coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text),'[]') as rows from ${name} t`);rows.push(result.rows);
  }return createHash('sha256').update(JSON.stringify(rows)).digest('hex');
 }
 async function counts(){return (await admin`select (select count(*) from aet_preview_preeval.ai_runs) ai,
  (select count(*) from aet_preview_preeval.emails) emails,(select count(*) from aet_preview_preeval.payments) payments`)[0];}
 it('rejects a non-rehearsal connection and an unsupported paid application without partial migration',async()=>{
  await expect(assertRehearsalDatabase(m.sql!)).rejects.toThrow('disposable');
  const unsupported=captured.applications.find(a=>!verified.payments.some(p=>p.applicationId===a.id))!;
  const before=await sourceDigest();
  await expect(rehearsePreevaluation(admin,unsupported.id,options(unsupported.id))).rejects.toThrow('ledger');
  expect(await admin`select id from aet_preview_core.aet_core_applications where id=${unsupported.id}`).toHaveLength(0);
  expect(await sourceDigest()).toBe(before);
 });
 it('rejects missing or incorrect File ID evidence atomically',async()=>{
  const id=eligible()[0].id;
  await expect(rehearsePreevaluation(admin,id,{...options(id),files:[]})).rejects.toThrow('every ready File ID');
  expect(await admin`select id from aet_preview_core.aet_core_applications where id=${id}`).toHaveLength(0);
  await expect(rehearsePreevaluation(admin,id,{...options(id),files:options(id).files.map((f:any)=>({...f,size:f.size+1}))})).rejects.toThrow('size requires reconciliation');
  expect(await admin`select id from aet_preview_core.aet_core_applications where id=${id}`).toHaveLength(0);
 });
 it('migrates reconciled records without changing sources and preserves CRM, customer data and old access links',async()=>{
  const before=await sourceDigest(),reader=await createCoreShadowReader(m.sql!);
  const queries:Record<string,string>[]=[{}, {view:'equivalency'}, {view:'payments'}, {view:'documents'}, {sort:'oldest'}, {filter:'completed'}, {export:'csv'}];
  const oldCrm=await Promise.all(queries.map(q=>workspaceSnapshot(q,staff)));
  const oldStates=new Map(),links=new Map();
  for(const app of eligible()){
   oldStates.set(app.id,await application(app.id));
   links.set(app.id,await makeLink(app.id,'customer',app.email,app.locale));
  }
  // Normal reads may repair old workflow state; freeze the migration baseline afterwards.
  const baseline=await sourceDigest(),reports=[];
  for(const app of eligible())reports.push(await rehearsePreevaluation(admin,app.id,options(app.id)));
  expect(await sourceDigest()).toBe(baseline);
  for(let i=0;i<queries.length;i++)expect(differingPaths(oldCrm[i],await workspaceSnapshot(queries[i],staff))).toEqual([]);
  for(const app of eligible()){
   expect(statusComparison(oldStates.get(app.id),await reader.status(app.id,{role:'customer',applicationId:app.id}))).toEqual([]);
   const consumed=await consumeLink(links.get(app.id).split('#token=')[1]);
   expect(consumed.row.application_id).toBe(app.id);m.cookie=consumed.token;
   const response=await getRoute(new Request('https://aet-website-2026-git-dev-test.vercel.app/api/pre-evaluation/applications/'+app.id),{params:Promise.resolve({path:['applications',app.id]})});
   expect(response.status).toBe(200);expect((await response.json()).result).toEqual(oldStates.get(app.id).result);
   await expect(consumeLink(links.get(app.id).split('#token=')[1])).rejects.toMatchObject({code:'invalid_link'});
   const lookupResponse=await lookup(new NextRequest('https://aet-website-2026-git-dev-test.vercel.app/api/pre-evaluation/lookup',{method:'POST',headers:{origin:'https://aet-website-2026-git-dev-test.vercel.app','content-type':'application/json'},body:JSON.stringify({applicationId:app.id,locale:app.locale})}));
   expect(lookupResponse.status).toBe(200);expect((await lookupResponse.json()).url).toBe(resultPath(app.locale,app.id));
   expect(lookupResponse.headers.get('set-cookie')).toContain('aet_preeval_session=');
   const core=(await admin`select * from aet_preview_core.aet_core_applications where id=${app.id}`)[0];
   expect(core.request_hash).toBe(app.request_hash);expect(core.request_hash_version).toBe(0);
   await expect(reader.status(app.id,{role:'customer',applicationId:randomUUID()})).rejects.toMatchObject({status:403});
   await expect(rehearsePreevaluation(admin,app.id,options(app.id))).rejects.toThrow('already migrated');
  }
  if(snapshotPath)writeFileSync(join(dirname(snapshotPath),'migration-report.json'),JSON.stringify({sourceUnchanged:true,sourceDigest:baseline,migrated:reports,retained:captured.applications.filter(a=>!eligible().some(e=>e.id===a.id)).map(a=>({id:a.id,reason:'payment_ledger_missing'}))}),{mode:0o600});
  expect(before).toBeTruthy();
  const retained=captured.applications.find(a=>!eligible().some(e=>e.id===a.id))!;
  expect((await application(retained.id)).result).toEqual(retained.result);
 });
 it('accepts a signed duplicate payment callback without duplicate payment, email or AI',async()=>{
  const before=await counts(),sdk=new Stripe('sk_test_synthetic');
  for(const p of verified.payments){
   const event={id:'evt_local_prior_'+p.id,type:'checkout.session.completed',livemode:false,data:{object:p.session}};
   const payload=JSON.stringify(event),header=sdk.webhooks.generateTestHeaderString({payload,secret:'whsec_local_cohort_test'});
   for(let n=0;n<2;n++){
    const response=await postRoute(new Request('https://aet-website-2026-git-dev-test.vercel.app/api/pre-evaluation/stripe-webhook',{method:'POST',headers:{'stripe-signature':header},body:payload}),{params:Promise.resolve({path:['stripe-webhook']})});
    expect(response.status).toBe(200);expect(await response.json()).toEqual({received:true});
   }
   expect((await application(p.applicationId)).payment_status).toBe('paid');
   expect((await application(p.applicationId)).result).toEqual(captured.applications.find(a=>a.id===p.applicationId)!.result);
   const [payment]=await admin`select amount_cents,refunded_cents,payment_status from aet_preview_core.aet_payments where id=${p.id}`;
   expect(payment).toEqual({amount_cents:p.session.amount_total,refunded_cents:0,payment_status:'paid'});
   expect((await admin`select count(*)::int n from aet_preview_core.aet_payments where application_id=${p.applicationId}`)[0].n).toBe(1);
  }
  expect(await counts()).toEqual(before);
  const unsigned=await postRoute(new Request('https://aet-website-2026-git-dev-test.vercel.app/api/pre-evaluation/stripe-webhook',{method:'POST',body:'{}'}),{params:Promise.resolve({path:['stripe-webhook']})});
  expect(unsigned.status).toBe(400);
 });
 it('keeps a migrated refund authoritative when an old paid callback arrives later',async()=>{
  const p=verified.payments[0],sdk=new Stripe('sk_test_synthetic');
  const charge={...p.intent.latest_charge,amount_refunded:p.session.amount_total};
  const post=async(event:unknown)=>{
   const payload=JSON.stringify(event),signature=sdk.webhooks.generateTestHeaderString({payload,secret:'whsec_local_cohort_test'});
   return postRoute(new Request('https://aet-website-2026-git-dev-test.vercel.app/api/pre-evaluation/stripe-webhook',{method:'POST',headers:{'stripe-signature':signature},body:payload}),{params:Promise.resolve({path:['stripe-webhook']})});
  };
  const before=await counts();
  expect((await post({id:'evt_local_refund_'+p.id,type:'charge.refunded',livemode:false,data:{object:charge}})).status).toBe(200);
  m.intent.mockResolvedValueOnce({...p.intent,latest_charge:charge});
  expect((await post({id:'evt_local_stale_'+p.id,type:'checkout.session.completed',livemode:false,data:{object:p.session}})).status).toBe(200);
  const status=await application(p.applicationId);
  expect(status.payment_status).toBe('refunded');expect(status.result).toBeNull();
  const [payment]=await admin`select payment_status,refunded_cents from aet_preview_core.aet_payments where id=${p.id}`;
  expect(payment).toEqual({payment_status:'refunded',refunded_cents:p.session.amount_total});
  expect(await counts()).toEqual(before);
 });
 it('preserves the original v0 submission hash on retry and rejects changes',async()=>{
  const original=input();vi.stubEnv('APPLICATION_CORE_MODE','');
  const {app}=await submit(original);vi.stubEnv('APPLICATION_CORE_MODE','preview');
  await admin`update aet_preview_preeval.applications set uploads_pending=false,ai_status='idle' where id=${app.id}`;
  await rehearsePreevaluation(admin,app.id,{...options(app.id),files:[],originalSubmission:original});
  expect((await submit(original)).app.id).toBe(app.id);
  await expect(submit({...original,firstName:'Different'})).rejects.toMatchObject({code:'duplicate_conflict'});
  await expect(submit({...original,locale:'en'})).rejects.toMatchObject({code:'duplicate_conflict'});
 });

});
