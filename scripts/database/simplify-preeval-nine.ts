import type { Sql, JSONValue } from 'postgres';
import { createHash } from 'node:crypto';
import { assertRehearsalDatabase } from './preeval-backfill';

/** Local-only second-stage retirement. Archive evidence is returned to the caller,
 * never copied into another runtime table. No provider calls or hosted flag. */
export async function simplifyPreevaluationNine(sql: Sql) {
  return sql.begin('isolation level serializable', async tx => {
    await assertRehearsalDatabase(tx);
    const expected=['aet_core_applications','aet_education','aet_service_detail','aet_documents','aet_payments',
      'aet_uploads','aet_ai_runs','aet_emails','aet_payment_events','aet_access_tokens','aet_sessions','aet_audit','aet_rate_limits'].sort();
    const names=(await tx`select tablename from pg_tables where schemaname='aet' order by tablename`).map(r=>r.tablename);
    if(JSON.stringify(names)!==JSON.stringify(expected))throw new Error('Expected reconciled thirteen-table source');
    for(const name of expected)await tx`lock table ${tx('aet.'+name)} in access exclusive mode`;
    if((await tx`select id from aet.aet_uploads where state='uploading'`).length ||
       (await tx`select id from aet.aet_ai_runs where state='running' or lease is not null`).length ||
       (await tx`select id from aet.aet_emails where state='sending' or lease is not null`).length)
      throw new Error('Uploads, AI and mail must be quiescent');
    // Token-only URLs cannot be resolved after removal. Abort while any can still
    // be consumed; application-ID links themselves never expire in the target.
    if((await tx`select hash from aet.aet_access_tokens where consumed_at is null and expires_at>now()`).length)
      throw new Error('Active legacy links require compatibility reconciliation');
    if((await tx`select id from aet.aet_service_detail where service_type<>'pre-evaluation'`).length)
      throw new Error('Only reconciled pre-evaluation services are supported');
    const archive:Record<string,JSONValue[]>={};
    for(const name of ['aet_uploads','aet_emails','aet_access_tokens','aet_sessions'])
      archive[name]=(await tx`select to_jsonb(t) value from ${tx('aet.'+name)} t order by to_jsonb(t)::text`).map(r=>r.value);
    await tx.unsafe(`alter table aet.aet_documents alter storage_location drop not null, alter storage_file_id drop not null,
      alter storage_rev drop not null;
      alter table aet.aet_documents add column upload_state text not null default 'ready'
        check(upload_state in ('uploading','ready','failed')),
        add column upload_version integer not null default 1 check(upload_version>0),
        add column upload_context jsonb not null default '{}';
      alter table aet.aet_documents add constraint ready_file_identity check(upload_state<>'ready' or
        (storage_location is not null and storage_file_id is not null and storage_rev is not null));
      create unique index aet_document_upload_key on aet.aet_documents(application_id,(upload_context->>'key'));
      alter table aet.aet_service_detail add column result_version integer not null default 0 check(result_version>=0),
        add column notification_state jsonb not null default '{}' check(jsonb_typeof(notification_state)='object');`);
    const [guard]=await tx`select pg_get_functiondef('aet.protect_reference_identity()'::regprocedure) definition`;
    const oldCheck='if new.storage_location is distinct from old.storage_location or new.storage_file_id is distinct from old.storage_file_id then';
    if(!guard.definition.includes(oldCheck))throw new Error('Unexpected file identity guard');
    await tx.unsafe(guard.definition.replace(oldCheck,
      'if old.storage_file_id is not null and (new.storage_location is distinct from old.storage_location or new.storage_file_id is distinct from old.storage_file_id) then'));
    for(const f of await tx`select *,created_at::text created_text from aet.aet_uploads order by id`){
      const [d]=await tx`select * from aet.aet_documents where id=${f.id}`;
      if(d && (d.application_id!==f.application_id||f.state!=='ready'))throw new Error('Document/upload identity conflict');
      if(f.state==='ready'&&!d)throw new Error('Ready upload missing canonical File ID');
      const context={key:f.file_key || f.sha256 || f.id,source_fingerprint:f.sha256,
        attempt_id:f.attempt_id,started_at:f.created_text};
      if(d)await tx`update aet.aet_documents set upload_context=${tx.json(context)} where id=${f.id}`;
      else await tx`insert into aet.aet_documents(id,application_id,original_filename,mime_type,size_bytes,access_scope,
        storage_path,created_at,upload_state,upload_context)
        values (${f.id},${f.application_id},${f.name||f.file_key||'Unfinished upload'},${f.mime_type},${f.bytes},'customer_input',
          ${f.dropbox_path},${f.created_text}::text::timestamptz,'failed',${tx.json(context)})`;
    }
    for(const s of await tx`select * from aet.aet_service_detail order by id`){
      const [v]=await tx`select coalesce(max((detail->>'version')::int),0) n from aet.aet_audit
        where application_id=${s.application_id} and action='result.saved'`;
      const [request]=await tx`select id::text,detail->>'message' message from aet.aet_audit
        where application_id=${s.application_id} and action='information.requested' order by id desc limit 1`;
      const details={...s.details};
      if(request)details.information_request={id:request.id,message:request.message};
      if(details.payment_exemption){
        const e=details.payment_exemption;
        const proof=await tx`select original.id from aet.aet_audit original join aet.aet_audit confirmed
          on confirmed.id::text=${e.audit_id||''} and confirmed.application_id=original.application_id
          where original.id::text=${e.source_audit_id||''} and original.application_id=${s.application_id}
            and original.actor='synthetic-e2e-test' and original.action='test.payment_fixture'
            and original.detail @> '{"synthetic":true,"noCharge":true}'::jsonb
            and confirmed.actor='migration' and confirmed.action='test.payment_exemption.confirmed'`;
        if(proof.length!==1||s.amount_cents!==0||e.scope!=='synthetic-test')throw new Error('Invalid exemption provenance');
        details.payment_exemption={...e,confirmed:true,reason:'Audited synthetic no-charge test'};
      }
      const state:Record<string,any>={};
      for(const mail of await tx`select * from aet.aet_emails where application_id=${s.application_id} order by created_at,id`){
        if(!['confirmation','result','information','access'].includes(mail.kind))throw new Error('Unsupported notification kind');
        const old=state[mail.kind];
        if(old&&old.state!=='sent')throw new Error('Multiple unsettled notifications need reconciliation');
        state[mail.kind]={id:mail.id,kind:mail.kind,key:mail.dedupe_key,recipient:mail.recipient,state:mail.state,
          result_version:mail.result_version,information_request_id:mail.information_request_id,
          attempts:mail.attempts,provider_id:mail.provider_id,payload_hash:mail.payload_hash,
          first_attempt_at:mail.first_attempt_at,sent_at:mail.sent_at,created_at:mail.created_at,
          available_at:mail.available_at,error:mail.error,lease:null,locked_at:null};
      }
      await tx`update aet.aet_service_detail set result_version=${Math.max(v.n,Number(s.result?.version||0))},
        details=${tx.json(details)},notification_state=${tx.json(state)} where id=${s.id}`;
    }
    if((await tx`select id from aet.aet_emails where application_id is null or not exists
      (select 1 from aet.aet_service_detail s where s.application_id=aet_emails.application_id)` ).length)
      throw new Error('Unmapped notifications');
    await tx.unsafe('drop table aet.aet_uploads; drop table aet.aet_emails; drop table aet.aet_access_tokens; drop table aet.aet_sessions;');
    const tables=(await tx`select tablename from pg_tables where schemaname='aet' order by tablename`).map(r=>r.tablename);
    if(tables.length!==9)throw new Error('Expected exactly nine tables');
    return {tables,archive,archiveDigest:createHash('sha256').update(JSON.stringify(archive)).digest('hex')};
  });
}
