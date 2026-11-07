import { afterAll,beforeAll,beforeEach,describe,expect,it,vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync,readFileSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join,dirname } from 'node:path';
import { createHash,randomUUID } from 'node:crypto';
import postgres from 'postgres';
import { PDFDocument } from 'pdf-lib';
import Stripe from 'stripe';
import { NextRequest } from 'next/server';
import { POST as postRoute,GET as getRoute } from '../app/api/pre-evaluation/[...path]/route';
import { POST as lookupRoute } from '../app/api/pre-evaluation/lookup/route';
import { AIError } from '../lib/preeval/ai-contract';
import { activateConvergenceRehearsal,convergedTableName } from '../lib/application-core/convergence-mode';
import { makeLink,consumeLink } from '../lib/preeval/auth';
const m=vi.hoisted(()=>({sql:undefined as ReturnType<typeof postgres>|undefined,
  cookie:'',list:vi.fn(),start:vi.fn(),append:vi.fn(),finish:vi.fn(),upload:vi.fn(),metadata:vi.fn(),download:vi.fn(),create:vi.fn(),retrieve:vi.fn(),intent:vi.fn()}));
vi.mock('server-only',()=>({}));
vi.mock('../lib/preeval/db',()=>({db:()=>m.sql!,table:(name:string)=>m.sql!(convergedTableName(m.sql!,name)||name),
  audit:async(id:string,actor:string,action:string)=>{await m.sql!`insert into ${m.sql!(convergedTableName(m.sql!,'preeval.audit')||'preeval.audit')}(application_id,actor,action) values (${id},${actor},${action})`;}}));
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
import { activateCoreRehearsal,syncCoreWorkflow,coreRuntimeEnabled,updateCoreEducation,coreAdminApplications } from '../lib/application-core/runtime';
import { createCoreShadowReader } from '../lib/application-core/reader';
import { downloadCoreFile,coreUploadPath } from '../lib/application-core/documents';
import { uploadDocument } from '../lib/preeval/uploads';
import { submit,addFile,application,staffAction } from '../lib/preeval/service';
import { completeUploads,startDocumentUpload,finishDocumentUpload } from '../lib/preeval/ai-jobs';
import { unfinishedUploads,abandonUpload } from '../lib/preeval/upload-recovery';
import { processAI } from '../lib/preeval/ai';
import { checkout,applyCheckout,handleStripeEvent } from '../lib/preeval/payments';
import { flushEmails } from '../lib/preeval/email';
import { workspaceSnapshot } from '../lib/crm/workspace-server';
import { rehearsePreevaluation } from '../scripts/database/preeval-backfill';
import { TOTAL_CENTS } from '../lib/preeval/domain';
const pgBin=process.env.APPLICATION_CORE_TEST_PG_BIN;
const read=(path:string)=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const input=()=>({requestId:randomUUID(),locale:'zh',email:'synthetic@example.invalid',firstName:'Core',middleName:'',lastName:'Applicant',country:'US',
  schoolName:'Core University',countryOfStudy:'US',degreeObtained:'Bachelor of Science',startDate:'2018-09',endDate:'2022-06',terms:true,uploadsPending:true});
const result={result:'Synthetic equivalency',reasoning:'Synthetic assessment only.'};
const generated={analysis:{...result,basis:'documents' as const,facts:{institution:null,country:null,qualification:null,start:null,completion:null},issues:[],evidence:[]},
  pageMap:[],model:'synthetic-model',responseId:'synthetic-response',usage:{input_tokens:1,output_tokens:1,total_tokens:2}};


