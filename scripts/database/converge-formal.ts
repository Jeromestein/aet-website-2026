/** Transform formal records only inside a disposable restored Preview copy.
 * The hosted importer consumes the reconciled artifact, never this source reader. */
import type { Sql } from 'postgres';
import { randomUUID } from 'node:crypto';
import { fromLegacyFormal } from '../../lib/legacy-application/mapping';
import { insertFormal } from '../../lib/application-core/formal-store';
import { coreTable } from '../../lib/application-core/connection';
type Row=Record<string,any>;
export async function convergeFormal(sql:Sql,files:Row[],providerAccount:string){
  const [identity]=await sql`select session_user as owner,inet_server_addr() as address`;
  if(identity.owner!=='core_rehearsal'||identity.address!==null)throw Error('Disposable restored copy required');
  return sql.begin(async tx=>{
    const applications=await tx`select *,created_at::text as created_at,updated_at::text as updated_at from aet_preview_evaluation.applications order by id`;
    if((await tx`select id from ${coreTable(tx,'aet_core_applications')} where primary_service='evaluation'`).length)throw Error('Formal target must be empty');
    const ids=[];
    for(const a of applications){
      const [legacy]=await tx`select * from aet_preview_legacy.fce_applications where id=${a.id}`;
      if(!legacy)throw Error('Missing formal legacy record');
      const educations=await tx`select * from aet_preview_legacy.fce_educations where application_id=${a.id} order by array_position(${legacy.service_type.websiteQuote?.educationIds||[]}::text[],id::text),id`;
      const data=fromLegacyFormal(legacy,educations,a.data);
      if(!legacy.date_of_birth)data.evaluee.birth='';
      let quote=a.quote;
      if(legacy.service_type.websiteQuote?.version===1){const {version,educationIds,...saved}=legacy.service_type.websiteQuote;quote=saved;}
      const [confirmation]=await tx`select * from aet_preview_evaluation.intake_emails where application_id=${a.id}`;
      const notifications:Row={};
      if(confirmation)notifications.confirmation={...confirmation,kind:'confirmation',key:'intake:'+a.id,available_at:confirmation.available_at==='infinity'?null:confirmation.available_at};
      const emails=await tx`select * from aet_preview_evaluation.emails where application_id=${a.id} order by created_at`;
      for(const e of emails){if(e.state!=='sent')throw Error('Unsettled formal email requires reconciliation');notifications[e.kind]={...e,key:e.dedupe_key};}
      await insertFormal(tx,{...a,data,quote,educations,notification_state:notifications,snapshot:{data:a.data,quote:a.quote}});
      const legacyFiles=await tx`select * from aet_preview_evaluation.files where application_id=${a.id}`;
      for(const f of legacyFiles)if(f.state==='ready'&&!files.some(m=>m.applicationId===a.id&&m.legacyFileId===f.id))throw Error('Ready formal file lacks provider evidence');
      for(const m of files.filter(m=>m.applicationId===a.id)){
        if(!m.fileId?.startsWith('id:')||!m.revision)throw Error('Verified File ID required');
        const f=legacyFiles.find(f=>f.id===m.legacyFileId);
        await tx`insert into ${coreTable(tx,'aet_documents')}(id,application_id,storage_location,storage_file_id,storage_rev,storage_content_hash,storage_path,original_filename,mime_type,size_bytes,access_scope,upload_state,upload_context)
          values(${f?.id||randomUUID()},${a.id},${m.storageLocation},${m.fileId},${m.revision},${m.contentHash||null},${m.path},${m.name},${f?.mime_type||null},${m.size},${f?.kind==='report'?'staff_only':'customer_input'},'ready',${tx.json({sha256:f?.sha256||null,input_version:f?.input_version||0})})`;
      }
      for(const p of await tx`select *,created_at::text as created_at,updated_at::text as updated_at,paid_at::text as paid_at from aet_preview_evaluation.payments where application_id=${a.id}`){
        await tx`insert into ${coreTable(tx,'aet_payments')}(id,application_id,amount_cents,currency,refunded_cents,payment_status,provider,provider_account,provider_mode,checkout_session_id,payment_intent_id,source,paid_at,created_at,updated_at)
          values(${p.id},${a.id},${p.amount_cents},${p.currency.toUpperCase()},${p.refunded_cents},${p.status},'stripe',${providerAccount},'test',${p.session_id},${p.payment_intent},'formal-evaluation',${p.paid_at},${p.created_at},${p.updated_at})`;
      }
      if(a.released_file_id){
        const [f]=await tx`select * from ${coreTable(tx,'aet_documents')} where id=${a.released_file_id} and application_id=${a.id} and access_scope='staff_only' and upload_state='ready'`;
        if(!f)throw Error('Released report lacks verified File ID');
        await tx`update ${coreTable(tx,'aet_service_detail')} set result_version=1,result=${tx.json({content:null,documents:[{document_id:f.id,storage_rev:f.storage_rev}],status:'released',released_at:a.updated_at,input_version:a.input_version,version:1})} where application_id=${a.id} and service_type='evaluation'`;
      }
      ids.push(a.id);
    }
    return ids;
  });
}
