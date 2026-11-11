import { coreTable } from '../application-core/connection';
import { sixTableMode } from '../application-core/convergence-mode';
import { compact } from '../application-core/compact-files';
import { converged,recoveryConverged } from "../application-core/converged-store";
import { workflowRows } from "../application-core/converged-store";
import 'server-only';
import { z } from 'zod';
import { db, table } from './db';
import { AppError } from './domain';
import { pauseForUpload } from './ai-jobs';

export type UnfinishedUpload = { source: 'file' | 'document'; id: string; version: string; name: string; state: string };
export type UploadRecovery = { uploads: UnfinishedUpload[]; pending: boolean; hasReady: boolean; canModify: boolean };
const selection = z.discriminatedUnion('source', [
  z.object({ source: z.literal('file'), id: z.uuid(), version: z.string().min(1).max(64) }),
  z.object({ source: z.literal('document'), id: z.uuid(), version: z.uuid() }),
]);

/** Read both transports so interrupted uploads remain recoverable after reload.
 * Keep PostgreSQL timestamp precision: JS Date would weaken attempt fencing. */
export async function unfinishedUploads(id: string): Promise<UploadRecovery> {
  if (converged()) return await recoveryConverged(id) as UploadRecovery;
  const [app] = await workflowRows(db(), id, false);
  if (!app) return { uploads: [], pending: false, hasReady: false, canModify: false };
  const uploads = await db()`select 'file' as source,id::text,created_at::text as version,name,state
    from ${table('preeval.files')} where application_id=${id} and state<>'ready'
    union all select 'document',attempt_id::text,attempt_id::text,file_key,state
    from ${table('preeval.document_uploads')} where application_id=${id} and state<>'ready'`;
  const ready = await db()`select id from ${table('preeval.files')} where application_id=${id} and state='ready' limit 1`;
  return { uploads: uploads as unknown as UnfinishedUpload[], pending: app.uploads_pending,
    hasReady: !!ready.length, canModify: app.status !== 'cancelled' };
}

/** Delete only an explicitly selected, unfinished attempt under the application
 * lock. No new schema/state is needed, including the restricted preview role.
 * Ready rows, foreign attempts and newer retries are never deleted.
 * Provider sessions expire naturally; saved provider files are never removed. */
export async function abandonUpload(id: string, data: unknown, actor: string) {
  const parsed = selection.safeParse(data);
  if (!parsed.success) throw new AppError('invalid_request');
  const upload = parsed.data;
  if (converged() && upload.source !== "file") throw new AppError("upload_expired",409);
  return db().begin(async tx => {
    const [app] = await workflowRows(tx, id, true);
    if (!app || app.status === 'cancelled') throw new AppError('application_unavailable', 409);
    const removed = compact() ? await tx`delete from ${coreTable(tx,'aet_documents')} where application_id=${id} and id=${upload.id} and upload_version::text=${upload.version} and upload_state<>'ready' and storage_file_id is null returning id` : upload.source === 'file'
      ? await tx`delete from ${table('preeval.files')} where application_id=${id} and id=${upload.id}
          and created_at::text=${upload.version} and state<>'ready' returning id`
      : await tx`delete from ${table('preeval.document_uploads')} where application_id=${id}
          and attempt_id=${upload.id} and attempt_id::text=${upload.version} and state<>'ready' returning attempt_id`;
    if (!removed.length) throw new AppError('upload_expired', 409);
    await pauseForUpload(id, tx);
    if(!sixTableMode(db())) await tx`insert into ${table('preeval.audit')}(application_id,actor,action,detail)
      values (${id},${actor},'upload.abandoned',${tx.json(upload)})`;
    return { removed: true };
  });
}
