import { afterAll,beforeAll,beforeEach,describe,expect,it,vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync,readFileSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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
  audit:async(id:string,actor:string,action:string)=>{await m.sql!`insert into aet.aet_audit(application_id,actor,action) values (${id},${actor},${action})`;}}));
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
import { activateCoreRehearsal,coreRuntimeEnabled,updateCoreEducation,coreAdminApplications } from '../lib/application-core/runtime';
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

describe.skipIf(!pgBin)('pre-evaluation after physical table retirement (owned PostgreSQL)',()=>{
  let directory:string,started=false,pdf:Buffer;
  const objects=new Map<string,{metadata:any;bytes:Buffer}>();
  const sql=()=>m.sql!;
  const analyze=vi.fn().mockResolvedValue(generated);
  const ai=(id:string,publish?:()=>Promise<void>)=>processAI(id,{analyze,configured:()=>({model:'synthetic-model',apiKey:'unused'}),...(publish?{publish}:{})});
  const file=(name='degree.pdf')=>new File([new Uint8Array(pdf)],name,{type:'application/pdf'});
  const service=async(id:string)=>(await sql()`select * from aet.aet_service_detail where application_id=${id}`)[0];
  const session=(id:string)=>({id:`cs_${id}`,livemode:false,mode:'payment',client_reference_id:id,metadata:{pilot:'aet-2026-local',applicationId:id},
    currency:'usd',amount_total:TOTAL_CENTS,payment_status:'paid',status:'complete',payment_intent:`pi_${id}`} as unknown as Stripe.Checkout.Session);
  function charge(id:string,refunded=0){
    const c={id:`ch_${id}`,livemode:false,currency:'usd',amount:TOTAL_CENTS,amount_refunded:refunded,payment_intent:`pi_${id}`};
    m.intent.mockResolvedValue({id:`pi_${id}`,livemode:false,status:'succeeded',currency:'usd',amount:TOTAL_CENTS,latest_charge:c});return c;
  }
  async function paid(id:string){await checkout(id);charge(id);await applyCheckout(session(id),`evt_${id}`,'checkout.session.completed');}
  async function uploaded(){const original=input();const {app}=await submit(original);await addFile(app.id,file(),'customer');await completeUploads(app.id);return app;}
  beforeAll(async()=>{
    directory=mkdtempSync(join(tmpdir(),'aet-convergence-'));
    execFileSync(join(pgBin!,'initdb'),['-D',join(directory,'data'),'-U','core_rehearsal','-A','trust','--locale=C','--encoding=UTF8'],{timeout:30000,stdio:'pipe'});
    execFileSync(join(pgBin!,'pg_ctl'),['-D',join(directory,'data'),'-l',join(directory,'pg.log'),'-o',`-F -k ${directory} -h '' -p 55446`,'-w','start'],{timeout:30000,stdio:'pipe'});started=true;
    const options={host:directory,port:55446,username:'core_rehearsal',onnotice:()=>{},connection:{statement_timeout:5000}};
    const admin=postgres({...options,database:'postgres',max:1});
    try {await expect(activateCoreRehearsal(admin,'acct_synthetic')).rejects.toThrow('disposable');await expect(activateConvergenceRehearsal(admin,'acct_synthetic')).rejects.toThrow('disposable');await admin.unsafe('create database aet_core_rehearsal');}finally{await admin.end();}
    m.sql=postgres({...options,database:'aet_core_rehearsal',max:5});
    await sql().unsafe('create role anon; create role authenticated;');
    for(const name of ['20261002000100_pre_evaluation.sql','20261002000200_formal_evaluation.sql','20261002000300_evaluation_workflow.sql',
      '20261020165103_email_delivery_records.sql','20261020173355_formal_email_delivery_records.sql','20261020230256_application_document_locations.sql',
      '20261020232924_preeval_gpt_analysis.sql'])await sql().unsafe(read(`supabase/migrations/${name}`));
    await sql().unsafe(read('scripts/legacy/schema-fixture.sql'));await sql().unsafe(read('scripts/legacy/workflow-bridge.sql'));
    await sql().unsafe(read('supabase/migrations/20261106220126_shared_application_core.sql'));
    expect(coreRuntimeEnabled()).toBe(false);
    const retirement=read('scripts/database/converge-preeval-rehearsal.sql');
    // Reject populated data before any DDL; only an empty synthetic source is in scope.
    await sql()`insert into preeval.rate_limits(key,count,expires_at) values ('guard',1,now())`;
    await expect(sql().begin(async tx=>{await tx.unsafe(retirement);})).rejects.toThrow('Populated cohort');
    await sql()`delete from preeval.rate_limits where key='guard'`;
    await sql().begin(async tx=>{await tx.unsafe(retirement);});
    await activateConvergenceRehearsal(sql(),'acct_synthetic');expect(coreRuntimeEnabled()).toBe(true);
    vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('External network forbidden')));
    vi.stubEnv('PREEVAL_EMAIL_ENABLED','true');vi.spyOn(console,'error').mockImplementation(()=>{});
    const doc=await PDFDocument.create();doc.addPage();pdf=Buffer.from(await doc.save());
  },60000);
  afterAll(async()=>{
    vi.unstubAllGlobals();vi.unstubAllEnvs();vi.restoreAllMocks();await m.sql?.end({timeout:1});
    if(started)execFileSync(join(pgBin!,'pg_ctl'),['-D',join(directory,'data'),'-m','immediate','-w','stop'],{timeout:10000,stdio:'pipe'});
    if(directory)rmSync(directory,{recursive:true,force:true});
  });
  beforeEach(()=>{
    analyze.mockReset().mockResolvedValue(generated);m.cookie='';
    m.upload.mockReset().mockImplementation(async({path,contents}:{path:string;contents:Buffer})=>{
      const id=`id:${randomUUID()}`;const metadata={'.tag':'file',id,rev:'rev1',name:path.split('/').pop(),path_display:path,size:contents.length,
        content_hash:createHash('sha256').update(contents).digest('hex')};objects.set(id,{metadata,bytes:contents});return{result:metadata};
    });
    m.metadata.mockReset().mockImplementation(async({path}:{path:string})=>{const object=objects.get(path);if(!object)throw new Error('File missing');return{result:object.metadata};});
    m.download.mockReset().mockImplementation(async({path}:{path:string})=>{
      const object=objects.get(path)||[...objects.values()].find(o=>`rev:${o.metadata.rev}`===path);if(!object)throw new Error('File missing');
      return{result:{...object.metadata,fileBinary:object.bytes}};
    });
    m.create.mockReset().mockImplementation(async({client_reference_id:id}:{client_reference_id:string})=>({id:`cs_${id}`,status:'open',url:'https://checkout.example.invalid/test'}));
    m.retrieve.mockReset().mockResolvedValue({status:'open',url:'https://checkout.example.invalid/test'});
  });
  it('has 13 canonical/runtime tables and no retired tables or replacement views',async()=>{
    const tables=await sql()`select tablename from pg_tables where schemaname='aet'`;
    expect(tables.map(t=>t.tablename).sort()).toEqual(['aet_core_applications','aet_education','aet_service_detail','aet_documents','aet_payments',
      'aet_uploads','aet_ai_runs','aet_emails','aet_payment_events','aet_access_tokens','aet_sessions','aet_audit','aet_rate_limits'].sort());
    expect(await sql()`select relname from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where (n.nspname='preeval' and c.relkind in ('r','v','m','p')) or
      (n.nspname='public' and c.relname in ('aet_core_applications','aet_core_educations','aet_core_payments'))`).toHaveLength(0);
    expect(await sql()`select conname from pg_constraint where contype='f' and not convalidated`).toHaveLength(0);
    for(const role of ['anon','authenticated'])expect((await sql()`select has_schema_privilege(${role},'aet','usage') allowed`)[0].allowed).toBe(false);
  });
  it('preserves one-use links, sessions and customer isolation after retirement',async()=>{
    const {app}=await submit(input());
    const link=await makeLink(app.id,'customer',app.email,'zh');
    const token=link.split('#token=')[1];
    expect((await consumeLink(token)).row.application_id).toBe(app.id);
    await expect(consumeLink(token)).rejects.toMatchObject({code:'invalid_link'});
    const reader=await createCoreShadowReader(sql());
    await expect(reader.status(app.id,{role:'customer',applicationId:randomUUID()})).rejects.toMatchObject({code:'access_denied'});
    expect(await sql()`select hash from aet.aet_sessions where application_id=${app.id}`).toHaveLength(2);
  });
  it('indexes customer chunk uploads by File ID atomically and accepts an idempotent finish',async()=>{
    const {app}=await submit(input());
    const hash=createHash('sha256').update(pdf).digest('hex');
    m.start.mockResolvedValue({result:{session_id:'synthetic-session'}});
    m.append.mockResolvedValue({});
    m.finish.mockImplementation(async({commit}:{commit:{path:string}})=>m.upload({path:commit.path,contents:pdf}));
    const start=await uploadDocument(app.id,{action:'start',fileName:'chunked.pdf',fileSize:pdf.length,mime:'application/pdf',contentHash:hash},'customer');
    const append=await uploadDocument(app.id,{action:'append',uploadKey:start.uploadKey,chunkIndex:0,chunkData:pdf.toString('base64')},'customer');
    expect(await uploadDocument(app.id,{action:'finish',uploadKey:append.uploadKey},'customer')).toEqual({complete:true});
    expect(await uploadDocument(app.id,{action:'finish',uploadKey:append.uploadKey},'customer')).toEqual({complete:true});
    expect(m.finish).toHaveBeenCalledTimes(1);
    const docs=await sql()`select * from aet.aet_documents where application_id=${app.id}`;
    expect(docs).toHaveLength(1);expect(docs[0].storage_file_id).toMatch(/^id:/);
    expect(await downloadCoreFile(app.id,docs[0].id)).toEqual(pdf);
    await completeUploads(app.id);await ai(app.id);await paid(app.id);
    expect((await application(app.id)).result).toEqual(result);
  });
  it('writes new applications directly to core, rejects conflicting replays and reads core for AI, Status, CRM and English mail',async()=>{
    const original=input();const submissions=await Promise.all([submit(original),submit(original)]);const id=submissions[0].app.id;
    expect(submissions[1].app.id).toBe(id);expect((await submit({...original,locale:'en'})).app.id).toBe(id);
    await expect(submit({...original,firstName:'Changed'})).rejects.toMatchObject({code:'duplicate_conflict'});
    const [core]=await sql()`select * from aet.aet_core_applications where id=${id}`;
    expect(core.submitted_snapshot).not.toHaveProperty('locale');
    await addFile(id,file(),'customer');await completeUploads(id);await ai(id);
    expect(analyze.mock.calls[0][0]).toMatchObject({school:'Core University',start:'2018-09'});
    expect((await application(id)).result).toBeNull();expect((await service(id)).result.status).toBe('draft');
    await Promise.all([checkout(id),checkout(id)]);expect(m.create).toHaveBeenCalledTimes(1);charge(id);
    await applyCheckout(session(id),`evt_${id}`,'checkout.session.completed');await applyCheckout(session(id),`evt_${id}`,'checkout.session.completed');
    const status=await application(id);expect(status).toMatchObject({locale:'en',first_name:'Core',email:original.email,status:'completed',payment_status:'paid',result});
    const workspace=await workspaceSnapshot({q:id},{email:'staff@example.invalid',offices:[],include_unassigned:true});
    expect(workspace.rows).toHaveLength(1);expect(workspace.rows[0]).toMatchObject({name:'Core Applicant',payment_status:'paid'});
    expect(workspace.rows[0].educations[0]).toMatchObject({school:'Core University',start:'2018-09'});
    expect((await coreAdminApplications(id,'all',1,{offices:[],include_unassigned:true}))[0]).toMatchObject({first_name:'Core',school_name:'Core University'});
    const [payment]=await sql()`select * from aet.aet_payments where application_id=${id}`;
    expect(payment).toMatchObject({amount_cents:TOTAL_CENTS,payment_status:'paid',provider_account:'acct_synthetic'});expect(payment.paid_at).not.toBeNull();
    const deliver=vi.fn().mockResolvedValue('email_synthetic');await flushEmails(deliver,id);await flushEmails(deliver,id);
    expect(deliver).toHaveBeenCalledTimes(2);expect(deliver.mock.calls.map(c=>c[0].html).join(' ')).toContain('Core University');
    expect(deliver.mock.calls.map(c=>c[0].html).join(' ')).not.toContain('STALE');
    expect(await sql()`select id from aet.aet_ai_runs where application_id=${id} and state='completed'`).toHaveLength(1);
    expect(await sql()`select id from aet.aet_payment_events where id=${`acct_synthetic:test:evt_${id}`}`).toHaveLength(1);
    expect((await service(id)).result).toMatchObject({status:'released',content:result});
    const released=(await service(id)).result.released_at;await application(id);expect((await service(id)).result.released_at).toBe(released);
  });
  it('resolves renamed/moved files by File ID and never stores a folder row',async()=>{
    const app=await uploaded();const [d]=await sql()`select * from aet.aet_documents where application_id=${app.id}`;
    objects.get(d.storage_file_id)!.metadata.path_display='/staff-moved/renamed.pdf';objects.get(d.storage_file_id)!.metadata.name='renamed.pdf';
    expect(await downloadCoreFile(app.id,d.id)).toEqual(pdf);await ai(app.id);expect(analyze).toHaveBeenCalledTimes(1);
    expect(m.metadata.mock.calls.every(([arg])=>arg.path.startsWith('id:'))).toBe(true);
    await expect(coreUploadPath(app.id,randomUUID(),'next.pdf')).rejects.toMatchObject({code:'directory_confirmation_required'});
    await expect(downloadCoreFile(randomUUID(),d.id)).rejects.toMatchObject({code:'not_found'});
    expect(await sql()`select application_id from evaluation.document_locations where application_id=${app.id}`).toHaveLength(0);
  });
  it('recovers failed upload replacement and fences stale shared completion',async()=>{
    const {app}=await submit(input());m.upload.mockRejectedValueOnce(new Error('Storage offline'));
    await expect(addFile(app.id,file('failed.pdf'),'customer')).rejects.toMatchObject({code:'upload_failed'});
    expect(await sql()`select id from aet.aet_documents where application_id=${app.id}`).toHaveLength(0);
    const abandoned=(await unfinishedUploads(app.id)).uploads[0];await abandonUpload(app.id,abandoned,'customer');
    await addFile(app.id,file('replacement.pdf'),'customer');await completeUploads(app.id);await ai(app.id);expect(analyze).toHaveBeenCalledTimes(1);
    const first=await startDocumentUpload(app.id,'shared.pdf');await sql()`update aet.aet_uploads set updated_at=now()-interval '20 minutes' where application_id=${app.id}`;
    const second=await startDocumentUpload(app.id,'shared.pdf');const store=vi.fn();
    expect(await finishDocumentUpload(app.id,first,true,store)).toBe(false);expect(store).not.toHaveBeenCalled();
    expect(await finishDocumentUpload(app.id,second,false)).toBe(true);expect((await service(app.id)).result).toBeNull();
  });
  it('keeps saved paid analysis when publication fails and recovers without another AI run',async()=>{
    const app=await uploaded();await paid(app.id);await ai(app.id,async()=>{throw new Error('Publication interrupted');});
    expect((await service(app.id)).result).toMatchObject({status:'draft',content:result});
    expect((await application(app.id)).result).toEqual(result);expect(analyze).toHaveBeenCalledTimes(1);
    expect(await sql()`select id from aet.aet_emails where application_id=${app.id} and kind='result'`).toHaveLength(1);
    await application(app.id);expect(await sql()`select id from aet.aet_emails where application_id=${app.id} and kind='result'`).toHaveLength(1);
  });
  it('withholds released output after a refund and ignores stale payment callbacks',async()=>{
    const app=await uploaded();await ai(app.id);await paid(app.id);
    const c=charge(app.id,500);await handleStripeEvent({id:`refund_${app.id}`,livemode:false,type:'charge.refunded',data:{object:c}} as Stripe.Event);
    await applyCheckout(session(app.id),`late_${app.id}`,'checkout.session.completed');
    expect(await application(app.id)).toMatchObject({payment_status:'partially_refunded',result:null});
    expect((await service(app.id)).result.status).toBe('draft');
    expect((await sql()`select refunded_cents,payment_status from aet.aet_payments where application_id=${app.id}`)[0]).toEqual({refunded_cents:500,payment_status:'partially_refunded'});
  });
  it('preserves private notes, invalidates output on requests and enforces office/customer scope',async()=>{
    const app=await uploaded();await ai(app.id);await paid(app.id);await staffAction(app.id,{action:'notes',notes:'PRIVATE'},'staff');
    expect((await service(app.id)).staff_notes).toBe('PRIVATE');expect(JSON.stringify(await application(app.id))).not.toContain('PRIVATE');
    await staffAction(app.id,{action:'information',message:'Please replace the transcript'},'staff');
    expect((await service(app.id)).result).toBeNull();expect((await application(app.id)).status).toBe('needs_information');
    const reader=await createCoreShadowReader(sql());
    await expect(reader.status(app.id,{role:'customer',applicationId:randomUUID()})).rejects.toMatchObject({code:'access_denied'});
    expect((await workspaceSnapshot({q:app.id},{email:'staff',offices:['Boston'],include_unassigned:false})).rows).toHaveLength(0);
  });
  it('records shared upload File IDs and handles refund-before-completion without restoring access',async()=>{
    const {app}=await submit(input());const attempt=await startDocumentUpload(app.id,'shared.pdf');
    const uploaded=(await m.upload({path:`/synthetic/${app.id}/shared.pdf`,contents:pdf})).result;
    expect(await finishDocumentUpload(app.id,attempt,true,{id:uploaded.id,rev:uploaded.rev,storageLocation:'AET_App',
      name:'shared.pdf',path:uploaded.path_display,size:pdf.length,contentHash:uploaded.content_hash})).toBe(true);
    const [doc]=await sql()`select * from aet.aet_documents where application_id=${app.id}`;
    expect(doc).toMatchObject({storage_file_id:uploaded.id,storage_content_hash:uploaded.content_hash});
    await completeUploads(app.id);await ai(app.id);await checkout(app.id);charge(app.id,TOTAL_CENTS);
    await applyCheckout(session(app.id),`early_refund_${app.id}`,'checkout.session.completed');
    expect(await application(app.id)).toMatchObject({payment_status:'refunded',result:null});
    expect((await sql()`select payment_status,paid_at from aet.aet_payments where application_id=${app.id}`)[0]).toEqual({payment_status:'refunded',paid_at:null});
  });
  it('writes education edits to core with stale-write protection and invalidates an earlier release',async()=>{
    const app=await uploaded();await ai(app.id);await paid(app.id);
    const [core]=await sql()`select * from aet.aet_core_applications where id=${app.id}`;
    const [education]=await sql()`select * from aet.aet_education where application_id=${app.id}`;
    const patch={schoolName:'Updated University',countryOfStudy:'CA',degreeObtained:'Master of Science',startDate:'2020-01',endDate:'2022-12'};
    const staff={email:'staff@example.invalid',offices:[],includeUnassigned:true};
    await expect(updateCoreEducation(app.id,education.id,patch,core.version,{...staff,includeUnassigned:false})).rejects.toMatchObject({code:'access_denied'});
    await updateCoreEducation(app.id,education.id,patch,core.version,staff);
    await expect(updateCoreEducation(app.id,education.id,patch,core.version,staff)).rejects.toMatchObject({code:'stale_application'});
    expect((await application(app.id)).result).toBeNull();
    expect((await application(app.id)).education.school_name).toBe('Updated University');
    await ai(app.id);expect(analyze.mock.calls.at(-1)![0]).toMatchObject({school:'Updated University',start:'2020-01'});
    expect((await application(app.id)).result).toEqual(result);
  });
  it('rejects missing provider file identity and prevents partial application creation',async()=>{
    const {app}=await submit(input());m.upload.mockResolvedValueOnce({result:{rev:'no-id'}});
    await expect(addFile(app.id,file(),'customer')).rejects.toMatchObject({code:'upload_failed'});
    expect(await sql()`select id from aet.aet_documents where application_id=${app.id}`).toHaveLength(0);
    await sql().unsafe(`create function aet.reject_new_education() returns trigger language plpgsql as $$ begin raise exception 'synthetic creation failure'; end $$;
      create trigger reject_new_education before insert on aet.aet_education for each row execute function aet.reject_new_education();`);
    const original=input();
    try {await expect(submit(original)).rejects.toThrow('synthetic creation failure');}
    finally {await sql().unsafe('drop trigger reject_new_education on aet.aet_education; drop function aet.reject_new_education();');}
    expect(await sql()`select id from aet.aet_core_applications where request_id=${original.requestId}`).toHaveLength(0);
  });
  it('retries English email with the same delivery ID and preserves unpaid cancellation',async()=>{
    const {app}=await submit(input());const transport=vi.fn().mockRejectedValueOnce(new Error('Mail offline')).mockResolvedValue('email_recovered');
    await flushEmails(transport,app.id);
    const [queued]=await sql()`select * from aet.aet_emails where application_id=${app.id}`;expect(queued.state).toBe('failed');
    await sql()`update aet.aet_emails set available_at=now() where id=${queued.id}`;
    await flushEmails(transport,app.id);await flushEmails(transport,app.id);
    expect(transport).toHaveBeenCalledTimes(2);expect(transport.mock.calls[0][0].id).toBe(transport.mock.calls[1][0].id);
    expect(transport.mock.calls[0][0].html).toBe(transport.mock.calls[1][0].html);
    await staffAction(app.id,{action:'cancel'},'customer');
    expect((await service(app.id)).status).toBe('cancelled');expect((await application(app.id)).status).toBe('cancelled');
  });
  it('rolls back a failed canonical write without a second business copy',async()=>{
    const app=await uploaded();const before=await application(app.id);
    await sql().unsafe(`create function aet.reject_runtime_write() returns trigger language plpgsql as $$ begin raise exception 'synthetic failure'; end $$;
      create trigger reject_runtime_write before update on aet.aet_service_detail for each row execute function aet.reject_runtime_write();`);
    try {await expect(staffAction(app.id,{action:'notes',notes:'not committed'},'staff')).rejects.toThrow('synthetic failure');}
    finally {await sql().unsafe('drop trigger reject_runtime_write on aet.aet_service_detail; drop function aet.reject_runtime_write();');}
    expect((await sql()`select staff_notes as notes from aet.aet_service_detail where application_id=${app.id}`)[0].notes).not.toBe('not committed');
    expect((await application(app.id)).status).toBe(before.status);
  });
  it('recovers a retryable AI failure without publishing a draft or duplicating a job',async()=>{
    const a=await uploaded();analyze.mockRejectedValueOnce(new AIError('provider_unavailable',true));
    await ai(a.id);expect((await application(a.id)).result).toBeNull();
    const [job]=await sql()`select * from aet.aet_ai_runs where application_id=${a.id} and current`;
    expect(job).toMatchObject({state:'queued',attempts:1});
    await sql()`update aet.aet_ai_runs set available_at=now() where id=${job.id}`;
    await ai(a.id);await paid(a.id);
    expect((await application(a.id)).result).toEqual(result);expect(analyze).toHaveBeenCalledTimes(2);
    expect(await sql()`select id from aet.aet_ai_runs where application_id=${a.id} and state='completed'`).toHaveLength(1);
  });
  it('fences an AI response when an upload changes its input during provider work',async()=>{
    const a=await uploaded();
    let release!:()=>void;let entered!:()=>void;
    const providerStarted=new Promise<void>(r=>{entered=r;});
    const providerGate=new Promise<void>(r=>{release=r;});
    analyze.mockImplementationOnce(async()=>{entered();await providerGate;return generated;});
    const run=ai(a.id);await providerStarted;
    try {await startDocumentUpload(a.id,'supplement.pdf');} finally {release();}
    await run;expect((await application(a.id)).result).toBeNull();
    expect((await service(a.id)).result).toBeNull();
    expect((await sql()`select * from aet.aet_ai_runs where application_id=${a.id} and current`)[0]).toMatchObject({state:'idle',uploads_pending:true});
  });
  it('accepts a signed callback through the actual route, rejects unsigned callbacks and preserves timestamps on replay',async()=>{
    const a=await uploaded();await ai(a.id);await checkout(a.id);charge(a.id);
    const event={id:'evt_route_'+a.id,type:'checkout.session.completed',livemode:false,data:{object:session(a.id)}};
    const payload=JSON.stringify(event),sdk=new Stripe('sk_test_synthetic');
    const signature=sdk.webhooks.generateTestHeaderString({payload,secret:'whsec_local_convergence_test'});
    const post=(signed=true)=>postRoute(new Request('http://localhost:3022/api/pre-evaluation/stripe-webhook',
      {method:'POST',headers:signed?{'stripe-signature':signature}:{},body:payload}),{params:Promise.resolve({path:['stripe-webhook']})});
    expect((await post(false)).status).toBe(400);expect((await post()).status).toBe(200);
    const [before]=await sql()`select paid_at::text,created_at::text,updated_at::text from aet.aet_payments where application_id=${a.id}`;
    expect((await post()).status).toBe(200);
    expect((await sql()`select paid_at::text,created_at::text,updated_at::text from aet.aet_payments where application_id=${a.id}`)[0]).toEqual(before);
    expect((await application(a.id)).result).toEqual(result);
    expect(await sql()`select id from aet.aet_emails where application_id=${a.id} and kind='result'`).toHaveLength(1);
    const attempts=await sql()`select id from aet.aet_payment_events`;
    await expect(applyCheckout({...session(a.id),amount_total:1},'evt_bad_'+a.id,'checkout.session.completed')).rejects.toMatchObject({code:'invalid_payment'});
    expect(await sql()`select id from aet.aet_payment_events`).toHaveLength(attempts.length);
  });
  it('serves the actual lookup and Status routes with application-scoped sessions after deletion',async()=>{
    const {app,token}=await submit(input());
    const get=()=>getRoute(new Request('http://localhost:3022/api/pre-evaluation/applications/'+app.id),{params:Promise.resolve({path:['applications',app.id]})});
    expect((await get()).status).toBe(401);m.cookie=token;expect((await get()).status).toBe(200);
    m.cookie=(await submit(input())).token;expect((await get()).status).toBe(401);
    const response=await lookupRoute(new NextRequest('http://localhost:3022/api/pre-evaluation/lookup',{method:'POST',
      headers:{origin:'http://localhost:3022','content-type':'application/json'},body:JSON.stringify({applicationId:app.id,locale:'zh'})}));
    expect(response.status).toBe(200);expect((await response.json()).url).toContain('/zh/');
    expect(response.cookies.get('aet_preeval_session')?.value).toBeTruthy();
  });
  it('handles refund before the completion callback and never reopens paid result access',async()=>{
    const a=await uploaded();await ai(a.id);await checkout(a.id);
    const c=charge(a.id,TOTAL_CENTS);m.list.mockResolvedValue({has_more:false,data:[session(a.id)]});
    await handleStripeEvent({id:'evt_early_refund_'+a.id,livemode:false,type:'charge.refunded',data:{object:c}} as Stripe.Event);
    await applyCheckout(session(a.id),'evt_late_paid_'+a.id,'checkout.session.completed');
    expect(await application(a.id)).toMatchObject({payment_status:'refunded',result:null});
    expect((await sql()`select * from aet.aet_payments where application_id=${a.id}`)[0]).toMatchObject({payment_status:'refunded',refunded_cents:TOTAL_CENTS});
  });

  it('serializes competing AI workers and recovers a real publication transaction failure',async()=>{
    const a=await uploaded();await paid(a.id);
    await sql().unsafe(`create function aet.reject_release() returns trigger language plpgsql as $$ begin
      if new.result->>'status'='released' then raise exception 'synthetic publication failure'; end if; return new; end $$;
      create trigger reject_release before update on aet.aet_service_detail for each row execute function aet.reject_release();`);
    try {
      await Promise.all([ai(a.id),ai(a.id)]);expect(analyze).toHaveBeenCalledTimes(1);
      expect((await service(a.id)).result).toMatchObject({status:'draft',content:result});
      expect((await application(a.id)).result).toBeNull();
    } finally {await sql().unsafe('drop trigger reject_release on aet.aet_service_detail; drop function aet.reject_release();');}
    expect((await application(a.id)).result).toEqual(result);expect(analyze).toHaveBeenCalledTimes(1);
    expect(await sql()`select id from aet.aet_emails where application_id=${a.id} and kind='result'`).toHaveLength(1);
  });

});
