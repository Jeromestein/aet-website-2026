import {beforeAll,afterAll,describe,it,expect,vi} from 'vitest';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,readFileSync,writeFileSync,rmSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import postgres from 'postgres';
import type Stripe from 'stripe';
vi.mock('server-only',()=>({}));
const m=vi.hoisted(()=>({sql:undefined as ReturnType<typeof postgres>|undefined,create:vi.fn(),retrieve:vi.fn(),intent:vi.fn(),list:vi.fn(),upload:vi.fn(),metadata:vi.fn()}));
vi.mock('../lib/preeval/db',async()=>{const {convergedTableName}=await import('../lib/application-core/convergence-mode');const {businessTableName}=await import('../lib/preeval/config');return{db:()=>m.sql!,table:(name:string)=>m.sql!(convergedTableName(m.sql!,name)||businessTableName(name)),audit:async()=>{}};});
vi.mock('next/headers',()=>({cookies:async()=>({get:()=>undefined,getAll:()=>[]})}));
vi.mock('../lib/staff/session',()=>({staffSession:async()=>null,requireStaffApplication:vi.fn()}));
vi.mock('../lib/dropbox/server',()=>({requireEnabled:()=>{},clientForOffice:async()=>({filesUpload:m.upload,filesGetMetadata:m.metadata}),seal:()=>'',folderPath:()=>''}));
vi.mock('stripe',async(importOriginal)=>{const actual=await importOriginal<typeof import('stripe')>();return{default:class extends actual.default{constructor(...args:ConstructorParameters<typeof actual.default>){super(...args);this.checkout.sessions.create=m.create;this.checkout.sessions.retrieve=m.retrieve;this.paymentIntents.retrieve=m.intent;this.checkout.sessions.list=m.list;}}};});
import {activateSixTablePreview} from '../lib/application-core/convergence-mode';
import {formalRows,readFormal,formalApplication,formalLegacy,indexFormalDocument} from '../lib/application-core/formal-store';
import {saveApplication} from '../lib/evaluation-application/server';
import {initialData,quote} from '../lib/evaluation-application/domain';
import {staffAction,application,addFile} from '../lib/evaluation-application/service';
import {checkout,applyCheckout,handleStripeEvent,cancel} from '../lib/evaluation-application/payments';
import {flushFormalEmails} from '../lib/evaluation-application/email';
import {readIntake,saveIntake} from '../lib/application/intake-server';
import {sendIntakeEmail} from '../lib/application/intake-email';
import {formalRecords,projectWorkspaceRecords} from '../lib/crm/workspace-server';
import {contextFor} from '../lib/dropbox/application';
import {convergeFormal} from '../scripts/database/converge-formal';
import {fromLegacyFormal} from '../lib/legacy-application/mapping';
const pg=process.env.APPLICATION_CORE_TEST_PG_BIN,copy=process.env.APPLICATION_FORMAL_SNAPSHOT;
const input=()=>{const d=initialData();Object.assign(d.client,{name:'Synthetic Client',email:'synthetic@example.invalid',phone:'617-555-0100',country:'US',street:'123 Test Street',city:'Boston',region:'MA',postal:'02110',office:'Miami',purpose:'education'});Object.assign(d.evaluee,{title:'mx',first:'Synthetic',last:'Applicant',birth:'2000-01-01'});d.educations=[{school:'Synthetic University',country:'US',degree:'Bachelor',start:'2018-09',end:'2022-06'}];d.services.document.tier='standard';d.terms=true;return {requestId:randomUUID(),locale:'en',data:d};};
const normalize=(value:any):any=>Array.isArray(value)?value.map(normalize):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,normalize(value[k])])):value;
const digest=(v:any)=>createHash('sha256').update(JSON.stringify(normalize(v))).digest('hex');
describe.skipIf(!pg)('formal evaluation using six tables after retirement',()=>{
 let dir:string,admin:ReturnType<typeof postgres>,runtime:ReturnType<typeof postgres>,started=false,snapshot:any,providers:any;
 const sql=()=>m.sql!;
 beforeAll(async()=>{
  dir=mkdtempSync(join(tmpdir(),'aet-formal-six-'));
  execFileSync(join(pg!,'initdb'),['-D',join(dir,'data'),'-U','core_rehearsal','-A','trust','--locale=C','--encoding=UTF8'],{stdio:'pipe'});
  execFileSync(join(pg!,'pg_ctl'),['-D',join(dir,'data'),'-l',join(dir,'pg.log'),'-o',`-F -k ${dir} -h '' -p 55452`,'-w','start'],{stdio:'pipe'});started=true;
  const args=['-h',dir,'-p','55452','-U','core_rehearsal','-d','postgres'];
  const opts={host:dir,port:55452,database:'postgres',max:5,onnotice:()=>{}};
  admin=postgres({...opts,username:'core_rehearsal'});
  await admin.unsafe('create role anon; create role authenticated; create role aet_preview_runtime login;');
  if(copy){snapshot=JSON.parse(readFileSync(join(copy,'snapshot.json'),'utf8'));providers=JSON.parse(readFileSync(join(copy,'providers.json'),'utf8'));execFileSync(join(pg!,'pg_restore'),[...args,'--exit-on-error','--single-transaction','--no-owner','--no-privileges',join(copy,'preview-before.dump')],{stdio:'pipe'});}
  else await admin.unsafe(readFileSync(new URL('../supabase/migrations/20261111010750_preview_six_table_core.sql',import.meta.url),'utf8'));
  await admin.unsafe(readFileSync(new URL('../supabase/migrations/20261111180424_preview_formal_six_table_support.sql',import.meta.url),'utf8'));
  await admin.unsafe('grant usage on schema aet_preview_shared to aet_preview_runtime;grant select,insert,update,delete on all tables in schema aet_preview_shared to aet_preview_runtime;');
  runtime=postgres({...opts,username:'aet_preview_runtime'});m.sql=runtime;
  for(const[k,v]of Object.entries({APP_ENV:'preview',APP_ORIGIN:'https://aet-test.vercel.app',APPLICATION_DATABASE_MODE:'cloud-preview',APPLICATION_DATABASE_URL:'postgresql://aet_preview_runtime.qrxztgdemfodemlcabcq:test@aws-0-us-west-1.pooler.supabase.com:6543/postgres',APPLICATION_TEST_EMAIL:'synthetic@example.invalid',APPLICATION_CORE_MODE:'six-preview',APPLICATION_CORE_PROVIDER_ACCOUNT:providers?.providerAccount||'acct_synthetic',VERCEL:'1',VERCEL_ENV:'preview',VERCEL_GIT_COMMIT_REF:'dev',VERCEL_BRANCH_URL:'aet-test.vercel.app',STAFF_LEGACY_MIGRATION_ENABLED:'false',STAFF_AUTH_CUTOVER_ENABLED:'false',PREEVAL_STRIPE_TEST_ENABLED:'true',STRIPE_TEST_SECRET_KEY:'sk_test_synthetic',DROPBOX_LEGACY_PILOT_ROOT:'/Team Files/WebsitesDev/AET-PreEvaluation-Test',RESEND_DEFAULT_FROM_NAME:'AET Test',RESEND_DEFAULT_FROM_ADDRESS:'test@example.invalid'}))vi.stubEnv(k,v);
  await activateSixTablePreview(runtime);
 },60000);
 afterAll(async()=>{vi.unstubAllEnvs();await runtime?.end();await admin?.end();if(started)execFileSync(join(pg!,'pg_ctl'),['-D',join(dir,'data'),'-m','immediate','-w','stop'],{stdio:'pipe'});if(dir)rmSync(dir,{recursive:true,force:true});});
 it('migrates the full historical copy without changing pre-evaluation, then physically drops all twelve old tables',async()=>{
  if(copy){
   const before:any={};for(const name of Object.keys(snapshot.tables).filter(n=>n.startsWith('aet_preview_shared.')))before[name]=(await admin`select to_jsonb(t) value from ${admin(name)} t order by to_jsonb(t)::text`).map(r=>r.value);
   const ids=await convergeFormal(admin,providers.files,providers.providerAccount);expect(ids.length).toBe(snapshot.tables['aet_preview_evaluation.applications'].length);
   for(const old of snapshot.tables['aet_preview_evaluation.applications']){
    const current=await readFormal(old.id);const legacy=snapshot.tables['aet_preview_legacy.fce_applications'].find((a:any)=>a.id===old.id);
    const educationIds=legacy.service_type.websiteQuote?.educationIds||[];
    const educations=snapshot.tables['aet_preview_legacy.fce_educations'].filter((e:any)=>e.application_id===old.id).sort((a:any,b:any)=>educationIds.indexOf(a.id)-educationIds.indexOf(b.id)||a.id.localeCompare(b.id));
    const expected=fromLegacyFormal(legacy,educations,old.data);
    expect(current.quote).toEqual(old.quote);expect(current.status).toBe(old.status);expect(current.data.services).toEqual(expected.services);expect(current.data.delivery).toEqual(expected.delivery);expect(current.data.educations.map((e:any)=>e.degree)).toEqual(expected.educations.map((e:any)=>e.degree));
    if(old.data.intakeVersion===2){expect((await readIntake(old.id)).data).toEqual(old.data.intake);expect((await readIntake(old.id)).email.state).toBe('sent');}
   }
   const tables:any={};for(const name of Object.keys(before)){const rows=(await admin`select to_jsonb(t) value from ${admin(name)} t order by to_jsonb(t)::text`).map(r=>r.value);const original=rows.filter(r=>!ids.includes(r.application_id||r.id));expect(digest(original)).toBe(digest(before[name]));tables[name.split('.')[1]]=rows.filter(r=>ids.includes(r.application_id||r.id));}
   writeFileSync(join(copy,'prepared.json'),JSON.stringify({ids,tables,sourceDigest:digest(snapshot.tables),providerAccount:providers.providerAccount}),{mode:0o600});
   const oldNames=Object.keys(snapshot.tables).filter(n=>!n.startsWith('aet_preview_shared.'));
   expect(oldNames).toHaveLength(12);await admin.unsafe('drop table '+oldNames.map(n=>n.split('.').map(p=>'"'+p+'"').join('.')).join(','));
   for(const id of ids)expect((await formalApplication(id,true)).id).toBe(id);
  }
  expect((await admin`select tablename from pg_tables where schemaname like 'aet_preview_%'`).length).toBe(6);
 });
 it('deduplicates both entry points and keeps education, prices and CRM in sync without old tables',async()=>{
  const raw=input(),a=await saveApplication(raw,'a'.repeat(64));expect((await saveApplication(raw,'b'.repeat(64))).id).toBe(a.id);
  await expect(saveApplication({...raw,data:{...raw.data,notes:'changed'}},'a'.repeat(64))).rejects.toMatchObject({code:'idempotency_conflict'});
  const r=await application(a.id,true);expect(r.quote).toEqual(quote(raw.data));expect(r.data.educations).toEqual(raw.data.educations);expect(r.payment_status).toBe('unpaid');expect(r.audit).toEqual([]);
  const legacy=await formalLegacy(a.id);expect(legacy.educations).toHaveLength(1);
  const workspace=await projectWorkspaceRecords(sql(),formalRecords(sql()),{view:'formal',q:a.id},{email:'staff@example.invalid',offices:['Miami'],include_unassigned:false},true);expect(workspace.total).toBe(1);expect(workspace.rows[0].amount).toBe(r.total);
  const other=await projectWorkspaceRecords(sql(),formalRecords(sql()),{q:a.id},{email:'staff@example.invalid',offices:['Boston'],include_unassigned:false},true);expect(other.total).toBe(0);
 });
 it('submits a new v2 intake and delivers one English confirmation without an emails table',async()=>{
  if(!copy)return;
  const data=structuredClone(snapshot.tables['aet_preview_evaluation.applications'][0].data.intake);data.contactName='Synthetic New Intake';
  const raw={requestId:randomUUID(),locale:'zh',data};const created=await saveIntake(raw);expect((await saveIntake(raw)).id).toBe(created.id);
  const receipt=await readIntake(created.id);expect(receipt.data.contactName).toBe(data.contactName);expect(receipt.locale).toBe('en');
  const transport=vi.fn().mockResolvedValue('mail_intake_six');await sendIntakeEmail(created.id,transport);await sendIntakeEmail(created.id,transport);
  expect(transport).toHaveBeenCalledTimes(1);expect((await readIntake(created.id)).email.state).toBe('sent');
 });
 it('retries a failed dedicated upload into the same document slot and records its File ID',async()=>{
  const a=await saveApplication(input(),'a'.repeat(64));const file=new File(['%PDF-1.7\nsynthetic'], 'test.pdf',{type:'application/pdf'});
  m.upload.mockRejectedValueOnce(new Error('synthetic failure'));
  await expect(addFile(a.id,file,'document','customer')).rejects.toMatchObject({code:'upload_failed'});
  m.upload.mockImplementation(async(args:any)=>({result:{'.tag':'file',id:'id:upload_'+a.id,rev:'1',path_display:args.path,name:'test.pdf',size:file.size,content_hash:'synthetic'}}));
  await addFile(a.id,file,'document','customer');expect((await application(a.id,true)).files).toHaveLength(1);expect((await readFormal(a.id)).status).toBe('reviewing');
  const {row:legacy}=await formalLegacy(a.id);const row={id:legacy.id,first_name:legacy.first_name,last_name:legacy.last_name,office:legacy.office,status:legacy.status,submitted_at:new Date(legacy.submitted_at).toISOString()};expect(contextFor(row,'evaluation').canUpload).toBe(true);
  expect(contextFor({...row,status:'needs_information'},'evaluation').canUpload).toBe(true);
  expect(contextFor({...row,status:'completed'},'evaluation').canUpload).toBe(false);
  expect(contextFor({...row,status:'cancelled'},'evaluation').canUpload).toBe(false);
  expect((await sql()`select storage_file_id,upload_version from aet_preview_shared.aet_documents where application_id=${a.id}`)[0]).toMatchObject({storage_file_id:'id:upload_'+a.id,upload_version:2});
 });
 it('uses versioned staff writes and blocks premature report release',async()=>{
  const a=await saveApplication(input(),'a'.repeat(64));let r=await application(a.id,true);
  await staffAction(a.id,{action:'notes',version:r.version,notes:'Internal only'},'staff');
  await expect(staffAction(a.id,{action:'notes',version:r.version,notes:'stale'},'staff')).rejects.toMatchObject({code:'stale_version'});
  expect((await application(a.id,false)).staff_notes).toBeUndefined();r=await application(a.id,true);
  await expect(staffAction(a.id,{action:'status',version:r.version,status:'processing',message:''},'staff')).rejects.toMatchObject({code:'payment_and_documents_required'});
 });
 it('retains a single payment and receipt on repeated/out-of-order callbacks; refunds withhold reports',async()=>{
  const a=await saveApplication(input(),'a'.repeat(64)),r=await application(a.id,true),session:any={id:'cs_'+a.id,livemode:false,client_reference_id:a.id,metadata:{pilot:'aet-formal-2026-local',applicationId:a.id},currency:'usd',amount_total:r.total,status:'complete',payment_status:'paid',payment_intent:'pi_'+a.id};
  m.create.mockResolvedValue({...session,url:'https://checkout.stripe.com/synthetic',status:'open'});
  const charge:any={id:'ch_'+a.id,livemode:false,currency:'usd',amount:r.total,amount_refunded:0,payment_intent:session.payment_intent};
  m.intent.mockResolvedValue({id:session.payment_intent,livemode:false,status:'succeeded',currency:'usd',amount:r.total,latest_charge:charge});
  await checkout(a.id);await Promise.all([applyCheckout(session,'evt_a','checkout.session.completed'),applyCheckout(session,'evt_a','checkout.session.completed')]);
  expect((await application(a.id,true)).payments).toHaveLength(1);expect((await application(a.id,true)).payment_status).toBe('paid');
  const n=(await readFormal(a.id)).notification_state.payment;expect(n.state).toBe('queued');
  await applyCheckout({...session,payment_status:'unpaid',status:'expired'},'evt_late','checkout.session.expired');expect((await readFormal(a.id)).payment_status).toBe('paid');expect((await readFormal(a.id)).notification_state.payment.id).toBe(n.id);
  await expect(applyCheckout({...session,amount_total:1},'evt_wrong','checkout.session.completed')).rejects.toMatchObject({code:'invalid_payment'});
  const transport=vi.fn().mockResolvedValue('mail_formal');await flushFormalEmails(transport);await flushFormalEmails(transport);expect(transport).toHaveBeenCalledTimes(1);
  const docId=randomUUID(),reportId=randomUUID();
  await sql()`insert into aet_preview_shared.aet_documents(id,application_id,storage_location,storage_file_id,storage_rev,original_filename,access_scope,upload_context) values(${docId},${a.id},'AET_App',${'id:doc_'+a.id},'1','degree.pdf','customer_input','{}'),(${reportId},${a.id},'AET_App',${'id:report_'+a.id},'1','report.pdf','staff_only','{"input_version":1}')`;
  let next=await application(a.id,true);await staffAction(a.id,{action:'status',version:next.version,status:'processing',message:''},'staff');next=await application(a.id,true);
  await staffAction(a.id,{action:'release',version:next.version,fileId:reportId},'staff');expect((await application(a.id,false)).files.some(f=>f.id===reportId)).toBe(true);
  charge.amount_refunded=r.total;await handleStripeEvent({id:'evt_refund',type:'charge.refunded',livemode:false,data:{object:charge}} as Stripe.Event);
  expect((await application(a.id,false)).files.some(f=>f.id===reportId)).toBe(false);expect((await application(a.id,true)).payment_status).toBe('refunded');
  await applyCheckout(session,'evt_repeat','checkout.session.completed');expect((await application(a.id,true)).payment_status).toBe('refunded');
 });
 it('tracks shared uploads by File ID and detects changed content without duplicating files',async()=>{
  const a=await saveApplication(input(),'a'.repeat(64));const metadata={id:'id:'+a.id,name:'degree.pdf',size:100,rev:'1',path_display:'/Team Files/WebsitesDev/Miami/Synthetic Applicant - '+a.id+'/degree.pdf'};
  await indexFormalDocument(a.id,'AET_App',metadata);const v=(await readFormal(a.id)).input_version;
  await indexFormalDocument(a.id,'AET_App',{...metadata,path_display:metadata.path_display.replace('degree.pdf','renamed.pdf'),name:'renamed.pdf'});expect((await readFormal(a.id)).input_version).toBe(v);expect((await application(a.id,true)).files).toHaveLength(1);
  await indexFormalDocument(a.id,'AET_App',{...metadata,rev:'2'});expect((await readFormal(a.id)).input_version).toBe(v+1);
  const b=await saveApplication(input(),'a'.repeat(64));await expect(indexFormalDocument(b.id,'AET_App',metadata)).rejects.toMatchObject({code:'document_application_mismatch'});
 });
 it('still cancels unpaid applications and rejects further dedicated uploads',async()=>{
  const a=await saveApplication(input(),'a'.repeat(64));await cancel(a.id,'customer');expect((await readFormal(a.id)).status).toBe('cancelled');
  await expect(addFile(a.id,new File(['%PDF-1.7\nsynthetic'], 'test.pdf',{type:'application/pdf'}),'document','customer')).rejects.toMatchObject({code:'application_locked'});
 });
});
