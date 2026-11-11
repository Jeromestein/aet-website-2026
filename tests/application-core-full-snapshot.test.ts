import { simplifyPreevaluationSix } from '../scripts/database/simplify-preeval-six';
import { activateSixTableRehearsal, sixTableMode } from '../lib/application-core/convergence-mode';
import { simplifyPreevaluationEight } from '../scripts/database/simplify-preeval-eight';
import { activateEightTableRehearsal } from '../lib/application-core/convergence-mode';
import { simplifyPreevaluationNine } from '../scripts/database/simplify-preeval-nine';
import { activateNineTableRehearsal } from '../lib/application-core/convergence-mode';
import { compactNotificationRows } from '../lib/application-core/compact-notifications';
import { afterAll,beforeAll,describe,expect,it,vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync,readFileSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join,dirname } from 'node:path';
import { createHash } from 'node:crypto';
import postgres from 'postgres';
import Stripe from 'stripe';
import { POST as postRoute,GET as getRoute } from '../app/api/pre-evaluation/[...path]/route';
import { activateConvergenceRehearsal,convergedTableName } from '../lib/application-core/convergence-mode';
const m=vi.hoisted(()=>({sql:undefined as ReturnType<typeof postgres>|undefined,
  cookie:'',account:'',before:true,list:vi.fn(),start:vi.fn(),append:vi.fn(),finish:vi.fn(),upload:vi.fn(),metadata:vi.fn(),download:vi.fn(),create:vi.fn(),retrieve:vi.fn(),intent:vi.fn()}));
vi.mock('server-only',()=>({}));
vi.mock('../lib/preeval/db',()=>({db:()=>m.sql!,table:(name:string)=>m.sql!(convergedTableName(m.sql!,name)||name),
  audit:async(id:string,actor:string,action:string)=>{if(sixTableMode(m.sql!))return;await m.sql!`insert into ${m.sql!(convergedTableName(m.sql!,'preeval.audit')||'preeval.audit')}(application_id,actor,action) values (${id},${actor},${action})`;}}));
vi.mock('../lib/preeval/config',()=>({configuration:()=>({origin:'http://localhost:3022',recipient:'synthetic@example.invalid',cloudPreview:true}),
  required:(key:string)=>key==='STRIPE_TEST_SECRET_KEY'?'sk_test_synthetic':key==='STRIPE_TEST_WEBHOOK_SECRET'?'whsec_local_convergence_test':'synthetic@example.invalid',requireExternalServices:()=>{}}));
