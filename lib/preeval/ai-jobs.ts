import 'server-only';
import { randomUUID } from 'node:crypto';
import { db, table } from './db';
import { AppError } from './domain';
import type { TransactionSql } from 'postgres';
export async function pauseForUpload(id: string, tx?: TransactionSql) {
  const sql = tx || db();
  const rows = await sql`update ${table('preeval.applications')} set uploads_pending=true,input_version=input_version+1,
    ai_pipeline='openai',ai_status='idle',ai_active_run=null,ai_locked_at=null,ai_error=null,ai_attempts=0,
    result=null,status='processing',updated_at=now() where id=${id} and status<>'cancelled' returning id`;
  if (!rows.length) throw new AppError('application_unavailable', 409);
}
export async function completeUploads(id: string) {
  return db().begin(async tx => {
    const [app] = await tx`select * from ${table('preeval.applications')} where id=${id} for update`;
    // A customer must start a supplemental batch; only staff can resume a
    // request without new files. A request made during a batch may finish it.
    if (!app || app.status === 'cancelled' || (app.status === 'needs_information' && !app.uploads_pending)) throw new AppError('application_unavailable', 409);
    if (!app.uploads_pending) return;
    const uploads = await tx`select state from ${table('preeval.files')} where application_id=${id}
      union all select state from ${table('preeval.document_uploads')} where application_id=${id}`;
    if (!uploads.length || uploads.some(upload => upload.state !== 'ready')) throw new AppError('uploads_incomplete', 409);
    await tx`update ${table('preeval.applications')} set uploads_pending=false,ai_status='queued',ai_pipeline='openai',ai_available_at=now(),ai_attempts=0,ai_error=null,
      ai_active_run=null,ai_locked_at=null,input_version=input_version+1,result=null,status='processing',updated_at=now() where id=${id}`;
  });
}
export async function retryAnalysis(id: string, staff = false) {
  const rows = await db()`update ${table('preeval.applications')} set ai_status='queued',ai_pipeline='openai',ai_active_run=null,
    ai_attempts=0,ai_error=null,ai_locked_at=null,ai_available_at=now(),input_version=input_version+1,result=null,status='processing',updated_at=now()
    where id=${id} and not uploads_pending and status<>'cancelled' and (${staff} or (ai_status='failed' and status<>'needs_information'))
    and not exists(select 1 from ${table('preeval.files')} where application_id=${id} and state<>'ready')
    and not exists(select 1 from ${table('preeval.document_uploads')} where application_id=${id} and state<>'ready') returning id`;
  if (!rows.length) throw new AppError('ai_retry_unavailable', 409);
}
/** Shared uploader uses attempt IDs to fence concurrent retries. Legacy-only
 * records and FCE continue storing files without entering the preview AI queue. */
export async function startDocumentUpload(id: string, fileKey: string) {
  return db().begin(async tx => {
    const [app] = await tx`select id from ${table('preeval.applications')} where id=${id} for update`;
    if (!app) return null;
    const [old] = await tx`select * from ${table('preeval.document_uploads')} where application_id=${id} and file_key=${fileKey}`;
    if (old?.state === 'uploading' && Date.now() - new Date(old.updated_at).getTime() < 15 * 60 * 1000) throw new AppError('upload_in_progress', 409);
    await pauseForUpload(id, tx);
    const attempt = randomUUID();
    await tx`insert into ${table('preeval.document_uploads')}(application_id,file_key,attempt_id,state) values (${id},${fileKey},${attempt},'uploading')
      on conflict(application_id,file_key) do update set attempt_id=excluded.attempt_id,state='uploading',updated_at=now()`;
    return attempt;
  });
}
type DocumentUploadFile = { name: string; path: string; size: number; contentHash: string };
export async function finishDocumentUpload(id: string, attempt: string | null, success: boolean,
  savedFile?: DocumentUploadFile | (() => Promise<DocumentUploadFile>)) {
  if (!attempt) return false;
  return db().begin(async tx => {
    // Match startDocumentUpload's lock order. Keep the lock through an optional
    // storage commit so a retry cannot replace the attempt after validation.
    const [app] = await tx`select id,status from ${table('preeval.applications')} where id=${id} for update`;
    if (!app || app.status === 'cancelled') return false;
    const claimed = await tx`update ${table('preeval.document_uploads')} set state=${success ? 'ready' : 'failed'},updated_at=now()
      where application_id=${id} and attempt_id=${attempt} and state='uploading' returning attempt_id`;
    if (!claimed.length) return false;
    if (success && savedFile) {
      // The claim is uncommitted until storage and indexing both succeed. A
      // stale/settled callback never invokes storage or changes application data.
      const file = typeof savedFile === 'function' ? await savedFile() : savedFile;
      // Also index shared-uploader files so customer/staff lists and analysis use
      // the same documents. The saved Dropbox path remains authoritative.
      await pauseForUpload(id, tx);
      const mime = /\.pdf$/i.test(file.name) ? 'application/pdf' : /\.png$/i.test(file.name) ? 'image/png' : 'image/jpeg';
      await tx`insert into ${table('preeval.files')}(id,application_id,name,mime_type,bytes,sha256,dropbox_path,state)
        values (${randomUUID()},${id},${file.name},${mime},${file.size},${'dropbox:'+file.contentHash},${file.path},'ready')
        on conflict do nothing`;
    }
    return true;
  });
}

/** Read-only eligibility check. processAI repeats the check under its atomic claim. */
export async function dueAIJobs(limit = 1, applicationId?: string): Promise<string[]> {
  const count = Math.max(1, Math.min(3, Math.floor(limit) || 1));
  const rows = await db()`select id from ${table('preeval.applications')}
    where ai_pipeline='openai' and not uploads_pending and status not in ('cancelled','needs_information')
    and (${applicationId || null}::uuid is null or id=${applicationId || null}::uuid)
    and ((ai_status='queued' and ai_available_at<=now())
      or (ai_status='running' and ai_locked_at<now()-interval '8 minutes'))
    order by ai_available_at limit ${count}`;
  return rows.map(row => row.id as string);
}
