import { coreTable } from './connection';
import { sixTableMode } from './convergence-mode';
import { compact, compactFileRecords, reserveCompactFile, settleCompactFile } from './compact-files';
import { convergedPaymentState, convergedReleaseEligible } from './converged-payment-state';
import 'server-only';
import { createHash, randomUUID } from 'node:crypto';
import type { Sql, TransactionSql } from 'postgres';
import { db, table, type Row } from '../preeval/db';
import { AppError, BASE_CENTS } from '../preeval/domain';
import { convergenceConfiguration } from './convergence-mode';
import { coreEducation } from './runtime';

type DB = Sql | TransactionSql;
export const converged = () => Boolean(convergenceConfiguration(db()));
export const providerAccount = () => {
  const config = convergenceConfiguration(db());
  if (!config) throw new Error('Convergence is not active');
  return config.providerAccount;
};
export async function lockApplication(tx: DB, id: string) {
  const [a] = await tx`select id from ${coreTable(tx,'aet_core_applications')} where id=${id} for update`;
  if (!a) throw new AppError('not_found',404);
}
/** API-compatible shape computed from canonical owners; never persisted as a second application. */
export async function readConverged(id: string, sql: DB = db(), lock = false): Promise<Row | undefined> {
  if (lock) await lockApplication(sql,id);
  const [app] = await sql`select a.*,a.residence_country as country,s.id as service_id,s.staff_notes as notes,
    s.status,s.input_version,s.result as saved_result,s.result->'content' as result,
    ${compact()?sql`s.result_version`:sql`coalesce((s.result->>'version')::int,0)`} result_version,
    j.state as ai_status,j.error as ai_error,j.uploads_pending,j.attempts as ai_attempts,j.lease as ai_active_run,
    j.id as job_id,j.available_at as ai_available_at,j.locked_at as ai_locked_at,
    ${convergedPaymentState(sql)} as payment_status
    from ${coreTable(sql,'aet_core_applications')} a join ${coreTable(sql,'aet_service_detail')} s on s.application_id=a.id and s.service_type='pre-evaluation'
    join ${coreTable(sql,'aet_ai_runs')} j on j.application_id=a.id and j.current and j.input_version=s.input_version where a.id=${id}`;
  if (app) { app.locale='en'; app.ai_pipeline='openai'; app.education=await coreEducation(sql,id); }
  return app;
}
/** Existing transports can share a single lookup without referring to retired tables. */
export async function workflowRows(sql: DB, id: string, lock = false) {
  if (converged()) { const app=await readConverged(id,sql,lock); return app ? [app] : []; }
  if(lock)return sql`select * from ${table('preeval.applications')} where id=${id} for update`;
  return sql`select * from ${table('preeval.applications')} where id=${id}`;
}
export async function setStatus(tx: DB, id: string, status: string) {
  await tx`update ${coreTable(tx,'aet_service_detail')} set status=${status},updated_at=now() where application_id=${id} and service_type='pre-evaluation'`;
  await tx`update ${coreTable(tx,'aet_core_applications')} set status=${status},version=version+1,updated_at=now() where id=${id}`;
}
export async function queueInput(tx: DB,id: string,state: string,uploadsPending: boolean,status='processing') {
  await lockApplication(tx,id);
  await tx`update ${coreTable(tx,'aet_ai_runs')} set current=false,state=case when state in ('idle','queued','running') then 'superseded' else state end,
    lease=null,locked_at=null where application_id=${id} and current`;
  const [s]=await tx`update ${coreTable(tx,'aet_service_detail')} set input_version=input_version+1,result=null,updated_at=now()
    where application_id=${id} and service_type='pre-evaluation' returning input_version`;
  await tx`insert into ${coreTable(tx,'aet_ai_runs')}(application_id,input_version,state,uploads_pending) values (${id},${s.input_version},${state},${uploadsPending})`;
  await setStatus(tx,id,status);
}
export async function submitConverged(v: Row): Promise<Row> {
  const app=await db().begin(async tx=>{
    const {locale:_locale,...snapshot}=v;
    const hash=createHash('sha256').update(JSON.stringify(snapshot)).digest('hex');
    await tx`select pg_advisory_xact_lock(hashtextextended(${v.requestId},0))`;
    const [old]=await tx`select id,request_hash,request_hash_version from ${coreTable(tx,'aet_core_applications')} where request_id=${v.requestId}`;
    if (old) {
      const expected=old.request_hash_version===0?createHash('sha256').update(JSON.stringify(v)).digest('hex'):hash;
      if(![0,1].includes(old.request_hash_version)||old.request_hash!==expected)throw new AppError('duplicate_conflict',409);
      return (await readConverged(old.id,tx))!;
    }
    const [a]=await tx`insert into ${coreTable(tx,'aet_core_applications')}(contact_name,email,first_name,middle_name,last_name,residence_country,primary_service,
      purpose,source,status,request_id,request_hash,request_hash_version,submission_version,submitted_snapshot,submitted_at)
      values (${[v.firstName,v.middleName,v.lastName].filter(Boolean).join(' ')},${v.email},${v.firstName},${v.middleName},${v.lastName},${v.country},
      'pre-evaluation','Preliminary degree equivalency','dedicated-pre-evaluation','submitted',${v.requestId},${hash},1,1,${tx.json(snapshot)},now()) returning id`;
    const month=(value:string)=>({year:value.slice(0,4),month:value.slice(5,7)});
    const [e]=await tx`insert into ${coreTable(tx,'aet_education')}(application_id,school_name,country_of_study,degree_obtained,study_start_date,study_end_date)
      values (${a.id},${v.schoolName},${v.countryOfStudy},${v.degreeObtained},${tx.json(month(v.startDate))},${tx.json(month(v.endDate))}) returning id`;
    await tx`insert into ${coreTable(tx,'aet_service_detail')}(application_id,service_type,details,amount_cents,pricing_source)
      values (${a.id},'pre-evaluation',${tx.json({education_ids:[e.id]})},${BASE_CENTS},'automatic')`;
    await tx`insert into ${coreTable(tx,'aet_ai_runs')}(application_id,input_version,state,uploads_pending)
      values (${a.id},1,${v.uploadsPending?'idle':'queued'},${Boolean(v.uploadsPending)})`;
    if(!sixTableMode(db())) await tx`insert into ${coreTable(tx,'aet_audit')}(application_id,actor,action) values (${a.id},'customer','application.submitted')`;
    return (await readConverged(a.id,tx))!;
  });
  return {...app,locale:v.locale};
}
export async function pauseConverged(id:string,tx:TransactionSql) {
  const app=await readConverged(id,tx,true);
  if(!app || app.status==='cancelled')throw new AppError('application_unavailable',409);
  await queueInput(tx,id,'idle',true);
}
export async function completeConverged(id:string) {
  await db().begin(async tx=>{
    const a=await readConverged(id,tx,true);
    if(!a || a.status==='cancelled' || (a.status==='needs_information'&&!a.uploads_pending))throw new AppError('application_unavailable',409);
    if(!a.uploads_pending)return;
    const files=compact()?await tx`select upload_state as state from ${coreTable(tx,'aet_documents')} where application_id=${id} and access_scope='customer_input'`:await tx`select state from ${coreTable(tx,'aet_uploads')} where application_id=${id}`;
    const docs=await tx`select id from ${coreTable(tx,'aet_documents')} where application_id=${id} and access_scope='customer_input' and storage_file_id is not null`;
    if(!files.length || files.some(f=>f.state!=='ready') || files.length!==docs.length)throw new AppError('uploads_incomplete',409);
    await queueInput(tx,id,'queued',false);
  });
}
export async function retryConverged(id:string,staff:boolean) {
  await db().begin(async tx=>{
    const a=await readConverged(id,tx,true);
    const pending=compact()?await tx`select id from ${coreTable(tx,'aet_documents')} where application_id=${id} and access_scope='customer_input' and upload_state<>'ready' limit 1`:await tx`select id from ${coreTable(tx,'aet_uploads')} where application_id=${id} and state<>'ready' limit 1`;
    if(!a || a.uploads_pending || a.status==='cancelled' || (!staff&&(a.ai_status!=='failed'||a.status==='needs_information')) || pending.length)
      throw new AppError('ai_retry_unavailable',409);
    await queueInput(tx,id,'queued',false);
  });
}
export async function dueConverged(limit=1,id?:string) {
  const rows=await db()`select j.application_id as id from ${coreTable(db(),'aet_ai_runs')} j join ${coreTable(db(),'aet_service_detail')} s on s.application_id=j.application_id
    and s.service_type='pre-evaluation' and s.input_version=j.input_version where j.current and not j.uploads_pending
    and s.status not in ('cancelled','needs_information') and (${id||null}::uuid is null or j.application_id=${id||null}::uuid)
    and ((j.state='queued' and j.available_at<=now()) or (j.state='running' and j.locked_at<now()-interval '8 minutes'))
    order by j.available_at,j.id limit ${Math.max(1,Math.min(3,limit))}`;
  return rows.map(r=>r.id as string);
}
export async function publishConverged(id:string) {
  const ready=await db().begin(async tx=>{
    const a=await readConverged(id,tx,true);
    if(!a || !convergedReleaseEligible(a.payment_status) || !a.result || a.ai_status!=='completed' || a.uploads_pending || ['cancelled','needs_information'].includes(a.status))return null;
    if(a.saved_result.input_version!==a.input_version)return null;
    await tx`update ${coreTable(tx,'aet_service_detail')} set result=jsonb_set(jsonb_set(result,'{status}','"released"'::jsonb),'{released_at}',
      case when result->>'status'='released' and result->>'released_at' is not null then result->'released_at' else to_jsonb(clock_timestamp()) end),updated_at=now()
      where application_id=${id} and service_type='pre-evaluation'
        and (result->>'status' is distinct from 'released' or result->>'released_at' is null)`;
    if(a.status!=='completed')await setStatus(tx,id,'completed');
    return a;
  });
  if(ready) { const {applicationEmail}=await import('../preeval/email');await applicationEmail(ready,'result'); }
}
export async function saveResult(tx:DB,a:Row,content:Row,source:string) {
  const [version]=compact()?await tx`update ${coreTable(tx,'aet_service_detail')} set result_version=result_version+1 where id=${a.service_id} returning result_version as value`:await tx`select coalesce(max((detail->>'version')::int),0)+1 as value from ${coreTable(tx,'aet_audit')}
    where application_id=${a.id} and action='result.saved'`;
  const result={content,documents:[],status:'draft',released_at:null,input_version:a.input_version,version:version.value};
  await tx`update ${coreTable(tx,'aet_service_detail')} set result=${tx.json(result)},updated_at=now() where id=${a.service_id}`;
  if(!sixTableMode(db())) await tx`insert into ${coreTable(tx,'aet_audit')}(application_id,actor,action,detail) values (${a.id},${source},'result.saved',${tx.json({version:version.value,source})})`;
}
export async function startSharedConverged(id:string,key:string) {
  return db().begin(async tx=>{
    const a=await readConverged(id,tx,true);if(!a || a.status==='cancelled')throw new AppError('application_unavailable',409);
    const [old]=compact()?await tx`select * from (${compactFileRecords(tx)}) f where application_id=${id} and file_key=${key}`:await tx`select * from ${coreTable(tx,'aet_uploads')} where application_id=${id} and file_key=${key}`;
    if(old?.state==='uploading' && Date.now()-new Date(old.updated_at||old.created_at).getTime()<15*60*1000)throw new AppError('upload_in_progress',409);
    // Do not silently replace a completed File ID; a new file uses a new slot.
    if(old?.state==='ready')throw new AppError('file_already_uploaded',409);
    if(!old && (compact()?await tx`select id from ${coreTable(tx,'aet_documents')} where application_id=${id} and access_scope='customer_input'`:await tx`select id from ${coreTable(tx,'aet_uploads')} where application_id=${id}`).length>=5)throw new AppError('file_limit');
    await pauseConverged(id,tx);const attempt=randomUUID();
    if(compact()){await reserveCompactFile(tx,{id:old?.id||randomUUID(),applicationId:id,name:key,key,attempt});return attempt;}
    await tx`insert into ${coreTable(tx,'aet_uploads')}(id,application_id,file_key,attempt_id,name,state) values (${randomUUID()},${id},${key},${attempt},${key},'uploading')
      on conflict(application_id,file_key) do update set attempt_id=excluded.attempt_id,state='uploading',created_at=clock_timestamp(),updated_at=now()`;
    return attempt;
  });
}
export async function finishSharedConverged(id:string,attempt:string|null,success:boolean,savedFile?:Row|(()=>Promise<Row>)) {
  if(!attempt)return false;
  return db().begin(async tx=>{
    const a=await readConverged(id,tx,true);if(!a||a.status==='cancelled')return false;
    const [slot]=compact()?await tx`select * from (${compactFileRecords(tx)}) f where application_id=${id} and attempt_id=${attempt} and state='uploading'`:await tx`select * from ${coreTable(tx,'aet_uploads')} where application_id=${id} and attempt_id=${attempt} and state='uploading' for update`;
    if(!slot)return false;
    if(success){
      if(!savedFile)throw new AppError('file_metadata_required');
      const f=typeof savedFile==='function'?await savedFile():savedFile;
      const mime=/\.pdf$/i.test(f.name)?'application/pdf':/\.png$/i.test(f.name)?'image/png':'image/jpeg';
      const file={...slot,name:f.name,mime_type:mime,bytes:f.size,dropbox_path:f.path};
      const {recordCoreFile}=await import('./runtime');
      await recordCoreFile(tx,file,{...f,content_hash:f.contentHash,path_display:f.path});
      if(!compact())await tx`update ${coreTable(tx,'aet_uploads')} set name=${f.name},mime_type=${mime},bytes=${f.size},dropbox_path=${f.path},sha256=${'dropbox:'+f.contentHash}
        where id=${slot.id}`;
    }
    if(compact())await settleCompactFile(tx,slot.id,slot.version,success?'ready':'failed');
    else await tx`update ${coreTable(tx,'aet_uploads')} set state=${success?'ready':'failed'},updated_at=now() where id=${slot.id}`;
    return true;
  });
}
export async function recoveryConverged(id:string) {
  const a=await readConverged(id);
  if(!a)return {uploads:[],pending:false,hasReady:false,canModify:false};
  const uploads=compact()?await db()`select 'file' as source,id::text,version,name,state from (${compactFileRecords(db())}) f where application_id=${id} and state<>'ready'`:await db()`select 'file' as source,id::text,created_at::text as version,coalesce(name,file_key) name,state
    from ${coreTable(db(),'aet_uploads')} where application_id=${id} and state<>'ready'`;
  const ready=await db()`select id from ${coreTable(db(),'aet_documents')} where application_id=${id} and access_scope='customer_input' and storage_file_id is not null limit 1`;
  return {uploads,pending:a.uploads_pending,hasReady:!!ready.length,canModify:a.status!=='cancelled'};
}
export async function staffConverged(id:string,body:Row,actor:string) {
  const {resultSchema}=await import('../preeval/domain');
  const {applicationEmail}=await import('../preeval/email');
  if(body.action==='retry_ai'){await retryConverged(id,true);return;}
  if(body.action==='cancel'){const {cancelConverged}=await import('./converged-payments');return cancelConverged(id,actor);}
  const requestId=await db().begin(async tx=>{
    const a=await readConverged(id,tx,true);if(!a)throw new AppError('not_found',404);
    if(body.action==='notes'){
      if(typeof body.notes!=='string'||body.notes.length>5000)throw new AppError('invalid_request');
      await tx`update ${coreTable(tx,'aet_service_detail')} set staff_notes=${body.notes},updated_at=now() where id=${a.service_id}`;
      if(!sixTableMode(db())) await tx`insert into ${coreTable(tx,'aet_audit')}(application_id,actor,action) values (${id},${actor},'notes.updated')`;
    }else if(body.action==='result'){
      const parsed=resultSchema.safeParse(body.result);if(!parsed.success)throw new AppError('invalid_result');
      if(a.status==='cancelled'||a.uploads_pending)throw new AppError('application_cancelled',409);
      await queueInput(tx,id,'completed',false);const next=(await readConverged(id,tx))!;
      await saveResult(tx,next,parsed.data,actor);
    }else if(body.action==='information'){
      if(typeof body.message!=='string'||body.message.trim().length<3||body.message.length>2000)throw new AppError('invalid_request');
      if(a.status==='cancelled')throw new AppError('application_cancelled',409);
      await queueInput(tx,id,'idle',a.uploads_pending,'needs_information');
      await tx`update ${coreTable(tx,'aet_service_detail')} set customer_message=${body.message} where id=${a.service_id}`;
      const [request]=sixTableMode(db())?[]:await tx`insert into ${coreTable(tx,'aet_audit')}(application_id,actor,action,detail) values (${id},${actor},'information.requested',${tx.json({message:body.message})}) returning id`;
      if(compact()){
        const requestId=randomUUID();
        await tx`update ${coreTable(tx,'aet_service_detail')} set details=jsonb_set(details,'{information_request}',${tx.json({id:requestId,message:body.message})}::jsonb) where id=${a.service_id}`;
        return requestId;
      }
      return request.id;
    }else throw new AppError('invalid_request');
  });
  if(body.action==='result')await publishConverged(id);
  if(body.action==='information'){
    await applicationEmail((await readConverged(id))!,'information',requestId);
  }
}
export async function statusConverged(sql:Sql,id:string,actor:import('./reader').CoreActor) {
  return sql.begin('isolation level repeatable read read only',async tx=>{
    const a=await readConverged(id,tx);
    if(!a || (actor.role==='staff'&&!(a.office===null?actor.includeUnassigned:actor.offices.includes(a.office))))throw new AppError('not_found',404);
    const files=await tx`select id,original_filename as name,mime_type,size_bytes::int as bytes,'ready' as state from ${coreTable(tx,'aet_documents')}
      where application_id=${id} and access_scope='customer_input' and storage_file_id is not null order by id`;
    const visible=a.saved_result?.status==='released' && a.status==='completed' && convergedReleaseEligible(a.payment_status)
      && a.ai_status==='completed' && !a.uploads_pending && a.saved_result.input_version===a.input_version;
    return {id:a.id,first_name:a.first_name,middle_name:a.middle_name,last_name:a.last_name,email:a.email,country:a.country,
      status:a.status,payment_status:a.payment_status,ai_status:a.ai_status,uploads_pending:a.uploads_pending,
      document_issue:/^(document_|pdf_|image_|invalid_document|unreadable_document|encrypted_document|unsupported_document|uploads_incomplete)/.test(a.ai_error||''),
      result:visible?a.result:null,result_version:visible?a.result_version:0,education:a.education,files,created_at:a.created_at,updated_at:a.updated_at};
  });
}
export async function adminConverged(search:string,status:string,page:number,staff:Row) {
  const pattern='%'+search.replace(/[\\%_]/g,'\\$&')+'%';
  // Build a bounded queue using canonical fields and the current AI run. Payment
  // status is a ledger-derived projection, not a second editable column.
  return db()`with records as (select a.id,a.first_name,a.last_name,a.email,a.office,a.created_at,a.updated_at,s.status,j.state ai_status,
    e.school_name,e.degree_obtained,
    ${convergedPaymentState(db())} payment_status,
    (select count(*)::int from ${coreTable(db(),'aet_documents')} d where d.application_id=a.id and d.access_scope='customer_input' and d.storage_file_id is not null) file_count,
    ${compact()?db()`(select count(*)::int from jsonb_each(s.notification_state) n where n.value->>'state'='failed')`:db()`(select count(*)::int from ${coreTable(db(),'aet_emails')} m where m.application_id=a.id and m.state='failed')`} email_failures
    from ${coreTable(db(),'aet_core_applications')} a join ${coreTable(db(),'aet_service_detail')} s on s.application_id=a.id and s.service_type='pre-evaluation'
    join ${coreTable(db(),'aet_ai_runs')} j on j.application_id=a.id and j.current join ${coreTable(db(),'aet_education')} e on e.application_id=a.id
      and s.details->'education_ids' @> jsonb_build_array(e.id::text))
    select *,count(*) over()::int total from records where (${!staff.offices} or office=any(${staff.offices||[]}::text[]) or (office is null and ${Boolean(staff.include_unassigned)}))
    and (${status}='all' or status=${status} or payment_status=${status} or ai_status=${status})
    and concat_ws(' ',first_name,last_name,email,id::text,school_name) ilike ${pattern} order by created_at desc,id limit 20 offset ${(page-1)*20}`;
}