vi.mock('next/headers',()=>({cookies:async()=>({get:()=>m.cookie?{value:m.cookie}:undefined})}));
vi.mock('next/server',async(importOriginal)=>({...await importOriginal<typeof import('next/server')>(),after:()=>{}}));
vi.mock('../lib/staff/session',()=>({staffSession:async()=>null,requireStaffApplication:vi.fn()}));
vi.mock('stripe',async(importOriginal)=>{
 const actual=await importOriginal<typeof import('stripe')>();
 return {default:class extends actual.default {
  constructor(...args:ConstructorParameters<typeof actual.default>){super(...args);this.paymentIntents.retrieve=m.intent;
    this.checkout.sessions.retrieve=m.retrieve;this.checkout.sessions.create=m.create;this.checkout.sessions.list=m.list;}
 }};
});
vi.mock('../lib/dropbox/server',()=>({requireEnabled:()=>{},clientForOffice:async()=>({filesUpload:m.upload,filesGetMetadata:m.metadata,filesDownload:m.download,filesUploadSessionStart:m.start,filesUploadSessionAppendV2:m.append,filesUploadSessionFinish:m.finish}),
  seal:(account:string,_purpose:string,data:unknown,expires:number)=>JSON.stringify({account,data,expires}),
  unseal:(value:string)=>JSON.parse(value),
  dropboxHash:(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex')}));

vi.mock('../lib/application-core/connection',async(importOriginal)=>{
  const original=await importOriginal<typeof import('../lib/application-core/connection')>();
  return {...original,corePreviewConfiguration:()=>({providerAccount:m.account}),
    coreTable:(sql:any,name:string)=>sql('aet.'+name)};
});
vi.mock('../lib/preeval/payments',async(importOriginal)=>{
  const original=await importOriginal<typeof import('../lib/preeval/payments')>();
  return {...original,publishIfReady:(id:string)=>m.before?Promise.resolve():original.publishIfReady(id)};
});
import { application } from '../lib/preeval/service';
import { application as formalApplication } from '../lib/evaluation-application/service';
import { checkout } from '../lib/preeval/payments';
import { workspaceSnapshot } from '../lib/crm/workspace-server';
import { flushEmails } from '../lib/preeval/email';
import { convergeHistoricalPreevaluation } from '../scripts/database/converge-preeval-history';
import { makeSession } from '../lib/preeval/auth';
import { writeFileSync } from 'node:fs';

const pgBin=process.env.APPLICATION_CORE_TEST_PG_BIN;
const snapshotPath=process.env.APPLICATION_CORE_FULL_SNAPSHOT;
const read=(path:string)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
type Row=Record<string,any>;
const schemas:Record<string,string>={aet_preview_core:'aet',aet_preview_preeval:'preeval',aet_preview_evaluation:'evaluation',aet_preview_legacy:'public'};
const names:Record<string,string[]>={
  aet_preview_core:['aet_core_applications','aet_documents','aet_education','aet_payments','aet_service_detail'],
  aet_preview_preeval:['ai_runs','applications','audit','document_uploads','educations','emails','files','payment_events','payments','rate_limits','sessions','tokens'],
  aet_preview_evaluation:['access_tokens','applications','audit','document_locations','emails','files','intake_emails','payment_events','payments','sessions'],
  aet_preview_legacy:['aet_core_applications','aet_core_educations','aet_core_payments','fce_applications','fce_educations'],
};
const expected=Object.entries(names).flatMap(([schema,tables])=>tables.map(t=>schema+'.'+t)).sort();
const local=(name:string)=>{const [schema,t]=name.split('.');if(!expected.includes(name))throw Error('Unexpected snapshot relation');return schemas[schema]+'.'+t;};
const normalize=(value:any):any=>value instanceof Date?value.toISOString():Array.isArray(value)?value.map(normalize):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,normalize(value[k])])):value;
const digest=(value:any)=>createHash('sha256').update(JSON.stringify(Array.isArray(value)?value.map(normalize).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b))):normalize(value))).digest('hex');
const queryCases=[{},{view:'formal'},{view:'equivalency'},{view:'payments'},{view:'documents'},{filter:'completed'},{sort:'name'},{sort:'oldest'},{export:'csv'},{office:'Los Angeles'},{office:'Miami'}] as Record<string,string>[];
const staff={email:'staff@example.invalid',offices:['Boston','New York','Miami','San Francisco','Los Angeles'],include_unassigned:true};

