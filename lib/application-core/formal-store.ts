import 'server-only';
import { randomUUID } from 'node:crypto';
import type { Sql, TransactionSql } from 'postgres';
import { db, type Row } from '../preeval/db';
import { coreTable } from './connection';
import { sixTableMode } from './convergence-mode';
import { convergedPaymentState } from './converged-payment-state';
import { AppError } from '../preeval/domain';
import { canDownloadReport, payableTotal } from '../evaluation-application/workflow';
import { toLegacyFormal, toLegacyEducation } from '../legacy-application/mapping';
import { configuration } from '../preeval/config';
export type FormalDB = Sql | TransactionSql;
export const formalCore = () => sixTableMode(db());
export const formalPayments = (sql: FormalDB) => sql`select p.*,checkout_session_id as session_id,payment_intent_id as payment_intent,payment_status as status from ${coreTable(sql,'aet_payments')} p where source='formal-evaluation'`;
export const formalFiles = (sql: FormalDB) => sql`select d.*,original_filename as name,size_bytes::int as bytes,upload_state as state,storage_path as dropbox_path,
  case when access_scope='staff_only' then 'report' else 'document' end as kind,
  coalesce((upload_context->>'input_version')::int,0) as input_version,upload_context->>'sha256' as sha256
  from ${coreTable(sql,'aet_documents')} d join ${coreTable(sql,'aet_core_applications')} a on a.id=d.application_id where a.primary_service='evaluation'`;
export const formalRows = (sql: FormalDB) => sql`select a.*,s.id as service_id,'en'::text as locale,s.input_version,s.staff_notes,s.customer_message,
  s.details->'quote' as quote,s.details->'confirmed_quote' as confirmed_quote,s.notification_state,s.result,s.amount_cents,
  s.result->'documents'->0->>'document_id' as released_file_id,${convergedPaymentState(sql)} as payment_status,
  jsonb_build_object(
    'client',coalesce(s.details->'client_extra','{}'::jsonb)||jsonb_build_object('name',coalesce(a.contact_name,''),'email',coalesce(a.email,''),'phone',coalesce(a.phone,''),'office',coalesce(a.office,''),'purpose',coalesce(a.purpose,'')),
    'evaluee',jsonb_build_object('title',coalesce(a.pronouns,''),'first',coalesce(a.first_name,''),'middle',coalesce(a.middle_name,''),'last',coalesce(a.last_name,''),'birth',coalesce(a.date_of_birth::text,'')),
    'educations',coalesce((select jsonb_agg(jsonb_build_object('school',e.school_name,'country',e.country_of_study,'degree',e.degree_obtained,
      'start',case when e.study_start_date ? 'year' then concat(e.study_start_date->>'year','-',lpad(e.study_start_date->>'month',2,'0')) else '' end,
      'end',case when e.study_end_date ? 'year' then concat(e.study_end_date->>'year','-',lpad(e.study_end_date->>'month',2,'0')) else '' end) order by e.sort_order,e.id)
      from ${coreTable(sql,'aet_education')} e where e.application_id=a.id),'[]'::jsonb),
    'services',s.details->'services','delivery',s.details->'delivery','terms',coalesce(s.details->'terms','false'::jsonb),'notes',coalesce(s.notes,''))
    ||case when a.submission_version=2 then jsonb_build_object('intakeVersion',2,'intake',a.submitted_snapshot->'data'->'intake') else '{}'::jsonb end as data
  from ${coreTable(sql,'aet_core_applications')} a join ${coreTable(sql,'aet_service_detail')} s on s.application_id=a.id and s.service_type='evaluation'
  where a.primary_service='evaluation'`;
