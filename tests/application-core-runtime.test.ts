import { afterAll,beforeAll,beforeEach,describe,expect,it,vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync,readFileSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash,randomUUID } from 'node:crypto';
import postgres from 'postgres';
import { PDFDocument } from 'pdf-lib';
import type Stripe from 'stripe';
const m=vi.hoisted(()=>({sql:undefined as ReturnType<typeof postgres>|undefined,
  upload:vi.fn(),metadata:vi.fn(),download:vi.fn(),create:vi.fn(),retrieve:vi.fn(),intent:vi.fn()}));
vi.mock('server-only',()=>({}));
vi.mock('../lib/preeval/db',()=>({db:()=>m.sql!,table:(name:string)=>m.sql!(name),
  audit:async(id:string,actor:string,action:string)=>{await m.sql!`insert into preeval.audit(application_id,actor,action) values (${id},${actor},${action})`;}}));
vi.mock('../lib/preeval/config',()=>({configuration:()=>({origin:'http://localhost:3022',recipient:'synthetic@example.invalid',cloudPreview:true}),
  required:(key:string)=>key==='STRIPE_TEST_SECRET_KEY'?'sk_test_synthetic':'synthetic@example.invalid',requireExternalServices:()=>{}}));
vi.mock('stripe',()=>({default:class { checkout={sessions:{create:m.create,retrieve:m.retrieve}};paymentIntents={retrieve:m.intent}; }}));
vi.mock('../lib/dropbox/server',()=>({requireEnabled:()=>{},clientForOffice:async()=>({filesUpload:m.upload,filesGetMetadata:m.metadata,filesDownload:m.download}),
  dropboxHash:(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex')}));
import { activateCoreRehearsal,coreRuntimeEnabled,updateCoreEducation,coreAdminApplications } from '../lib/application-core/runtime';
import { createCoreShadowReader } from '../lib/application-core/reader';
import { downloadCoreFile,coreUploadPath } from '../lib/application-core/documents';
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

describe.skipIf(!pgBin)('phase 3 actual core runtime (owned PostgreSQL; no backfill)',()=>{
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
    directory=mkdtempSync(join(tmpdir(),'aet-core-runtime-'));
    execFileSync(join(pgBin!,'initdb'),['-D',join(directory,'data'),'-U','core_rehearsal','-A','trust','--locale=C','--encoding=UTF8'],{timeout:30000,stdio:'pipe'});
    execFileSync(join(pgBin!,'pg_ctl'),['-D',join(directory,'data'),'-l',join(directory,'pg.log'),'-o',`-F -k ${directory} -h '' -p 55443`,'-w','start'],{timeout:30000,stdio:'pipe'});started=true;
    const options={host:directory,port:55443,username:'core_rehearsal',onnotice:()=>{},connection:{statement_timeout:5000}};
    const admin=postgres({...options,database:'postgres',max:1});
    try {await expect(activateCoreRehearsal(admin,'acct_synthetic')).rejects.toThrow('disposable');await admin.unsafe('create database aet_core_rehearsal');}finally{await admin.end();}
    m.sql=postgres({...options,database:'aet_core_rehearsal',max:5});
    await sql().unsafe('create role anon; create role authenticated;');
    for(const name of ['20261002000100_pre_evaluation.sql','20261002000200_formal_evaluation.sql','20261002000300_evaluation_workflow.sql',
      '20261020165103_email_delivery_records.sql','20261020173355_formal_email_delivery_records.sql','20261020230256_application_document_locations.sql',
      '20261020232924_preeval_gpt_analysis.sql'])await sql().unsafe(read(`supabase/migrations/${name}`));
    await sql().unsafe(read('scripts/legacy/schema-fixture.sql'));await sql().unsafe(read('scripts/legacy/workflow-bridge.sql'));
    await sql().unsafe(read('supabase/migrations/20261106220126_shared_application_core.sql'));
    expect(coreRuntimeEnabled()).toBe(false);await activateCoreRehearsal(sql(),'acct_synthetic');expect(coreRuntimeEnabled()).toBe(true);
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
    analyze.mockClear();
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
  it('writes new applications directly to core, rejects conflicting replays and reads core for AI, Status, CRM and English mail',async()=>{
    const original=input();const submissions=await Promise.all([submit(original),submit(original)]);const id=submissions[0].app.id;
    expect(submissions[1].app.id).toBe(id);expect((await submit({...original,locale:'en'})).app.id).toBe(id);
    await expect(submit({...original,firstName:'Changed'})).rejects.toMatchObject({code:'duplicate_conflict'});
    expect(await sql()`select id from public.aet_core_applications where id=${id}`).toHaveLength(0);
    expect(await sql()`select id from public.aet_core_educations where application_id=${id}`).toHaveLength(0);
    expect(await sql()`select application_id from evaluation.document_locations where application_id=${id}`).toHaveLength(0);
    const [core]=await sql()`select * from aet.aet_core_applications where id=${id}`;
    expect(core.submitted_snapshot).not.toHaveProperty('locale');expect(core.request_hash_version).toBe(1);
    await expect(rehearsePreevaluation(sql(),id,{providerAccount:'acct_synthetic'})).rejects.toThrow('authoritative');
    // Deliberately corrupt retained business copies: consumers must use core.
    await sql()`update preeval.applications set first_name='STALE',email='stale@example.invalid' where id=${id}`;
    expect(await sql()`select id from preeval.educations where application_id=${id}`).toHaveLength(0);
    // An independently injected old diagnostic record must also be ignored.
    await sql()`insert into preeval.educations(id,application_id,school_name,country_of_study,degree_obtained,start_date,end_date)
      values (${randomUUID()},${id},'STALE','US','STALE','1900-01','1904-01')`;
    await addFile(id,file(),'customer');await completeUploads(id);await ai(id);
    expect(analyze.mock.calls[0][0]).toMatchObject({school:'Core University',start:'2018-09'});
    expect((await application(id)).result).toBeNull();expect((await service(id)).result.status).toBe('draft');
    await Promise.all([checkout(id),checkout(id)]);expect(m.create).toHaveBeenCalledTimes(1);charge(id);
    await applyCheckout(session(id),`evt_${id}`,'checkout.session.completed');await applyCheckout(session(id),`evt_${id}`,'checkout.session.completed');
    const status=await application(id);expect(status).toMatchObject({locale:'zh',first_name:'Core',email:original.email,status:'completed',payment_status:'paid',result});
    const workspace=await workspaceSnapshot({q:id},{email:'staff@example.invalid',offices:[],include_unassigned:true});
    expect(workspace.rows).toHaveLength(1);expect(workspace.rows[0]).toMatchObject({name:'Core Applicant',payment_status:'paid'});
    expect(workspace.rows[0].educations[0]).toMatchObject({school:'Core University',start:'2018-09'});
    expect((await coreAdminApplications(id,'all',1,{offices:[],include_unassigned:true}))[0]).toMatchObject({first_name:'Core',school_name:'Core University'});
    const [payment]=await sql()`select * from aet.aet_payments where application_id=${id}`;
    expect(payment).toMatchObject({amount_cents:TOTAL_CENTS,payment_status:'paid',provider_account:'acct_synthetic'});expect(payment.paid_at).not.toBeNull();
    const deliver=vi.fn().mockResolvedValue('email_synthetic');await flushEmails(deliver,id);await flushEmails(deliver,id);
    expect(deliver).toHaveBeenCalledTimes(2);expect(deliver.mock.calls.map(c=>c[0].html).join(' ')).toContain('Core University');
    expect(deliver.mock.calls.map(c=>c[0].html).join(' ')).not.toContain('STALE');
    expect(await sql()`select id from preeval.ai_runs where application_id=${id}`).toHaveLength(1);
    expect(await sql()`select id from preeval.payment_events where id=${`evt_${id}`}`).toHaveLength(1);
    expect(await sql()`select id from public.aet_core_payments where application_id=${id}`).toHaveLength(0);
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
    const first=await startDocumentUpload(app.id,'shared.pdf');await sql()`update preeval.document_uploads set updated_at=now()-interval '20 minutes' where application_id=${app.id}`;
    const second=await startDocumentUpload(app.id,'shared.pdf');const store=vi.fn();
    expect(await finishDocumentUpload(app.id,first,true,store)).toBe(false);expect(store).not.toHaveBeenCalled();
    expect(await finishDocumentUpload(app.id,second,false)).toBe(true);expect((await service(app.id)).result).toBeNull();
  });
  it('keeps saved paid analysis when publication fails and recovers without another AI run',async()=>{
    const app=await uploaded();await paid(app.id);await ai(app.id,async()=>{throw new Error('Publication interrupted');});
    expect((await service(app.id)).result).toMatchObject({status:'draft',content:result});
    expect((await application(app.id)).result).toEqual(result);expect(analyze).toHaveBeenCalledTimes(1);
    expect(await sql()`select id from preeval.emails where application_id=${app.id} and kind='result'`).toHaveLength(1);
    await application(app.id);expect(await sql()`select id from preeval.emails where application_id=${app.id} and kind='result'`).toHaveLength(1);
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
    expect(await sql()`select id from preeval.educations where application_id=${app.id}`).toHaveLength(0);
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
    expect(await sql()`select id from preeval.applications where request_id=${original.requestId}`).toHaveLength(0);
  });
  it('retries English email with the same delivery ID and mirrors unpaid cancellation',async()=>{
    const {app}=await submit(input());const transport=vi.fn().mockRejectedValueOnce(new Error('Mail offline')).mockResolvedValue('email_recovered');
    await flushEmails(transport,app.id);
    const [queued]=await sql()`select * from preeval.emails where application_id=${app.id}`;expect(queued.state).toBe('failed');
    await sql()`update preeval.emails set available_at=now() where id=${queued.id}`;
    await flushEmails(transport,app.id);await flushEmails(transport,app.id);
    expect(transport).toHaveBeenCalledTimes(2);expect(transport.mock.calls[0][0].id).toBe(transport.mock.calls[1][0].id);
    expect(transport.mock.calls[0][0].html).toBe(transport.mock.calls[1][0].html);
    await staffAction(app.id,{action:'cancel'},'customer');
    expect((await service(app.id)).status).toBe('cancelled');expect((await application(app.id)).status).toBe('cancelled');
  });
  it('rolls back operational changes if canonical service synchronization fails',async()=>{
    const app=await uploaded();const before=await application(app.id);
    await sql().unsafe(`create function aet.reject_runtime_write() returns trigger language plpgsql as $$ begin raise exception 'synthetic failure'; end $$;
      create trigger reject_runtime_write before update on aet.aet_service_detail for each row execute function aet.reject_runtime_write();`);
    try {await expect(staffAction(app.id,{action:'notes',notes:'not committed'},'staff')).rejects.toThrow('synthetic failure');}
    finally {await sql().unsafe('drop trigger reject_runtime_write on aet.aet_service_detail; drop function aet.reject_runtime_write();');}
    expect((await sql()`select notes from preeval.applications where id=${app.id}`)[0].notes).not.toBe('not committed');
    expect((await application(app.id)).status).toBe(before.status);
  });
});
