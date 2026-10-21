/** Synthetic preview verification: real private DB/Dropbox; injected GPT only. */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import postgres from 'postgres';
import { PDFDocument } from 'pdf-lib';
import { configuration, CLOUD_PROJECT } from '../../lib/preeval/config';
import { db, table } from '../../lib/preeval/db';
import { saveLegacyPreeval } from '../../lib/legacy-application/store';
import { addFile, application, staffAction } from '../../lib/preeval/service';
import { completeUploads, pauseForUpload, retryAnalysis, startDocumentUpload, finishDocumentUpload, dueAIJobs } from '../../lib/preeval/ai-jobs';
import { processAI, type AIDependencies } from '../../lib/preeval/ai';
import { documentManifest, loadDocuments } from '../../lib/preeval/ai-documents';
import { AIError, type Analysis } from '../../lib/preeval/ai-contract';
import { contextFor } from '../../lib/dropbox/application';
import { resolveStorage } from '../../lib/dropbox/storage';
import { clientForOffice, uploadSmall, seal, startUpload, continueUpload, dropboxHash } from '../../lib/dropbox/server';
import { CHUNK_SIZE } from '../../lib/dropbox/shared';
import { publishIfReady } from '../../lib/preeval/payments';
assert.equal(process.env.PREEVAL_AI_VERIFY,'1'); assert.equal(configuration().cloudPreview,true);
const origin = configuration().origin; assert.ok(/^http:\/\/(localhost|127\.0\.0\.1):3022$/.test(origin));
const adminUrl = new URL(process.env.STAFF_AUTH_DATABASE_URL!);
assert.ok(adminUrl.hostname === `db.${CLOUD_PROJECT}.supabase.co` || adminUrl.hostname.endsWith('.pooler.supabase.com') && decodeURIComponent(adminUrl.username).endsWith('.'+CLOUD_PROJECT));
const admin = postgres(adminUrl.toString(), { prepare:false,max:1 });
const ids: string[] = [], folders: string[] = []; let checks = 0;
function check(value: unknown, message: string) { assert.ok(value,message); checks++; console.log('PASS '+message); }
async function create(pending = true) {
  const id = randomUUID(), educationId = randomUUID(); ids.push(id);
  const input = { requestId:randomUUID(),locale:'en' as const,email:`synthetic-${id}@example.invalid`,firstName:'AET AI',middleName:'',lastName:'Verification',country:'CN',schoolName:'Synthetic University',countryOfStudy:'CN',degreeObtained:'Synthetic Bachelor',startDate:'2018-09',endDate:'2022-06',terms:true as const };
  await db().begin(async tx => {
    await tx`insert into ${table('preeval.applications')}(id,request_id,request_hash,email,first_name,middle_name,last_name,country,locale,ai_pipeline,uploads_pending,ai_status)
      values(${id},${input.requestId},'synthetic',${input.email},${input.firstName},'',${input.lastName},'CN','en','openai',${pending},${pending ? 'idle':'queued'})`;
    await saveLegacyPreeval(tx,id,educationId,input);
    await tx`insert into ${table('preeval.educations')}(id,application_id,school_name,country_of_study,degree_obtained,start_date,end_date) values(${educationId},${id},${input.schoolName},'CN',${input.degreeObtained},${input.startDate},${input.endDate})`;
  });
  return id;
}
async function row(id: string) { return (await db()`select * from ${table('preeval.applications')} where id=${id}`)[0]; }
const analysis: Analysis = { result:'Synthetic preliminary result',reasoning:'Synthetic fixture only. This is not a real credential assessment.',basis:'documents',facts:{institution:null,country:null,qualification:null,start:null,completion:null},issues:[{code:'unverified',description:'Synthetic fixture.'}],evidence:[{documentId:'document-1',page:1,fact:'Synthetic school'}] };
const deps: Partial<AIDependencies> = { configured: () => ({model:'synthetic-model',apiKey:'not-used'}),
  analyze: async (_input, documents) => ({ analysis:{...analysis,basis:documents.length?'documents':'form_only',evidence:documents.length?analysis.evidence:[]},pageMap:[],model:'synthetic-model',responseId:'synthetic-no-api-call',usage:{input_tokens:10,output_tokens:20,total_tokens:30} }),publish:async () => {} };
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aI1sAAAAASUVORK5CYII=','base64');
try {
  const eligibility = await create(false);
  check((await dueAIJobs(1,eligibility))[0]===eligibility,'ready request is eligible for automatic dispatch');
  await db()`update ${table('preeval.applications')} set ai_available_at=now()+interval '10 minutes' where id=${eligibility}`;
  check(!(await dueAIJobs(1,eligibility)).length,'automatic dispatch respects retry backoff');
  await db()`update ${table('preeval.applications')} set ai_available_at=now(),uploads_pending=true where id=${eligibility}`;
  check(!(await dueAIJobs(1,eligibility)).length,'automatic dispatch excludes incomplete uploads');
  await db()`update ${table('preeval.applications')} set uploads_pending=false,ai_pipeline='legacy' where id=${eligibility}`;
  check(!(await dueAIJobs(1,eligibility)).length,'automatic dispatch never sweeps legacy applications');
  await db()`update ${table('preeval.applications')} set ai_pipeline='openai',status='cancelled' where id=${eligibility}`;
  check(!(await dueAIJobs(1,eligibility)).length,'automatic dispatch preserves cancellation');
  await db()`update ${table('preeval.applications')} set status='needs_information' where id=${eligibility}`;
  check(!(await dueAIJobs(1,eligibility)).length,'automatic dispatch preserves staff pause');
  await db()`update ${table('preeval.applications')} set status='processing',ai_status='running',ai_locked_at=now() where id=${eligibility}`;
  check(!(await dueAIJobs(1,eligibility)).length,'active lease is not automatically dispatched twice');
  await db()`update ${table('preeval.applications')} set ai_locked_at=now()-interval '9 minutes' where id=${eligibility}`;
  check((await dueAIJobs(1,eligibility))[0]===eligibility,'interrupted lease becomes eligible for recovery');
  check(await processAI(eligibility,deps) && (await row(eligibility)).ai_status==='completed','expired lease recovers using the atomic claim');
  check(!(await dueAIJobs(1,eligibility)).length,'completed analysis is not eligible for recovery');
  await db()`update ${table('preeval.applications')} set ai_status='running',ai_attempts=3,ai_locked_at=now()-interval '9 minutes' where id=${eligibility}`;
  check(!await processAI(eligibility,deps) && (await row(eligibility)).ai_status==='failed','interrupted exhausted job fails without a fourth provider call');
  check(!(await dueAIJobs(1,eligibility)).length,'failed exhausted job requires explicit retry');
  const id = await create(); const app = await row(id); const context = contextFor({...app,created_at:new Date(app.created_at).toISOString()},'pre-evaluation');
  const storage = await resolveStorage(context); folders.push(storage.write.path);
  check(!await processAI(id,deps),'upload-pending application cannot be claimed');
  const pdf = await PDFDocument.create(); pdf.addPage().drawText('SYNTHETIC TEST ONLY - Bachelor of Science');
  const bytes = Buffer.from(await pdf.save());
  await addFile(id,new File([bytes],'Synthetic diploma.pdf',{type:'application/pdf'}),'test');
  check((await row(id)).ai_status==='idle','first file waits for the full batch');
  await uploadSmall(context,new File([png],'Synthetic shared.png',{type:'image/png'}));
  await completeUploads(id); await completeUploads(id);
  const manifest = await documentManifest(await row(id)); const files = await loadDocuments(manifest);
  check(files.length===2 && files.some(f=>f.mime==='application/pdf') && files.some(f=>f.mime==='image/png'),'pilot PDF and shared-upload image form one deduplicated manifest');
  check((await application(id)).files.length===2,'customer file list includes both upload entrances');
  check(files.some(f=>f.bytes.equals(bytes)) && files.some(f=>f.bytes.equals(png)),'original Dropbox bytes reach the provider boundary');
  const jobs = await Promise.all([processAI(id,deps),processAI(id,deps)]);
  check(jobs.filter(Boolean).length===1,'concurrent workers claim the job only once');
  check((await row(id)).ai_status==='completed','analysis and metadata persist');
  check((await application(id)).result===null,'unpaid customer cannot see the result');
  const [run] = await db()`select * from ${table('preeval.ai_runs')} where application_id=${id}`;
  check(run.model==='synthetic-model' && run.usage.total_tokens===30 && run.input.documents.length===2,'model, usage and evidence manifest recorded');
  await db()`update ${table('preeval.applications')} set payment_status='paid' where id=${id}`;
  await publishIfReady(id);
  check((await application(id)).result?.result===analysis.result,'payment unlock preserves the existing customer result');
  check(!await processAI(id,deps),'completed application is not charged twice by polling');
  await completeUploads(id); check((await row(id)).ai_status==='completed','duplicate completion does not regenerate');
  const attempt = await startDocumentUpload(id,'failed-synthetic.png');
  await finishDocumentUpload(id,attempt,false);
  await assert.rejects(()=>completeUploads(id),/uploads_incomplete/); checks++;
  check((await application(id)).result===null,'new upload immediately invalidates the previous result');
  const retry = await startDocumentUpload(id,'failed-synthetic.png');
  await finishDocumentUpload(id,attempt,true);
  await assert.rejects(()=>completeUploads(id),/uploads_incomplete/); checks++;
  await finishDocumentUpload(id,retry,true); await completeUploads(id);
  check((await row(id)).ai_status==='queued','successful retry unlocks batch completion');
  await processAI(id,{...deps,analyze:async()=>{ await pauseForUpload(id); return (await deps.analyze!({school:'',country:'',degree:'',start:'',end:''},files)); }});
  check((await row(id)).result===null && (await row(id)).uploads_pending,'new upload fences a running result');
  const [oldRun] = await db()`select state from ${table('preeval.ai_runs')} where application_id=${id} order by created_at desc limit 1`;
  check(oldRun.state==='superseded','stale work remains auditable');
  await completeUploads(id);
  await processAI(id,{...deps,analyze:async()=>{await staffAction(id,{action:'result',result:{result:'Staff correction',reasoning:'Reviewed synthetic evidence manually.'}},'synthetic-test');return await deps.analyze!({school:'',country:'',degree:'',start:'',end:''},files);}});
  check((await row(id)).result_source==='staff','late AI output cannot replace staff correction');
  await retryAnalysis(id,true);
  for(let i=0;i<3;i++) {
    await db()`update ${table('preeval.applications')} set ai_available_at=now() where id=${id}`;
    await processAI(id,{...deps,analyze:async()=>{throw new AIError('ai_rate_limit',true);}});
  }
  check((await row(id)).ai_status==='failed' && (await row(id)).ai_attempts===3,'transient failures stop after three attempts');
  await retryAnalysis(id);
  await processAI(id,{...deps,manifest:async()=>{throw new AIError('document_unavailable');},analyze:async()=>{throw new Error('must not reach provider');}});
  check((await row(id)).ai_error==='document_unavailable','missing files fail explicitly instead of form-only fallback');
  const empty = await create(false);
  await processAI(empty,deps);
  check((await row(empty)).ai_status==='completed','optional no-file application can use form-only analysis');
  // Historical per-file path is read without moving the original object.
  const historical = process.env.PREEVAL_DROPBOX_ROOT!+'/'+randomUUID(); folders.push(historical);
  const dbx = await clientForOffice('Miami');
  await dbx.filesUpload({path:historical+'/old.png',contents:png,mode:{'.tag':'add'}});
  await db()`insert into ${table('preeval.files')}(id,application_id,name,mime_type,bytes,sha256,dropbox_path,state) values(${randomUUID()},${empty},'old.png','image/png',${png.length},'synthetic-old',${historical+'/old.png'},'ready')`;
  check((await loadDocuments(await documentManifest(await row(empty))))[0].bytes.equals(png),'historical isolated-pilot file remains readable');
  // Chunked uploads remain pending until the whole batch is confirmed.
  const large = Buffer.concat([bytes, Buffer.alloc(CHUNK_SIZE,32)]);
  let chunk = await startUpload(context,{fileName:'Synthetic multi-chunk.pdf',fileSize:large.length,mime:'application/pdf',contentHash:dropboxHash(large)},Date.now()+600000);
  for(let offset=0;offset<large.length;offset+=CHUNK_SIZE) {
    chunk = await continueUpload(context,{action:'append',uploadKey:chunk.uploadKey,chunkIndex:Math.floor(offset/CHUNK_SIZE),chunkData:large.subarray(offset,offset+CHUNK_SIZE).toString('base64')}) as typeof chunk;
  }
  await continueUpload(context,{action:'finish',uploadKey:chunk.uploadKey});
  check((await row(id)).uploads_pending && (await application(id)).files.length===3,'chunked shared upload is indexed and waits for confirmation');
  await completeUploads(id);
  check((await loadDocuments(await documentManifest(await row(id)))).some(f=>f.bytes.equals(large)),'original multi-chunk PDF is readable for GPT');
  // Simulate an imported application whose storage was not previously pinned.
  const imported = await row(empty);
  await admin`delete from aet_preview_evaluation.document_locations where application_id=${empty}`;
  const importedContext = contextFor({...imported,created_at:new Date(imported.created_at).toISOString()},'pre-evaluation');
  const importedStorage = await resolveStorage(importedContext); const legacyPath = importedStorage.reads[1].path; folders.push(legacyPath);
  await dbx.filesUpload({path:legacyPath+'/Historical email.png',contents:png,mode:{'.tag':'add'}});
  check((await documentManifest(imported)).length===2,'historical email folder and old per-file path are reconciled');
  // Authenticated local routes; no GPT, email or payment request is made.
  const token = seal('AET_App','access',context);
  const batch = await fetch(origin+'/api/dropbox/upload-batch',{method:'POST',headers:{Origin:origin,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({action:'start'})});
  check(batch.ok,'shared upload batch HTTP route accepts authorized application');
  const denied = await fetch(origin+'/api/pre-evaluation/applications/'+id+'/retry-ai',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:'{}'});
  check(denied.status===401,'anonymous analysis retry is denied');
  console.log(`PASS ${checks} isolated integration checks. No real GPT requests or email dispatch.`);
  if(process.argv.includes('--keep-ui-fixture')) {
    await writeFile('/tmp/aet-ai-ui-fixture.json',JSON.stringify({id,other:empty,folders}));
    console.log('Synthetic UI fixture retained for browser verification; cleanup is required.');
    ids.splice(0,ids.length,...ids.filter(value => value!==id && value!==empty)); folders.length=0;
  }
} finally {
  for(const path of folders.reverse()) {try{await (await clientForOffice('Miami')).filesDeleteV2({path});}catch(error:any){if(!error.error?.error_summary?.includes('not_found'))throw error;}}
  for(const id of ids) {
    for(const name of ['audit','ai_runs','emails','files','document_uploads','tokens','sessions','educations','payments']) await admin.unsafe(`delete from aet_preview_preeval.${name} where application_id=$1`,[id]);
    await admin`delete from aet_preview_preeval.applications where id=${id}`;
    await admin`delete from aet_preview_legacy.aet_core_educations where application_id=${id}`;
    await admin`delete from aet_preview_legacy.aet_core_applications where id=${id}`;
    await admin`delete from aet_preview_evaluation.document_locations where application_id=${id}`;
  }
  await db().end(); await admin.end();
}