describe.skipIf(!pgBin||!snapshotPath)('complete hosted Preview snapshot, offline physical retirement',()=>{
 let directory:string,started=false,snapshot:Row,verified:Row,options:Parameters<typeof convergeHistoricalPreevaluation>[1];
 let beforeStatus:Row[]=[],beforeFormal:Row[]=[],beforeCRM:Row[]=[],sessions:string[]=[];
 let report:Awaited<ReturnType<typeof convergeHistoricalPreevaluation>>;
 const sql=()=>m.sql!;
 const rows=(name:string)=>sql()`select to_jsonb(t) value from ${sql()(name)} t order by to_jsonb(t)::text`.then(r=>r.map(x=>x.value));
 const source=(name:string)=>snapshot.tables[name] as Row[];
 const exempt=()=>options.cohort.find(c=>c.noChargeAuditId)!.applicationId;
 beforeAll(async()=>{
  snapshot=JSON.parse(readFileSync(snapshotPath!,'utf8'));
  verified=JSON.parse(readFileSync(join(dirname(snapshotPath!),'verified.json'),'utf8'));
  expect(snapshot.project).toBe('qrxztgdemfodemlcabcq');expect(Object.keys(snapshot.tables).sort()).toEqual(expected);
  expect(source('aet_preview_preeval.applications')).toHaveLength(6);
  expect(source('aet_preview_core.aet_core_applications')).toHaveLength(2);
  expect(source('aet_preview_evaluation.applications')).toHaveLength(4);
  // Explicit frozen acceptance cohort; never feed arbitrary customer data to this harness.
  expect(source('aet_preview_preeval.applications').every(a=>a.first_name.startsWith('AET ')&&a.last_name.includes('Test'))).toBe(true);
  m.account=verified.providerAccount;
  options={providerAccount:m.account,payments:verified.payments.map((p:Row)=>({id:p.id,applicationId:p.applicationId,
    amountCents:p.session.amount_total,currency:p.session.currency,checkoutSessionId:p.session.id,paymentIntentId:p.intent.id,
    status:p.session.payment_status,refundedCents:p.intent.latest_charge.amount_refunded,providerMode:'test'})),
    cohort:source('aet_preview_preeval.applications').map(a=>({applicationId:a.id,
      noChargeAuditId:source('aet_preview_preeval.audit').find(e=>e.application_id===a.id&&e.action==='test.payment_fixture')?.id?.toString(),
      evidence:{verifiedServicePrice:{amountCents:1900,currency:'USD',source:'automatic'},
        files:verified.files.filter((f:Row)=>source('aet_preview_preeval.files').some(d=>d.id===f.legacyFileId&&d.application_id===a.id))}}))};
  directory=mkdtempSync(join(tmpdir(),'aet-full-snapshot-'));
  execFileSync(join(pgBin!,'initdb'),['-D',join(directory,'data'),'-U','core_rehearsal','-A','trust','--locale=C','--encoding=UTF8'],{stdio:'pipe'});
  execFileSync(join(pgBin!,'pg_ctl'),['-D',join(directory,'data'),'-l',join(directory,'pg.log'),'-o',`-F -k ${directory} -h '' -p 55448`,'-w','start'],{stdio:'pipe'});started=true;
  const connection={host:directory,port:55448,username:'core_rehearsal',onnotice:()=>{},connection:{statement_timeout:10000,TimeZone:'UTC'}};
  const admin=postgres({...connection,database:'postgres',max:1});
  try{await admin.unsafe('create database aet_core_rehearsal');}finally{await admin.end();}
  m.sql=postgres({...connection,database:'aet_core_rehearsal',max:5});
  await sql().unsafe('create role anon; create role authenticated; create role aet_preview_runtime;');
  for(const file of ['20261002000100_pre_evaluation.sql','20261002000200_formal_evaluation.sql','20261002000300_evaluation_workflow.sql',
    '20261020165103_email_delivery_records.sql','20261020173355_formal_email_delivery_records.sql','20261020230256_application_document_locations.sql','20261020232924_preeval_gpt_analysis.sql'])
    await sql().unsafe(read('supabase/migrations/'+file));
  await sql().unsafe(read('scripts/legacy/schema-fixture.sql'));
  await sql().unsafe(read('scripts/staff/intake-preview.sql').replaceAll('aet_preview_legacy.','public.').replaceAll('aet_preview_evaluation.','evaluation.'));
  await sql().unsafe(read('supabase/migrations/20261106220126_shared_application_core.sql'));
  // Restore parents first; no workflow triggers may rewrite captured source rows.
  const order=expected.filter(n=>n.endsWith('.applications')||n.endsWith('.aet_core_applications')||n.endsWith('.fce_applications'));
  order.push(...expected.filter(n=>!order.includes(n)));
  for(const name of order){
    const [schema,t]=local(name).split('.');
    const actual=await sql()`select column_name,udt_name from information_schema.columns where table_schema=${schema} and table_name=${t} order by column_name`;
    const captured=snapshot.columns.filter((c:Row)=>c.table_schema+'.'+c.table_name===name).map((c:Row)=>({column_name:c.column_name,udt_name:c.udt_name})).sort((a:Row,b:Row)=>a.column_name.localeCompare(b.column_name));
    expect(actual.map(a=>({...a}))).toEqual(captured);
    const data=source(name);
    const columns=snapshot.columns.filter((c:Row)=>c.table_schema+'.'+c.table_name===name&&c.is_generated==='NEVER').map((c:Row)=>'"'+c.column_name+'"').join(',');
    if(data.length)await sql().unsafe(`insert into ${local(name)} (${columns}) overriding system value select ${columns} from jsonb_populate_recordset(null::${local(name)},$1::text::jsonb)`,[JSON.stringify(data)]);
    const [seq]=actual.some(c=>c.column_name==='id')?await sql()`select pg_get_serial_sequence(${local(name)},'id') name`:[{name:null}];
    if(seq.name)await sql().unsafe(`select setval($1::regclass,greatest(coalesce((select max(id) from ${local(name)}),0),1),true)`,[seq.name]);
  }
  vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('Offline rehearsal: external network forbidden')));
  vi.stubEnv('PREEVAL_EMAIL_ENABLED','true');
  m.intent.mockImplementation(async(id:string)=>verified.payments.find((p:Row)=>p.intent.id===id)!.intent);
  m.retrieve.mockImplementation(async(id:string)=>verified.payments.find((p:Row)=>p.session.id===id)!.session);
  for(const a of source('aet_preview_preeval.applications'))beforeStatus.push(await application(a.id));
  for(const a of source('aet_preview_evaluation.applications'))beforeFormal.push(await formalApplication(a.id,false));
  for(const q of queryCases)beforeCRM.push(await workspaceSnapshot(q,staff));
 },60000);
 afterAll(async()=>{
  vi.unstubAllGlobals();vi.unstubAllEnvs();await m.sql?.end({timeout:1});
  if(started)execFileSync(join(pgBin!,'pg_ctl'),['-D',join(directory,'data'),'-m','immediate','-w','stop'],{stdio:'pipe'});
  if(directory)rmSync(directory,{recursive:true,force:true});
 });
 it('restores every row and column of all 32 tables without changing the snapshot',async()=>{
  for(const name of expected)expect(digest(await rows(local(name))),name).toBe(digest(source(name)));
  expect(beforeCRM[0].total).toBe(10);
  expect(verified.files).toHaveLength(6);expect(verified.payments).toHaveLength(5);expect(verified.emails).toHaveLength(13);
  for(const a of source('aet_preview_preeval.applications'))sessions.push(await makeSession(a.id,'customer',a.email));
 });
 it('rolls back a late failure without changing existing core or formal rows',async()=>{
  await sql().unsafe('create table aet.unexpected_table(id integer)');
  await expect(convergeHistoricalPreevaluation(sql(),options)).rejects.toThrow('exactly 13');
  await sql().unsafe('drop table aet.unexpected_table');
  for(const name of expected.filter(n=>!n.endsWith('.sessions')))expect(digest(await rows(local(name))),name).toBe(digest(source(name)));
 });
 it('migrates all six applications, retains canonical rows and physically drops seven tables',async()=>{
  report=await convergeHistoricalPreevaluation(sql(),options);
  await activateConvergenceRehearsal(sql(),m.account);m.before=false;
  expect(report.applications).toHaveLength(6);expect(report.preservedCoreIds).toHaveLength(2);expect(report.exemptedTestIds).toEqual([exempt()]);
  expect(await sql()`select tablename from pg_tables where schemaname='aet'`).toHaveLength(13);
  expect(await sql()`select tablename from pg_tables where schemaname='preeval'`).toHaveLength(0);
  expect(await sql()`select conname from pg_constraint where contype='f' and not convalidated`).toHaveLength(0);
  for(const t of names.aet_preview_core){const target=await rows('aet.'+t);for(const original of source('aet_preview_core.'+t))expect(target.find(r=>r.id===original.id)).toEqual(original);}
  expect(await sql()`select id from aet.aet_payments where application_id=${exempt()}`).toHaveLength(0);
  expect(await sql()`select id from aet.aet_payments`).toHaveLength(5);
 });
 it('retains all ten CRM rows and every view, filter, office and total',async()=>{
  for(const [i,q] of queryCases.entries()){
    const before=JSON.parse(JSON.stringify(beforeCRM[i]));
    for(const row of before.rows)if(row.id===exempt()){row.payment_status='waived';row.amount=0;}
    const after=await workspaceSnapshot(q,staff);
    const project=(v:Row)=>({rows:v.rows,counts:v.counts,stats:v.stats,total:v.total,page:v.page});
    expect(normalize(project(after))).toEqual(normalize(project(before)));
  }
 });
 it('preserves all customer results and formal status without touching formal records',async()=>{
  for(const [i,a] of source('aet_preview_preeval.applications').entries()){
    const before:Row={...beforeStatus[i],...(a.id===exempt()?{payment_status:'waived'}:{})};
    const after=await application(a.id);
    for(const key of ['id','first_name','middle_name','last_name','email','country','status','payment_status','result','result_version','education','created_at'])
      expect(normalize(after[key])).toEqual(normalize(before[key]));
    // Canonical Status intentionally omits the legacy upload-attempt timestamp.
    const fileProjection=(files:Row[])=>files.map(({id,name,mime_type,bytes,state})=>({id,name,mime_type,bytes,state}));
    expect(fileProjection(after.files)).toEqual(fileProjection(before.files));
    m.cookie=sessions[i];
    expect((await getRoute(new Request('http://localhost:3022/api/pre-evaluation/applications/'+a.id),{params:Promise.resolve({path:['applications',a.id]})})).status).toBe(200);
  }
  for(const [i,a] of source('aet_preview_evaluation.applications').entries())expect(await formalApplication(a.id,false)).toEqual(beforeFormal[i]);
  for(const name of expected.filter(n=>n.startsWith('aet_preview_evaluation.')||n.includes('.fce_')))expect(digest(await rows(local(name))),name).toBe(digest(source(name)));
  for(const session of source('aet_preview_preeval.sessions'))expect((await rows('aet.aet_sessions')).find(r=>r.hash===session.hash)).toEqual(session);
 });
 it('replays signed callbacks without extra payments, AI runs or emails and blocks exempt Checkout',async()=>{
  const sdk=new Stripe('sk_test_synthetic');
  const counts=async()=>Promise.all(['aet_payments','aet_ai_runs','aet_emails'].map(t=>rows('aet.'+t).then(r=>r.length)));
  const before=await counts();
  for(const p of verified.payments){
    const payload=JSON.stringify({id:'evt_replay_'+p.id,type:'checkout.session.completed',livemode:false,data:{object:p.session}});
    const signature=sdk.webhooks.generateTestHeaderString({payload,secret:'whsec_local_convergence_test'});
    for(let i=0;i<2;i++)expect((await postRoute(new Request('http://localhost:3022/api/pre-evaluation/stripe-webhook',{method:'POST',headers:{'stripe-signature':signature},body:payload}),{params:Promise.resolve({path:['stripe-webhook']})})).status).toBe(200);
  }
  expect(await counts()).toEqual(before);
  expect((await rows('aet.aet_payments')).reduce((n,p)=>n+p.amount_cents,0)).toBe(9940);
  await expect(checkout(exempt())).rejects.toMatchObject({code:'payment_not_required'});expect(m.create).not.toHaveBeenCalled();
 });
 it('preserves original delivery receipts and does not resend sent emails',async()=>{
  const after=await rows('aet.aet_emails');
  for(const before of source('aet_preview_preeval.emails'))expect(after.find(e=>e.id===before.id)).toEqual(before);
  const deliver=vi.fn();for(const a of source('aet_preview_preeval.applications'))await flushEmails(deliver,a.id);
  expect(deliver).not.toHaveBeenCalled();
  writeFileSync(join(dirname(snapshotPath!),'rehearsal-report.json'),JSON.stringify({capturedAt:snapshot.captured_at,sourceTableCount:expected.length,
    applications:6,formalApplications:4,retiredTables:7,convergedTables:13,remainingTotalTables:25,sourceDigest:digest(snapshot.tables),
    migration:report,providerFiles:6,providerPayments:5,providerMailReceipts:13,checks:'See Vitest exit status for complete acceptance'}),{mode:0o600});
 });
 it('rolls back nine-table retirement after a physical drop fails',async()=>{
  await sql().unsafe(`create function public.block_nine_drop() returns event_trigger language plpgsql as $$ begin
    raise exception 'synthetic retirement failure'; end $$;
    create event trigger block_nine_drop on sql_drop execute function public.block_nine_drop();`);
  try{await expect(simplifyPreevaluationNine(sql())).rejects.toThrow('synthetic retirement failure');}
  finally{await sql().unsafe('drop event trigger block_nine_drop; drop function public.block_nine_drop();');}
  expect(await sql()`select tablename from pg_tables where schemaname='aet'`).toHaveLength(13);
  expect(await rows('aet.aet_emails')).toHaveLength(13);
  expect(await sql()`select column_name from information_schema.columns where table_schema='aet' and table_name='aet_documents' and column_name='upload_state'`).toHaveLength(0);
 });
 it('retires four more tables on the complete mixed copy and archives original rows outside the runtime',async()=>{
  const result=await simplifyPreevaluationNine(sql());
  await activateNineTableRehearsal(sql(),m.account);
  expect(result.tables).toHaveLength(9);expect(result.archive.aet_emails).toHaveLength(13);
  expect(result.archive.aet_sessions).toHaveLength(22);
  for(const name of ['aet_uploads','aet_emails','aet_access_tokens','aet_sessions'])
    expect((await sql()`select to_regclass(${'aet.'+name}) relation`)[0].relation).toBeNull();
  expect(await sql()`select tablename from pg_tables where schemaname in ('aet','evaluation') or (schemaname='public' and tablename in ('fce_applications','fce_educations'))`).toHaveLength(21);
  writeFileSync(join(dirname(snapshotPath!),'nine-retirement-archive.json'),JSON.stringify(result),{mode:0o600});
 });
 it('keeps all ten CRM rows, released results and formal data on the nine-table copy',async()=>{
  for(const [i,q] of queryCases.entries()){
    const before=JSON.parse(JSON.stringify(beforeCRM[i]));
    for(const row of before.rows)if(row.id===exempt()){row.payment_status='waived';row.amount=0;}
    const after=await workspaceSnapshot(q,staff);
    for(const key of ['rows','counts','stats','total','page'])expect(normalize(after[key as keyof typeof after])).toEqual(normalize(before[key]));
  }
  for(const [i,a] of source('aet_preview_preeval.applications').entries()){
    const after=await application(a.id);expect(after.result).toEqual(beforeStatus[i].result);
    expect(after.payment_status).toBe(a.id===exempt()?'waived':'paid');
    m.cookie='';expect((await getRoute(new Request('http://localhost:3022/api/pre-evaluation/applications/'+a.id),{params:Promise.resolve({path:['applications',a.id]})})).status).toBe(200);
  }
  for(const name of expected.filter(n=>n.startsWith('aet_preview_evaluation.')||n.includes('.fce_')))expect(digest(await rows(local(name))),name).toBe(digest(source(name)));
 });
 it('replays paid events and retains sent notification state without any email table or resend',async()=>{
  const sdk=new Stripe('sk_test_synthetic'),before=(await rows('aet.aet_payments'));
  for(const p of verified.payments){
    const payload=JSON.stringify({id:'evt_nine_'+p.id,type:'checkout.session.completed',livemode:false,data:{object:p.session}});
    const signature=sdk.webhooks.generateTestHeaderString({payload,secret:'whsec_local_convergence_test'});
    for(let i=0;i<2;i++)expect((await postRoute(new Request('http://localhost:3022/api/pre-evaluation/stripe-webhook',{method:'POST',headers:{'stripe-signature':signature},body:payload}),{params:Promise.resolve({path:['stripe-webhook']})})).status).toBe(200);
  }
  expect(await rows('aet.aet_payments')).toEqual(before);
  const deliver=vi.fn();
  for(const a of source('aet_preview_preeval.applications')){
    const notifications=await compactNotificationRows(a.id);expect(notifications.length).toBeLessThanOrEqual(4);
    for(const n of notifications){expect(n.state).toBe('sent');expect(verified.emails.some((e:Row)=>e.providerId===n.provider_id)).toBe(true);}
    await flushEmails(deliver,a.id);
  }
  expect(deliver).not.toHaveBeenCalled();await expect(checkout(exempt())).rejects.toMatchObject({code:'payment_not_required'});
 });

 it('rolls back payment-event retirement when DROP fails',async()=>{
  const before=await rows('aet.aet_payment_events');
  await sql().unsafe(`create function public.block_eight_drop() returns event_trigger language plpgsql as $$ begin
    raise exception 'synthetic event retirement failure'; end $$;
    create event trigger block_eight_drop on sql_drop execute function public.block_eight_drop();`);
  try{await expect(simplifyPreevaluationEight(sql())).rejects.toThrow('synthetic event retirement failure');}
  finally{await sql().unsafe('drop event trigger block_eight_drop; drop function public.block_eight_drop();');}
  expect(await rows('aet.aet_payment_events')).toEqual(before);
  expect(await sql()`select tablename from pg_tables where schemaname='aet'`).toHaveLength(9);
 });
 it('retires the event table on the complete copy and retains all business and formal records',async()=>{
  const before=await workspaceSnapshot({},staff),payments=await rows('aet.aet_payments');
  const events=await rows('aet.aet_payment_events');
  const retired=await simplifyPreevaluationEight(sql());await activateEightTableRehearsal(sql(),m.account);
  expect(retired.tables).toHaveLength(8);expect(digest(retired.archive)).toBe(digest(events));
  expect((await sql()`select to_regclass('aet.aet_payment_events') relation`)[0].relation).toBeNull();
  expect(await sql()`select tablename from pg_tables where schemaname in ('aet','evaluation') or (schemaname='public' and tablename in ('fce_applications','fce_educations'))`).toHaveLength(20);
  expect(await workspaceSnapshot({},staff)).toEqual(before);expect(await rows('aet.aet_payments')).toEqual(payments);
  for(const name of expected.filter(n=>n.startsWith('aet_preview_evaluation.')||n.includes('.fce_')))expect(digest(await rows(local(name))),name).toBe(digest(source(name)));
  writeFileSync(join(dirname(snapshotPath!),'eight-retirement-archive.json'),JSON.stringify(retired),{mode:0o600});
 });
 it('replays signed payments on eight tables without changing paid rows, receipts or released results',async()=>{
  const payments=await rows('aet.aet_payments'),services=await rows('aet.aet_service_detail');
  const sdk=new Stripe('sk_test_synthetic');
  for(const p of verified.payments){
    const payload=JSON.stringify({id:'evt_eight_'+p.id,type:'checkout.session.completed',livemode:false,data:{object:p.session}});
    const signature=sdk.webhooks.generateTestHeaderString({payload,secret:'whsec_local_convergence_test'});
    const replies=await Promise.all([0,1].map(()=>postRoute(new Request('http://localhost:3022/api/pre-evaluation/stripe-webhook',
      {method:'POST',headers:{'stripe-signature':signature},body:payload}),{params:Promise.resolve({path:['stripe-webhook']})})));
    expect(replies.map(r=>r.status)).toEqual([200,200]);
  }
  expect(await rows('aet.aet_payments')).toEqual(payments);
  expect(await rows('aet.aet_service_detail')).toEqual(services);
  const send=vi.fn();
  for(const [i,a] of source('aet_preview_preeval.applications').entries()){
    expect((await application(a.id)).result).toEqual(beforeStatus[i].result);await flushEmails(send,a.id);
  }
  expect(send).not.toHaveBeenCalled();await expect(checkout(exempt())).rejects.toMatchObject({code:'payment_not_required'});
 });

 it('rolls back both audit and rate-limit retirement if the second DROP fails',async()=>{
  const audit=await rows('aet.aet_audit'),limits=await rows('aet.aet_rate_limits');
  await sql().unsafe(`create function public.block_six_drop() returns event_trigger language plpgsql as $$ begin
    if exists(select 1 from pg_event_trigger_dropped_objects() where object_name='aet_rate_limits') then
      raise exception 'synthetic counters retirement failure'; end if; end $$;
    create event trigger block_six_drop on sql_drop execute function public.block_six_drop();`);
  try{await expect(simplifyPreevaluationSix(sql())).rejects.toThrow('synthetic counters retirement failure');}
  finally{await sql().unsafe('drop event trigger block_six_drop; drop function public.block_six_drop();');}
  expect(await rows('aet.aet_audit')).toEqual(audit);expect(await rows('aet.aet_rate_limits')).toEqual(limits);
 });
 it('retires optional history and counters without changing current business records',async()=>{
  const crm=await workspaceSnapshot({},staff),payments=await rows('aet.aet_payments'),services=await rows('aet.aet_service_detail');
  const audit=await rows('aet.aet_audit');
  const retired=await simplifyPreevaluationSix(sql());await activateSixTableRehearsal(sql(),m.account);
  expect(retired.tables).toHaveLength(6);expect(digest(retired.archive.audit)).toBe(digest(audit));
  for(const name of ['aet_audit','aet_rate_limits'])expect((await sql()`select to_regclass(${'aet.'+name}) relation`)[0].relation).toBeNull();
  expect(await sql()`select tablename from pg_tables where schemaname in ('aet','evaluation') or (schemaname='public' and tablename in ('fce_applications','fce_educations'))`).toHaveLength(18);
  expect(await workspaceSnapshot({},staff)).toEqual(crm);expect(await rows('aet.aet_payments')).toEqual(payments);expect(await rows('aet.aet_service_detail')).toEqual(services);
  for(const name of expected.filter(n=>n.startsWith('aet_preview_evaluation.')||n.includes('.fce_')))expect(digest(await rows(local(name))),name).toBe(digest(source(name)));
  writeFileSync(join(dirname(snapshotPath!),'six-retirement-archive.json'),JSON.stringify(retired),{mode:0o600});
 });
 it('reads historical results and replays paid callbacks without audit or request counters',async()=>{
  const payments=await rows('aet.aet_payments'),services=await rows('aet.aet_service_detail');
  const sdk=new Stripe('sk_test_synthetic');
  for(const p of verified.payments){
    const payload=JSON.stringify({id:'evt_six_'+p.id,type:'checkout.session.completed',livemode:false,data:{object:p.session}});
    const signature=sdk.webhooks.generateTestHeaderString({payload,secret:'whsec_local_convergence_test'});
    for(let i=0;i<2;i++)expect((await postRoute(new Request('http://localhost:3022/api/pre-evaluation/stripe-webhook',
      {method:'POST',headers:{'stripe-signature':signature},body:payload}),{params:Promise.resolve({path:['stripe-webhook']})})).status).toBe(200);
  }
  expect(await rows('aet.aet_payments')).toEqual(payments);expect(await rows('aet.aet_service_detail')).toEqual(services);
  const send=vi.fn();
  for(const [i,a] of source('aet_preview_preeval.applications').entries()){
    expect((await application(a.id)).result).toEqual(beforeStatus[i].result);
    expect((await application(a.id,true)).audit).toEqual([]);await flushEmails(send,a.id);
  }
  expect(send).not.toHaveBeenCalled();await expect(checkout(exempt())).rejects.toMatchObject({code:'payment_not_required'});
 });

});
