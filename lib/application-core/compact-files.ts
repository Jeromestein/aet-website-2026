import { coreTable } from './connection';
import 'server-only';
import type { Sql, TransactionSql } from 'postgres';
import { db, type Row } from '../preeval/db';
import { nineTableMode } from './convergence-mode';
import { AppError } from '../preeval/domain';
export const compact = () => nineTableMode(db());
type DB=Sql|TransactionSql;
/** An API projection, not a compatibility table or second file index. */
export const compactFileRecords=(sql:DB)=>sql`select id,application_id,original_filename as name,mime_type,size_bytes::int as bytes,
  upload_state as state,upload_version::text as version,coalesce((upload_context->>'started_at')::timestamptz,created_at) as created_at,
  storage_path as dropbox_path,upload_context->>'source_fingerprint' as sha256,
  upload_context->>'key' as file_key,upload_context->>'attempt_id' as attempt_id
  from ${coreTable(sql,'aet_documents')} where access_scope='customer_input'`;
export async function reserveCompactFile(sql:DB,f:Row) {
  const context={key:f.key||f.digest||f.id,source_fingerprint:f.digest||null,attempt_id:f.attempt||null,started_at:new Date().toISOString()};
  const [row]=await sql`insert into ${coreTable(sql,'aet_documents')}(id,application_id,original_filename,mime_type,size_bytes,access_scope,
    storage_path,upload_state,upload_context) values (${f.id},${f.applicationId},${f.name},${f.mime||null},${f.size??null},
    'customer_input',${f.path||null},'uploading',${sql.json(context)})
    on conflict(id) do update set upload_state='uploading',upload_version=aet_documents.upload_version+1,
      upload_context=excluded.upload_context,storage_path=excluded.storage_path,updated_at=now()
      where aet_documents.application_id=excluded.application_id and aet_documents.upload_state<>'ready'
    returning id`;
  if(!row)throw new AppError('file_already_uploaded',409);
  return (await sql`select * from (${compactFileRecords(sql)}) f where id=${row.id}`)[0];
}
export async function settleCompactFile(sql:DB,id:string,version:string,state:'failed'|'ready') {
  return sql`update ${coreTable(sql,'aet_documents')} set upload_state=${state},updated_at=now(),
    upload_context=case when ${state}='ready' then upload_context-'attempt_id' else upload_context end
    where id=${id} and upload_version::text=${version} and upload_state='uploading' returning id`;
}
export async function saveCompactMetadata(sql:DB,f:Row,m:Row) {
  const rows=await sql`update ${coreTable(sql,'aet_documents')} set storage_location=${m.storageLocation},storage_file_id=${m.id},
    storage_path=${m.path_display||f.dropbox_path},storage_rev=${m.rev},storage_content_hash=${m.content_hash||null},
    original_filename=${f.name},mime_type=${f.mime_type},size_bytes=${f.bytes},updated_at=now()
    where id=${f.id} and application_id=${f.application_id} and access_scope='customer_input' returning id`;
  if(!rows.length)throw new Error('Missing reserved document');
}
