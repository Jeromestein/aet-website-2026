import 'server-only';
import { createHash, randomUUID } from 'node:crypto';
import { db } from '../preeval/db';
import { AppError, validFile } from '../preeval/domain';
import { filePath, uploadFile } from '../preeval/dropbox';
import { coreTable } from './connection';
import { formalFiles, formalPayments, readFormal, touchFormal, queueFormalNotification } from './formal-store';
import { confirmQuote, staffSchema } from '../evaluation-application/workflow';
export async function addFormalFile(id:string,file:File,kind:'document'|'report') {
  const bytes=Buffer.from(await file.arrayBuffer());
  if(!validFile(bytes,file.type)||(kind==='report'&&file.type!=='application/pdf'))throw new AppError('invalid_file');
  const sha=createHash('sha256').update(bytes).digest('hex');
  const slot=await db().begin(async tx=>{
    const a=await readFormal(id,tx,true);if(['cancelled','completed'].includes(a.status))throw new AppError('application_locked',409);
    const version=kind==='report'?a.input_version:0;
    const [old]=await tx`select * from (${formalFiles(tx)}) f where application_id=${id} and kind=${kind} and sha256=${sha} and input_version=${version}`;
    if(old?.state==='ready')return old;
    if(old?.state==='uploading'&&Date.now()-new Date(old.updated_at).getTime()<120000)throw new AppError('upload_in_progress',409);
    const [{n}]=await tx`select count(*)::int n from (${formalFiles(tx)}) f where application_id=${id} and kind=${kind} and state<>'failed'`;
    if(n>=(kind==='report'?10:20)&&!old)throw new AppError('file_limit');
    const fileId=old?.id||randomUUID(),name=file.name.replace(/[\\/\x00-\x1f\x7f]/g,'_').slice(0,180)||'document';
    const path=await filePath({id,office:a.office,first_name:a.first_name,middle_name:a.middle_name,last_name:a.last_name,submitted_at:new Date(a.created_at).toISOString()},'evaluation',fileId,name,kind==='report',tx);
    const context={sha256:sha,input_version:version};
    const [saved]=await tx`insert into ${coreTable(tx,'aet_documents')}(id,application_id,original_filename,mime_type,size_bytes,access_scope,storage_path,upload_state,upload_context)
      values(${fileId},${id},${name},${file.type},${bytes.length},${kind==='report'?'staff_only':'customer_input'},${path},'uploading',${tx.json(context)})
      on conflict(id) do update set upload_state='uploading',upload_version=aet_documents.upload_version+1,storage_path=excluded.storage_path,updated_at=now() returning *`;
    return {...saved,state:saved.upload_state};
  });
  if(slot.state==='ready')return;
  let metadata;
  try{metadata=await uploadFile(slot.storage_path,bytes);}catch{
    await db()`update ${coreTable(db(),'aet_documents')} set upload_state='failed',updated_at=now() where id=${slot.id} and upload_version=${slot.upload_version}`;
    throw new AppError('upload_failed',502);
  }
  const ready=await db().begin(async tx=>{
    const a=await readFormal(id,tx,true);
    if(['cancelled','completed'].includes(a.status)){
      await tx`update ${coreTable(tx,'aet_documents')} set upload_state='failed' where id=${slot.id} and upload_version=${slot.upload_version}`;return false;
    }
    const rows=await tx`update ${coreTable(tx,'aet_documents')} set storage_location=${metadata.storageLocation},storage_file_id=${metadata.id},storage_rev=${metadata.rev},storage_path=${metadata.path_display||slot.storage_path},storage_content_hash=${metadata.content_hash||null},upload_state='ready',updated_at=now()
      where id=${slot.id} and application_id=${id} and upload_version=${slot.upload_version} and upload_state='uploading' returning id`;
    if(!rows.length)return false;
    await tx`update ${coreTable(tx,'aet_service_detail')} set input_version=input_version+${kind==='document'?1:0},result=case when ${kind}='document' then null else result end where id=${a.service_id}`;
    await touchFormal(tx,id,kind==='document'?'reviewing':undefined);return true;
  });
  if(!ready)throw new AppError('application_locked',409);
}
export async function formalStaffAction(id:string,raw:unknown){
  const body=staffSchema.parse(raw);
  await db().begin(async tx=>{
    const a=await readFormal(id,tx,true);
    if(a.version!==body.version)throw new AppError('stale_version',409);
    if(a.status==='cancelled')throw new AppError('application_locked',409);
    if(body.action==='notes')await tx`update ${coreTable(tx,'aet_service_detail')} set staff_notes=${body.notes} where id=${a.service_id}`;
    if(body.action==='quote'){
      if(a.payment_status!=='unpaid'||(await tx`select id from (${formalPayments(tx)}) p where application_id=${id} and status in ('creating','open','paid')`).length)throw new AppError('quote_locked',409);
      const q=confirmQuote(a.quote,a.data,body.base,body.additional,body.explanation);
      await tx`update ${coreTable(tx,'aet_service_detail')} set details=jsonb_set(details,'{confirmed_quote}',${tx.json(q)}::jsonb),amount_cents=${q.total},pricing_source='manual' where id=${a.service_id}`;
      await queueFormalNotification(tx,id,'fee_update','fee:'+id+':'+(a.version+1),{quote:q});
    }
    if(body.action==='status'){
      if(body.status==='needs_information'&&body.message.length<3)throw new AppError('message_required');
      if(body.status==='processing'&&(a.payment_status!=='paid'||!(await tx`select id from (${formalFiles(tx)}) f where application_id=${id} and kind='document' and state='ready'`).length))throw new AppError('payment_and_documents_required',409);
      await tx`update ${coreTable(tx,'aet_service_detail')} set customer_message=${body.message},result=null where id=${a.service_id}`;
    }
    if(body.action==='release'){
      const [f]=await tx`select * from (${formalFiles(tx)}) f where id=${body.fileId} and application_id=${id} and kind='report' and state='ready'`;
      const pending=await tx`select id from (${formalFiles(tx)}) f where application_id=${id} and kind='document' and state='uploading'`;
      const docs=await tx`select id from (${formalFiles(tx)}) f where application_id=${id} and kind='document' and state='ready'`;
      if(a.payment_status!=='paid'||a.status!=='processing'||!f||f.input_version!==a.input_version||pending.length||!docs.length)throw new AppError('report_not_ready',409);
      await tx`update ${coreTable(tx,'aet_service_detail')} set result_version=result_version+1,result=jsonb_build_object('content',null,'documents',${tx.json([{document_id:f.id,storage_rev:f.storage_rev}])}::jsonb,'status','released','released_at',now(),'input_version',input_version,'version',result_version+1),customer_message='' where id=${a.service_id}`;
    }
    await touchFormal(tx,id,body.action==='release'?'completed':body.action==='status'?body.status:undefined);
  });
}