export async function readFormal(id:string,sql:FormalDB=db(),lock=false):Promise<Row> {
  if(lock)await sql`select id from ${coreTable(sql,'aet_core_applications')} where id=${id} and primary_service='evaluation' for update`;
  const [row]=await sql`select * from (${formalRows(sql)}) f where id=${id}`;
  if(!row)throw new AppError('not_found',404);
  return row;
}
export async function touchFormal(sql:FormalDB,id:string,status?:string) {
  await sql`update ${coreTable(sql,'aet_core_applications')} set version=version+1,updated_at=now(),status=coalesce(${status??null},status) where id=${id} and primary_service='evaluation'`;
  await sql`update ${coreTable(sql,'aet_service_detail')} set updated_at=now(),status=coalesce(${status??null},status) where application_id=${id} and service_type='evaluation'`;
}
/** Preserve the original request and its IDs; mutable business fields have one owner. */
export async function insertFormal(sql:FormalDB,input:Row) {
  const d=input.data, id=input.id||randomUUID(), q=input.quote;
  const educationIds:string[]=input.educations?.map((e:Row)=>e.id)||d.educations.map(()=>randomUUID());
  const {name:_,email:__,phone:___,office:____,purpose:_____,...clientExtra}=d.client;
  const amount=input.confirmed_quote?.total??(!q.needsQuote&&q.min===q.max?q.min:null);
  const now=new Date().toISOString();
  await sql`insert into ${coreTable(sql,'aet_core_applications')} ${sql({id,contact_name:d.client.name,email:d.client.email,phone:d.client.phone,
    mailing_address:sql.json(d.delivery.sameAddress?clientExtra:d.delivery.address),office:d.client.office||null,primary_service:'evaluation',pronouns:d.evaluee.title,
    first_name:d.evaluee.first,middle_name:d.evaluee.middle,last_name:d.evaluee.last,date_of_birth:d.evaluee.birth||null,residence_country:d.client.country||null,
    purpose:d.client.purpose,source:d.intakeVersion===2?'unified-application':'formal-evaluation',status:input.status||'submitted',
    request_id:input.request_id,request_hash:input.request_hash,request_hash_version:0,submission_version:d.intakeVersion===2?2:1,
    submitted_snapshot:sql.json(input.snapshot||{data:d,quote:q}),submitted_at:input.created_at||now,version:input.version||1,created_at:input.created_at||now,updated_at:input.updated_at||now})}`;
  for(let i=0;i<d.educations.length;i++){
    const e=input.educations?.[i]||toLegacyEducation(d.educations[i]);
    await sql`insert into ${coreTable(sql,'aet_education')} ${sql({id:educationIds[i],application_id:id,school_name:e.school_name,country_of_study:e.country_of_study,
      degree_obtained:e.degree_obtained,study_start_date:sql.json(e.study_start_date),study_end_date:sql.json(e.study_end_date),sort_order:i})}`;
  }
  await sql`insert into ${coreTable(sql,'aet_service_detail')} ${sql({application_id:id,service_type:'evaluation',
    details:sql.json({education_ids:educationIds,client_extra:clientExtra,services:d.services,delivery:d.delivery,terms:d.terms??false,quote:q,confirmed_quote:input.confirmed_quote||null}),
    status:input.status||'submitted',input_version:input.input_version||1,notes:d.notes||'',staff_notes:input.staff_notes||'',customer_message:input.customer_message||'',
    amount_cents:amount,pricing_source:amount===null?null:input.confirmed_quote?'manual':'automatic',notification_state:sql.json(input.notification_state||{}),
    created_at:input.created_at||now,updated_at:input.updated_at||now})}`;
  return id;
}
export async function submitFormal(data:Row,quote:Row,requestId:string,requestHash:string) {
  return db().begin(async sql=>{
    await sql`select pg_advisory_xact_lock(hashtextextended(${requestId},0))`;
    const [old]=await sql`select id,request_hash,primary_service from ${coreTable(sql,'aet_core_applications')} where request_id=${requestId}`;
    if(old){if(old.primary_service!=='evaluation'||old.request_hash!==requestHash)throw new AppError('idempotency_conflict',409);return {id:old.id as string,created:false};}
    const id=await insertFormal(sql,{data,quote,request_id:requestId,request_hash:requestHash});
    if(data.intakeVersion===2)await queueFormalNotification(sql,id,'confirmation','intake:'+id);
    return {id,created:true};
  });
}
export async function formalApplication(id:string,admin:boolean) {
  const row=await readFormal(id);
  const files=await db()`select id,kind,name,bytes,input_version,created_at from (${formalFiles(db())}) f where application_id=${id} and state='ready' order by created_at`;
  row.files=files.filter(f=>admin||f.kind==='document'||canDownloadReport(row as never,f.id));
  row.total=payableTotal(row as never);
  if(admin){row.payments=await db()`select id,session_id,amount_cents,status,created_at from (${formalPayments(db())}) p where application_id=${id} order by created_at desc`;row.audit=[];}
  else {delete row.staff_notes;delete row.notification_state;delete row.submitted_snapshot;delete row.request_hash;delete row.result;row.released_file_id=row.files.find((f:Row)=>f.kind==='report')?.id||null;}
  return row;
}
export async function formalLegacy(id:string) {
  const a=await readFormal(id), legacy=toLegacyFormal(a.data,a.quote);
  const educations=await db()`select * from ${coreTable(db(),'aet_education')} where application_id=${id} order by sort_order,id`;
  return {row:{...legacy,id,status:a.status,payment_status:a.payment_status,office:a.office,due_amount:a.amount_cents===null?null:a.amount_cents/100,submitted_at:a.submitted_at,created_at:a.created_at,
    paid_at:(await db()`select max(paid_at) as paid from ${coreTable(db(),'aet_payments')} where application_id=${id} and payment_status='paid'`)[0].paid},educations};
}
export async function queueFormalNotification(sql:FormalDB,id:string,kind:string,key:string,extra:Row={}){
  if(!['confirmation','payment','fee_update'].includes(kind))throw new Error('Unsupported formal notification');
  const [s]=await sql`select id,notification_state from ${coreTable(sql,'aet_service_detail')} where application_id=${id} and service_type='evaluation' for update`;
  const old=s.notification_state[kind];if(old?.key===key)return;
  if(old&&old.state!=='sent'&&old.attempts>0)throw new AppError('notification_review_required',409);
  s.notification_state[kind]={id:randomUUID(),kind,key,recipient:configuration().recipient,state:'queued',attempts:0,available_at:new Date().toISOString(),...extra};
  await sql`update ${coreTable(sql,'aet_service_detail')} set notification_state=${sql.json(s.notification_state)} where id=${s.id}`;
}
/** Refresh file metadata discovered in an authorized folder; never reassign a File ID. */
export async function indexFormalDocument(id:string,location:string,file:Row) {
  return db().begin(async tx=>{
    const a=await readFormal(id,tx,true);
    const [old]=await tx`select * from ${coreTable(tx,'aet_documents')} where storage_location=${location} and storage_file_id=${file.id}`;
    if(old&&old.application_id!==id)throw new AppError('document_application_mismatch',409);
    if(old?.access_scope==='staff_only')return;
    if(!old){
      await tx`insert into ${coreTable(tx,'aet_documents')}(application_id,storage_location,storage_file_id,storage_rev,storage_content_hash,storage_path,original_filename,size_bytes,access_scope,upload_state)
        values(${id},${location},${file.id},${file.rev},${file.content_hash||null},${file.path_display||null},${file.name},${file.size},'customer_input','ready')`;
      // A folder scan adds documents, never publishes an old report against changed inputs.
      await tx`update ${coreTable(tx,'aet_service_detail')} set input_version=input_version+1,result=null where id=${a.service_id}`;
      if(!['cancelled','completed'].includes(a.status))await touchFormal(tx,id,'reviewing');
      else if(a.status==='completed')await touchFormal(tx,id,'reviewing');
    }else{
      const changed=old.storage_rev!==file.rev;
      await tx`update ${coreTable(tx,'aet_documents')} set storage_path=${file.path_display||null},storage_rev=${file.rev},storage_content_hash=${file.content_hash||null},original_filename=${file.name},size_bytes=${file.size},updated_at=now() where id=${old.id}`;
      if(changed){await tx`update ${coreTable(tx,'aet_service_detail')} set input_version=input_version+1,result=null where id=${a.service_id}`;await touchFormal(tx,id,a.status==='completed'?'reviewing':undefined);}
    }
  });
}