import { convergeHistoricalPreevaluation } from '../scripts/database/converge-preeval-history';
import { makeSession } from '../lib/preeval/auth';
import { applicationSchema,BASE_CENTS } from '../lib/preeval/domain';
type Row=Record<string,any>;
describe.skipIf(!pgBin).each([false,true])('populated pre-evaluation retirement, mixed=%s (owned PostgreSQL)',(mixed)=>{
  let directory:string,started=false;
  const sql=()=>m.sql!;
  const capturedPath=process.env.APPLICATION_CORE_HISTORY_SNAPSHOT;
  const evidence=new Map<string,any>();
  const noChargeAudits=new Map<string,string>();
  let coreBefore:Record<string,Row[]>={},coreInputs:Row[]=[],pdf:Buffer;
  const coreTables=['aet_core_applications','aet_education','aet_service_detail','aet_documents','aet_payments'];
  let originals:Row[]=[];
  let paymentEvidence:Row[]=[];
  let account='acct_synthetic';
  let beforeStatus:Row[]=[];
  let beforeCRM:Row[]=[];
  let beforeOps:Record<string,Row[]>={};
  let links:string[]=[];
  let sessions:string[]=[];
  let report:Awaited<ReturnType<typeof convergeHistoricalPreevaluation>>;
  const tables:Record<string,string>={applications:'preeval.applications',educations:'preeval.educations',files:'preeval.files',payments:'preeval.payments',
    legacyApplications:'public.aet_core_applications',legacyEducations:'public.aet_core_educations',legacyPayments:'public.aet_core_payments',
    emails:'preeval.emails',audit:'preeval.audit',aiRuns:'preeval.ai_runs',paymentEvents:'preeval.payment_events'};
  const ops:Record<string,string>={emails:'aet_emails',audit:'aet_audit',ai_runs:'aet_ai_runs',payment_events:'aet_payment_events',
    tokens:'aet_access_tokens',sessions:'aet_sessions',rate_limits:'aet_rate_limits',files:'aet_uploads'};
  const queries:Record<string,string>[]=[{},{view:'equivalency'},{view:'payments'},{view:'documents'},{filter:'completed'},{sort:'name'},{export:'csv'}];
  const options=()=>({providerAccount:account,payments:paymentEvidence.map(p=>({id:p.id,applicationId:p.applicationId,
    amountCents:p.session.amount_total,currency:p.session.currency,checkoutSessionId:p.session.id,paymentIntentId:p.intent.id,
    status:p.intent.latest_charge.amount_refunded>0?(p.intent.latest_charge.amount_refunded>=p.session.amount_total?'refunded':'partially_refunded'):'paid',
    refundedCents:p.intent.latest_charge.amount_refunded,providerMode:'test' as const})),cohort:originals.map(a=>({applicationId:a.id,noChargeAuditId:noChargeAudits.get(a.id),evidence:evidence.get(a.id)}))});
  async function snapshot(name:string){return (await sql()`select to_jsonb(t) data from ${sql()(name)} t order by to_jsonb(t)::text`).map(r=>r.data);}
  async function seed(){
    if(capturedPath){
      const all=JSON.parse(readFileSync(capturedPath,'utf8'));
      const verified=JSON.parse(readFileSync(join(dirname(capturedPath),'verified.json'),'utf8'));
      if(all.applications.length!==4 || all.applications.some((a:Row)=>!a.first_name.startsWith('AET ')||!a.last_name.includes('Test')))
        throw new Error('Only the previously captured four-record synthetic Preview snapshot is permitted');
      account=verified.providerAccount;paymentEvidence=[...verified.payments,...paymentEvidence];
      const eligible=new Set(mixed?all.applications.map((a:Row)=>a.id):paymentEvidence.map(p=>p.applicationId));
      for(const [key,name] of Object.entries(tables)){
        const rows=(all[key]||[]).filter((r:Row)=>key==='paymentEvents'||eligible.has(r.application_id||r.id));
        if(rows.length)await sql().unsafe(`insert into ${name} overriding system value select * from jsonb_populate_recordset(null::${name},$1::text::jsonb)`,[JSON.stringify(rows)]);
      }
      originals=all.applications.filter((a:Row)=>eligible.has(a.id));
      for(const a of originals)evidence.set(a.id,{verifiedServicePrice:{amountCents:BASE_CENTS,currency:'USD',source:'automatic'},
        files:verified.files.filter((f:Row)=>all.files.some((r:Row)=>r.application_id===a.id&&r.id===f.legacyFileId))});
    }else{
      for(let i=0;i<(mixed?4:3);i++){
        const v={...input(),firstName:'History'+i},a=randomUUID(),e=randomUUID(),f=randomUUID(),p=randomUUID();
        const pending=i===2,exempt=i===3;
        await sql()`insert into preeval.applications(id,request_id,request_hash,email,first_name,middle_name,last_name,country,locale,status,payment_status,
          result,result_version,ai_status,ai_pipeline,uploads_pending,input_version,ai_attempts)
          values (${a},${v.requestId},${createHash('sha256').update(JSON.stringify(applicationSchema.parse(v))).digest('hex')},${v.email},${v.firstName},'',${v.lastName},'US','zh',
            ${pending?'processing':'completed'},${pending?'unpaid':'paid'},${pending?null:sql().json(result)},7,${pending?'idle':'completed'},'openai',${pending},4,${pending?0:1})`;
        await sql()`insert into public.aet_core_applications(id,email,first_name,middle_name,last_name,status,purpose)
          values (${a},${v.email},${v.firstName},'',${v.lastName},${pending?'processing':'completed'},'degree-equivalency')`;
        await sql()`insert into preeval.educations(id,application_id,school_name,country_of_study,degree_obtained,start_date,end_date)
          values (${e},${a},${v.schoolName},'US',${v.degreeObtained},'2018-09','2022-06')`;
        await sql()`insert into public.aet_core_educations(id,application_id,school_name,country_of_study,degree_obtained,study_start_date,study_end_date)
          values (${e},${a},${v.schoolName},'US',${v.degreeObtained},' {"year":"2018","month":"09"}'::jsonb,'{"year":"2022","month":"06"}'::jsonb)`;
        if(!pending){
          await sql()`insert into preeval.files(id,application_id,name,mime_type,bytes,sha256,dropbox_path,state)
            values (${f},${a},'degree.pdf','application/pdf',200,${'hash'+i},${'/synthetic/'+a+'/degree.pdf'},'ready')`;
          if(!exempt){
          await sql()`insert into preeval.payments(id,application_id,session_id,payment_intent,amount_cents,status) values (${p},${a},${'cs_'+a},${'pi_'+a},${TOTAL_CENTS},'paid')`;
          await sql()`insert into public.aet_core_payments(id,application_id,due_amount,payment_status,paid_at,payment_id)
            values (${p},${a},${TOTAL_CENTS/100},'paid','2026-10-01T12:00:00.123456Z',${'pi_'+a}) on conflict(id) do update set paid_at=excluded.paid_at`;
          const session={id:'cs_'+a,livemode:false,mode:'payment',client_reference_id:a,metadata:{pilot:'aet-2026-local',applicationId:a},currency:'usd',amount_total:TOTAL_CENTS,
            payment_status:'paid',status:'complete',payment_intent:'pi_'+a};
          const intent={id:'pi_'+a,livemode:false,status:'succeeded',currency:'usd',amount:TOTAL_CENTS,latest_charge:{id:'ch_'+a,livemode:false,currency:'usd',amount:TOTAL_CENTS,amount_refunded:0,payment_intent:'pi_'+a}};
          paymentEvidence.push({id:p,applicationId:a,session,intent});
          await sql()`insert into preeval.payment_events(id,type) values (${`evt_history_${a}`},'checkout.session.completed')`;
          }
          // Two old runs must remain, not collapse into one overwritten history row.
          for(const version of [3,4])await sql()`insert into preeval.ai_runs(application_id,input_version,input,output,state,model,completed_at)
            values (${a},${version},'{}',${sql().json(generated.analysis)},'completed','old-model',now())`;
        }else{
          await sql()`insert into preeval.document_uploads(application_id,file_key,attempt_id,state,updated_at)
            values (${a},'failed.pdf',${randomUUID()},'failed','2026-10-02T12:00:00.123456Z')`;
        }
        await sql()`insert into preeval.emails(application_id,kind,dedupe_key,recipient,state,provider_id,sent_at,attempts,payload_hash,result_version)
          values (${a},'confirmation',${'application:'+a},'synthetic@example.invalid','sent','sent-before-migration',now(),1,'original-payload',null)`;
        if(!pending)await sql()`insert into preeval.emails(application_id,kind,dedupe_key,recipient,state,provider_id,sent_at,attempts,payload_hash,result_version)
          values (${a},'result',${'result:'+a+':7'},'synthetic@example.invalid','sent','result-before-migration',now(),1,'original-result',7)`;
        if(exempt)await sql()`insert into preeval.audit(application_id,actor,action,detail) values (${a},'synthetic-e2e-test','test.payment_fixture',
          '{"synthetic":true,"noCharge":true,"purpose":"Synthetic release test without Stripe"}')`;
        const [row]=await sql()`select * from preeval.applications where id=${a}`;originals.push(row);
        evidence.set(a,{originalSubmission:v,verifiedServicePrice:{amountCents:BASE_CENTS,currency:'USD',source:'automatic'},files:pending?[]:[{
          legacyFileId:f,storageLocation:'AET_App',fileId:'id:'+f,revision:'original-rev',contentHash:null,path:'/synthetic/'+a+'/degree.pdf',name:'degree.pdf',size:200}]});
      }
    }
    if(mixed)for(const row of await sql()`select id,application_id from preeval.audit where action='test.payment_fixture'`)noChargeAudits.set(row.application_id,String(row.id));
    await sql()`select setval(pg_get_serial_sequence('preeval.audit','id'),greatest(coalesce((select max(id) from preeval.audit),0),1),true)`;
  }
  async function seedCore(){
    const doc=await PDFDocument.create();doc.addPage();pdf=Buffer.from(await doc.save());
    const metadata=new Map<string,Row>();
    m.upload.mockImplementation(async({path,contents}:{path:string;contents:Buffer})=>{
      const id='id:'+randomUUID(),data={'.tag':'file',id,rev:'core-rev',name:path.split('/').pop(),path_display:path,size:contents.length,
        content_hash:createHash('sha256').update(contents).digest('hex')};metadata.set(id,data);return {result:data};
    });
    m.metadata.mockImplementation(async({path}:{path:string})=>({result:metadata.get(path)}));
    m.download.mockImplementation(async()=>({result:{fileBinary:pdf}}));
    for(const settled of [true,false]){
      const v={...input(),firstName:settled?'NewPaid':'NewQueued'};coreInputs.push(v);
      const {app}=await submit(v);
      await addFile(app.id,new File([new Uint8Array(pdf)],'core.pdf',{type:'application/pdf'}),'customer');
      await completeUploads(app.id);
      if(settled){
        const id=app.id,p=randomUUID(),session={id:'cs_'+id,livemode:false,mode:'payment',client_reference_id:id,
          metadata:{pilot:'aet-2026-local',applicationId:id},currency:'usd',amount_total:TOTAL_CENTS,payment_status:'paid',status:'complete',payment_intent:'pi_'+id};
        const intent={id:'pi_'+id,livemode:false,status:'succeeded',currency:'usd',amount:TOTAL_CENTS,
          latest_charge:{id:'ch_'+id,livemode:false,currency:'usd',amount:TOTAL_CENTS,amount_refunded:0,payment_intent:'pi_'+id}};
        paymentEvidence.push({id:p,applicationId:id,session,intent});
        await sql()`insert into preeval.payments(id,application_id,session_id,payment_intent,amount_cents,status) values (${p},${id},${session.id},${intent.id},${TOTAL_CENTS},'paid')`;
        await sql()`update preeval.applications set status='completed',payment_status='paid',ai_status='completed',result=${sql().json(result)},result_version=5 where id=${id}`;
        await sql().begin(tx=>syncCoreWorkflow(tx,id));
      }
      // Core profile and education are authoritative despite stale workflow copies.
      await sql()`update preeval.applications set first_name='STALE COPY',email='stale@example.invalid' where id=${app.id}`;
      await sql()`update aet.aet_education set school_name='Authoritative Core University' where application_id=${app.id}`;
      const files=await sql()`select * from aet.aet_documents where application_id=${app.id}`;
      evidence.set(app.id,{verifiedServicePrice:{amountCents:BASE_CENTS,currency:'USD',source:'automatic'},files:files.map(f=>({
        legacyFileId:f.id,storageLocation:f.storage_location,fileId:f.storage_file_id,revision:f.storage_rev,contentHash:f.storage_content_hash,
        path:f.storage_path,name:f.original_filename,size:Number(f.size_bytes)}))});
      const [a]=await sql()`select * from preeval.applications where id=${app.id}`;originals.push(a);
    }
  }
  beforeAll(async()=>{
    directory=mkdtempSync(join(tmpdir(),'aet-history-convergence-'));
    execFileSync(join(pgBin!,'initdb'),['-D',join(directory,'data'),'-U','core_rehearsal','-A','trust','--locale=C','--encoding=UTF8'],{timeout:30000,stdio:'pipe'});
    execFileSync(join(pgBin!,'pg_ctl'),['-D',join(directory,'data'),'-l',join(directory,'pg.log'),'-o',`-F -k ${directory} -h '' -p 55447`,'-w','start'],{timeout:30000,stdio:'pipe'});started=true;
    const connection={host:directory,port:55447,username:'core_rehearsal',onnotice:()=>{},connection:{statement_timeout:10000}};
    const admin=postgres({...connection,database:'postgres',max:1});
    try{await expect(convergeHistoricalPreevaluation(admin,{providerAccount:account,cohort:[],payments:[]})).rejects.toThrow('disposable');await admin.unsafe('create database aet_core_rehearsal');}finally{await admin.end();}
    m.sql=postgres({...connection,database:'aet_core_rehearsal',max:5});
    await sql().unsafe('create role anon; create role authenticated;');
    for(const n of ['20261002000100_pre_evaluation.sql','20261002000200_formal_evaluation.sql','20261002000300_evaluation_workflow.sql',
      '20261020165103_email_delivery_records.sql','20261020173355_formal_email_delivery_records.sql','20261020230256_application_document_locations.sql','20261020232924_preeval_gpt_analysis.sql'])
      await sql().unsafe(read('supabase/migrations/'+n));
    await sql().unsafe(read('scripts/legacy/schema-fixture.sql'));await sql().unsafe(read('scripts/legacy/workflow-bridge.sql'));
    await sql().unsafe(read('supabase/migrations/20261106220126_shared_application_core.sql'));
    vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('External network forbidden')));
    vi.stubEnv('PREEVAL_EMAIL_ENABLED','true');vi.spyOn(console,'error').mockImplementation(()=>{});
    if(mixed){
      if(capturedPath)account=JSON.parse(readFileSync(join(dirname(capturedPath),'verified.json'),'utf8')).providerAccount;
      await activateCoreRehearsal(sql(),account);await seedCore();
    }
    const newRows=originals;originals=[];
    await seed();originals.push(...newRows);
    m.intent.mockImplementation(async(id:string)=>paymentEvidence.find(p=>p.intent.id===id)!.intent);
    for(const a of originals){
      links.push((await makeLink(a.id,'customer',a.email,'zh')).split('#token=')[1]);
      sessions.push(await makeSession(a.id,'customer',a.email));
      beforeStatus.push(await application(a.id));
    }
    for(const query of queries)
      beforeCRM.push(await workspaceSnapshot(query,{email:'staff@example.invalid',offices:[],include_unassigned:true}));
    if(mixed){
      const delivered=vi.fn().mockResolvedValue('local-mail');
      for(const a of originals)await flushEmails(delivered,a.id);
      for(const t of coreTables)coreBefore[t]=await snapshot('aet.'+t);
    }
    for(const name of Object.keys(ops))beforeOps[name]=await snapshot('preeval.'+name);
  },60000);
  afterAll(async()=>{
    vi.unstubAllGlobals();vi.unstubAllEnvs();vi.restoreAllMocks();await m.sql?.end({timeout:1});
    if(started)execFileSync(join(pgBin!,'pg_ctl'),['-D',join(directory,'data'),'-m','immediate','-w','stop'],{timeout:10000,stdio:'pipe'});
    if(directory)rmSync(directory,{recursive:true,force:true});
  });
  it('refuses incomplete cohorts and rolls back every failed preflight or late mapping',async()=>{
    const before=await snapshot('preeval.applications');
    const missing=options();missing.cohort=missing.cohort.slice(1);
    await expect(convergeHistoricalPreevaluation(sql(),missing)).rejects.toThrow('Every source application');
    const bad=options();bad.cohort=bad.cohort.map((c,i)=>i===0?{...c,evidence:{...c.evidence,files:[]}}:c);
    await expect(convergeHistoricalPreevaluation(sql(),bad)).rejects.toThrow('File ID');
    const id=originals[0].id;
    await sql()`update preeval.applications set payment_status='unpaid' where id=${id}`;
    await expect(convergeHistoricalPreevaluation(sql(),options())).rejects.toThrow('ledger');
    await sql()`update preeval.applications set payment_status='paid' where id=${id}`;
    const attempt=randomUUID();
    await sql()`insert into preeval.document_uploads(application_id,file_key,attempt_id,state) values (${id},'missing-index.pdf',${attempt},'ready')`;
    await expect(convergeHistoricalPreevaluation(sql(),options())).rejects.toThrow('Ready shared upload');
    await sql()`delete from preeval.document_uploads where attempt_id=${attempt}`;
    expect(await snapshot('preeval.applications')).toEqual(before);
    expect(await sql()`select id from aet.aet_core_applications`).toHaveLength(mixed?2:0);
    expect((await sql()`select to_regclass('aet.aet_uploads') relation`)[0].relation).toBeNull();
    expect(await snapshot('preeval.emails')).toEqual(beforeOps.emails);
    const unverified=options();unverified.payments[0]={...unverified.payments[0],amountCents:1};
    await expect(convergeHistoricalPreevaluation(sql(),unverified)).rejects.toThrow('provider evidence');
    if(mixed){
      const id=coreBefore.aet_core_applications[0].id;
      const [before]=await sql()`select request_hash from preeval.applications where id=${id}`;
      await sql()`update preeval.applications set request_hash='wrong' where id=${id}`;
      await expect(convergeHistoricalPreevaluation(sql(),options())).rejects.toThrow('identity mismatch');
      await sql()`update preeval.applications set request_hash=${before.request_hash} where id=${id}`;
      await sql()`update aet.aet_service_detail set input_version=input_version+1 where application_id=${id}`;
      await expect(convergeHistoricalPreevaluation(sql(),options())).rejects.toThrow('parity');
      await sql()`update aet.aet_service_detail set input_version=input_version-1 where application_id=${id}`;
      const [job]=await sql()`select ai_status from preeval.applications where id=${id}`;
      await sql()`update preeval.applications set ai_status='running' where id=${id}`;
      await expect(convergeHistoricalPreevaluation(sql(),options())).rejects.toThrow('quiescent');
      await sql()`update preeval.applications set ai_status=${job.ai_status} where id=${id}`;
      const [file]=await sql()`select id from preeval.files where application_id=${id}`;
      await sql()`update preeval.files set state='uploading' where id=${file.id}`;
      await expect(convergeHistoricalPreevaluation(sql(),options())).rejects.toThrow('quiescent');
      await sql()`update preeval.files set state='ready' where id=${file.id}`;
      const [mail]=await sql()`select id,state from preeval.emails where application_id=${id} limit 1`;
      await sql()`update preeval.emails set state='sending' where id=${mail.id}`;
      await expect(convergeHistoricalPreevaluation(sql(),options())).rejects.toThrow('quiescent');
      await sql()`update preeval.emails set state=${mail.state} where id=${mail.id}`;
      const missingAudit=options();missingAudit.cohort=missingAudit.cohort.map(c=>({...c,noChargeAuditId:undefined}));
      await expect(convergeHistoricalPreevaluation(sql(),missingAudit)).rejects.toThrow('ledger');
      const fakeAudit=options();fakeAudit.cohort=fakeAudit.cohort.map(c=>c.noChargeAuditId?{...c,noChargeAuditId:'-1'}:c);
      await expect(convergeHistoricalPreevaluation(sql(),fakeAudit)).rejects.toThrow('original synthetic audit');
    }
    // Force failure after DROP, proving PostgreSQL rolls back the complete DDL transaction.
    await sql().unsafe('create table aet.unexpected_table(id integer)');
    await expect(convergeHistoricalPreevaluation(sql(),options())).rejects.toThrow('exactly 13');
    await sql().unsafe('drop table aet.unexpected_table');
    expect(await snapshot('preeval.applications')).toEqual(before);
    expect(await snapshot('preeval.emails')).toEqual(beforeOps.emails);
    expect(await sql()`select id from aet.aet_core_applications`).toHaveLength(mixed?2:0);
  });
  it('migrates the complete reconciled cohort atomically and physically removes old tables',async()=>{
    report=await convergeHistoricalPreevaluation(sql(),options());
    await activateConvergenceRehearsal(sql(),account);
    expect(report.applications).toHaveLength(originals.length);
    if(mixed)for(const t of coreTables){
      const after=await snapshot('aet.'+t);
      for(const before of coreBefore[t])expect(after.find(r=>r.id===before.id)).toEqual(before);
    }
    expect(await sql()`select tablename from pg_tables where schemaname='aet'`).toHaveLength(13);
    expect(await sql()`select relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where
      n.nspname='preeval' and c.relkind in ('r','v','m','p')`).toHaveLength(0);
    expect(await sql()`select conname from pg_constraint where contype='f' and not convalidated`).toHaveLength(0);
    const received=await snapshot('aet.aet_emails');expect(received).toEqual(beforeOps.emails);
    for(const source of ['tokens','sessions','rate_limits'])expect(await snapshot('aet.'+ops[source])).toEqual(beforeOps[source]);
    for(const source of ['audit','ai_runs','files','payment_events']){
      const next=await snapshot('aet.'+ops[source]);
      for(const old of beforeOps[source]){
        const id=source==='payment_events'?account+':test:'+old.id:old.id;
        const moved=next.find(n=>n.id===id);expect(moved).toBeTruthy();
        for(const [key,value] of Object.entries(old))expect(moved![key]).toEqual(key==='id'?id:value);
      }
    }
    const ledger=await snapshot('aet.aet_payments');
    expect(ledger.reduce((sum,p)=>sum+p.amount_cents,0)).toBe(paymentEvidence.reduce((sum,p)=>sum+p.session.amount_total,0));
  });
  it('keeps CRM and customer business projections equal after source deletion',async()=>{
    const stable=(a:Row)=>({id:a.id,first_name:a.first_name,last_name:a.last_name,email:a.email,status:a.status,payment_status:a.payment_status,
      ai_status:a.ai_status,uploads_pending:a.uploads_pending,result:a.result,result_version:a.result_version,education:a.education,
      files:a.files.filter((f:Row)=>f.state==='ready').map((f:Row)=>({id:f.id,name:f.name,mime_type:f.mime_type,bytes:f.bytes,state:f.state})).sort((a:Row,b:Row)=>a.id.localeCompare(b.id))});
    for(const [i,a] of originals.entries())expect(stable(await application(a.id))).toEqual({...stable(beforeStatus[i]),...(noChargeAudits.has(a.id)?{payment_status:'waived'}:{})});
    for(const [i,query] of queries.entries()){
      const expected=JSON.parse(JSON.stringify(beforeCRM[i]));
      for(const row of expected.rows)if(noChargeAudits.has(row.id)){row.payment_status='waived';row.amount=0;}
      const next=await workspaceSnapshot(query,{email:'staff@example.invalid',offices:[],include_unassigned:true});
      // Compare the user-visible rows and aggregates, excluding runtime environment labels.
      expect(JSON.parse(JSON.stringify({rows:next.rows,stats:next.stats,counts:next.counts,total:next.total})))
        .toEqual(JSON.parse(JSON.stringify({rows:expected.rows,stats:expected.stats,counts:expected.counts,total:expected.total})));
    }
  });
  it('keeps pre-existing sessions and one-use links valid and rejects foreign application access',async()=>{
    for(const [i,a] of originals.entries()){
      m.cookie=sessions[i];
      const response=await getRoute(new Request('http://localhost:3022/api/pre-evaluation/applications/'+a.id),{params:Promise.resolve({path:['applications',a.id]})});
      expect(response.status).toBe(200);
      expect((await consumeLink(links[i])).row.application_id).toBe(a.id);
      await expect(consumeLink(links[i])).rejects.toMatchObject({code:'invalid_link'});
    }
    m.cookie=sessions[0];
    const other=await getRoute(new Request('http://localhost:3022/api/pre-evaluation/applications/'+originals[1].id),{params:Promise.resolve({path:['applications',originals[1].id]})});
    expect(other.status).toBe(401);
  });
  it('replays signed legacy callbacks without new payments, AI runs or mail and preserves refunded state',async()=>{
    const sdk=new Stripe('sk_test_synthetic');
    const post=async(event:Row)=>{const payload=JSON.stringify(event),signature=sdk.webhooks.generateTestHeaderString({payload,secret:'whsec_local_convergence_test'});
      return postRoute(new Request('http://localhost:3022/api/pre-evaluation/stripe-webhook',{method:'POST',headers:{'stripe-signature':signature},body:payload}),{params:Promise.resolve({path:['stripe-webhook']})});};
    const counts=async()=>({payments:(await snapshot('aet.aet_payments')).length,ai:(await snapshot('aet.aet_ai_runs')).length,emails:(await snapshot('aet.aet_emails')).length});
    const before=await counts();
    for(const p of paymentEvidence){
      const event={id:'evt_replay_'+p.id,type:'checkout.session.completed',livemode:false,data:{object:p.session}};
      expect((await post(event)).status).toBe(200);expect((await post(event)).status).toBe(200);
    }
    expect(await counts()).toEqual(before);
    expect((await snapshot('aet.aet_emails')).filter(e=>e.state!=='sent').map(e=>({application:e.application_id,kind:e.kind,state:e.state,error:e.error,key:e.dedupe_key}))).toEqual([]);
    const deliver=vi.fn();for(const a of originals)await flushEmails(deliver,a.id);expect(deliver).not.toHaveBeenCalled();
    const p=paymentEvidence[0],charge={...p.intent.latest_charge,amount_refunded:p.session.amount_total};
    expect((await post({id:'evt_refund_'+p.id,type:'charge.refunded',livemode:false,data:{object:charge}})).status).toBe(200);
    p.intent={...p.intent,latest_charge:charge};
    expect((await post({id:'evt_stale_'+p.id,type:'checkout.session.completed',livemode:false,data:{object:p.session}})).status).toBe(200);
    expect(await application(p.applicationId)).toMatchObject({payment_status:'refunded',result:null});expect(await counts()).toEqual(before);
  });
  it('retains old retry hashing and the result version floor when staff edits after migration',async()=>{
    const a=originals[1],v=evidence.get(a.id).originalSubmission;
    if(v){
      expect((await submit(v)).app.id).toBe(a.id);
      await expect(submit({...v,locale:'en'})).rejects.toMatchObject({code:'duplicate_conflict'});
      await expect(submit({...v,firstName:'Different'})).rejects.toMatchObject({code:'duplicate_conflict'});
    }
    const before=(await sql()`select result from aet.aet_service_detail where application_id=${a.id}`)[0].result;
    await staffAction(a.id,{action:'result',result:{result:'Corrected degree',reasoning:'Reviewed correction after migration.'}},'staff');
    const after=(await sql()`select result from aet.aet_service_detail where application_id=${a.id}`)[0].result;
    expect(after.version).toBe(before.version+1);
    expect(await sql()`select id from aet.aet_emails where dedupe_key=${'result:'+a.id+':'+after.version}`).toHaveLength(1);
    const failed=originals.find(a=>a.uploads_pending);
    if(failed){
      const recovery=await unfinishedUploads(failed.id);expect(recovery.uploads).toHaveLength(1);
      await abandonUpload(failed.id,recovery.uploads[0],'customer');expect((await unfinishedUploads(failed.id)).uploads).toHaveLength(0);
    }
  });
  if(mixed){
  it('keeps audited test exemptions separate from payments and rejects Checkout',async()=>{
    const id=[...noChargeAudits.keys()][0];
    expect(report.exemptedTestIds).toEqual([id]);
    expect(report.preservedCoreIds).toHaveLength(2);
    expect(await sql()`select id from aet.aet_payments where application_id=${id}`).toHaveLength(0);
    expect((await application(id)).payment_status).toBe('waived');
    expect((await application(id)).result).not.toBeNull();
    await expect(checkout(id)).rejects.toMatchObject({code:'payment_not_required'});
    const [service]=await sql()`select details from aet.aet_service_detail where application_id=${id}`;
    await sql()`update aet.aet_service_detail set details=details-'payment_exemption' where application_id=${id}`;
    expect(await application(id)).toMatchObject({payment_status:'unpaid',result:null});
    await sql()`update aet.aet_service_detail set details=${sql().json(service.details)} where application_id=${id}`;
    expect((await application(id)).result).not.toBeNull();
  });
  it('preserves v1 retry rules and resumes a queued core job after the old tables are gone',async()=>{
    for(const v of coreInputs){
      const [saved]=await sql()`select id from aet.aet_core_applications where request_id=${v.requestId}`;
      expect((await submit({...v,locale:'en'})).app.id).toBe(saved.id);
      await expect(submit({...v,firstName:'Changed'})).rejects.toMatchObject({code:'duplicate_conflict'});
    }
    const [queued]=await sql()`select application_id id from aet.aet_ai_runs where current and state='queued'`;
    const analyze=vi.fn().mockResolvedValue(generated);
    await processAI(queued.id,{analyze,configured:()=>({model:'synthetic-model',apiKey:'unused'})});
    expect(analyze).toHaveBeenCalledTimes(1);
    expect(analyze.mock.calls[0][0].school).toBe('Authoritative Core University');
    expect(await application(queued.id)).toMatchObject({ai_status:'completed',payment_status:'unpaid',result:null});
  });

  }
});
