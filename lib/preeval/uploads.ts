import 'server-only';
import { randomUUID } from 'node:crypto';
import { clientForOffice, dropboxHash, seal, unseal, requireEnabled } from '../dropbox/server';
import { CHUNK_SIZE, validateFile, accountForOffice } from '../dropbox/shared';
import { db, table } from './db';
import { AppError, MAX_FILE_BYTES, validFile } from './domain';
import { filePath, officeForStoredPath } from './dropbox';
import { pauseForUpload } from './ai-jobs';

type Upload = { id: string; fileId: string; version: string; session: string; offset: number; size: number; mime: string; hash: string; path: string };
const purpose = 'preeval-file-upload';
const lifetime = 2 * 60 * 60 * 1000;
const staleAfter = 15 * 60 * 1000;
function offsetOf(error: unknown) {
  const detail = (error as { error?: { error?: { correct_offset?: number; lookup_failed?: { correct_offset?: number } } } })?.error?.error;
  return detail?.correct_offset ?? detail?.lookup_failed?.correct_offset;
}

/** Reuse the shared Dropbox session, hash and sealed-capability protocol, while
 * retaining the preview application's file quota, index and session authorization.
 * Each file slot is reserved under the application lock before provider writes. */
export async function uploadDocument(id: string, data: Record<string, unknown>, actor: string) {
  requireEnabled();
  if (data.action === 'start') {
    const { fileName, fileSize, mime, contentHash } = data;
    if (typeof fileName !== 'string' || typeof fileSize !== 'number' || typeof mime !== 'string' ||
      !['application/pdf', 'image/jpeg', 'image/png'].includes(mime) || fileSize > MAX_FILE_BYTES ||
      typeof contentHash !== 'string' || !/^[a-f0-9]{64}$/.test(contentHash)) throw new AppError('invalid_file');
    validateFile(fileName, fileSize, mime);
    const record = await db().begin(async tx => {
      const [app] = await tx`select * from ${table('preeval.applications')} where id=${id} for update`;
      if (!app || app.status === 'cancelled') throw new AppError('application_cancelled', 409);
      const [existing] = await tx`select *,created_at::text as version from ${table('preeval.files')} where application_id=${id} and sha256=${'dropbox:' + contentHash}`;
      if (existing?.state === 'ready') return existing;
      if (existing?.state === 'uploading' && Date.now() - new Date(existing.created_at).getTime() < staleAfter) throw new AppError('upload_in_progress', 409);
      if (!existing && (await tx`select id from ${table('preeval.files')} where application_id=${id}`).length >= 5) throw new AppError('file_limit');
      await pauseForUpload(id, tx);
      const fileId = existing?.id || randomUUID();
      const path = existing?.dropbox_path || await filePath({ ...app, created_at: new Date(app.created_at).toISOString() }, 'pre-evaluation', fileId, fileName, false, tx);
      const [row] = await tx`insert into ${table('preeval.files')}(id,application_id,name,mime_type,bytes,sha256,dropbox_path)
        values (${fileId},${id},${fileName},${mime},${fileSize},${'dropbox:' + contentHash},${path})
        on conflict(application_id,sha256) do update set state='uploading',created_at=clock_timestamp() returning *,created_at::text as version`;
      return row;
    });
    if (record.state === 'ready') return { complete: true };
    try {
      const office = officeForStoredPath(record.dropbox_path);
      const dbx = await clientForOffice(office);
      const session = await dbx.filesUploadSessionStart({ close: false, contents: Buffer.alloc(0) });
      const upload: Upload = { id, fileId: record.id, version: record.version, session: session.result.session_id,
        offset: 0, size: fileSize, mime, hash: contentHash, path: record.dropbox_path };
      return { uploadKey: seal(accountForOffice(office), purpose, upload, Date.now() + lifetime), offset: 0 };
    } catch {
      await db()`update ${table('preeval.files')} set state='failed' where id=${record.id} and created_at=${record.version}::text::timestamptz and state='uploading'`;
      throw new AppError('upload_failed', 502);
    }
  }
  const envelope = unseal<Upload>(data.uploadKey, purpose), upload = envelope.data;
  if (upload.id !== id) throw new AppError('access_denied', 403);
  if (!['append', 'finish', 'cancel'].includes(String(data.action))) throw new AppError('invalid_request');
  // Lock in the same order as start/complete. A replacement attempt cannot race
  // an old finish into a new index/result. Bind timestamp text before casting
  // in PostgreSQL; the driver timestamp serializer truncates microseconds.
  return db().begin(async tx => {
    const [app] = await tx`select id,status from ${table('preeval.applications')} where id=${id} for update`;
    if (!app || app.status === 'cancelled') throw new AppError('application_cancelled', 409);
    const [file] = await tx`select * from ${table('preeval.files')} where id=${upload.fileId} and application_id=${id} and created_at=${upload.version}::text::timestamptz for update`;
    if (!file || file.state === 'failed') throw new AppError('upload_expired', 409);
    if (file.state === 'ready') {
      if (data.action === 'finish') return { complete: true };
      throw new AppError('upload_expired', 409);
    }
    const office = officeForStoredPath(upload.path);
    if (envelope.account !== accountForOffice(office)) throw new AppError('access_denied', 403);
    const cursor = { session_id: upload.session, offset: upload.offset };
    if (data.action === 'cancel') {
      // An uncommitted Dropbox session expires automatically. Fence it locally
      // even if the provider is unavailable, so an explicit retry can start now.
      await tx`update ${table('preeval.files')} set state='failed' where id=${file.id}`;
      return { complete: false };
    }
    const dbx = await clientForOffice(office);
    if (data.action === 'append') {
      if (data.chunkIndex !== Math.floor(upload.offset / CHUNK_SIZE) || typeof data.chunkData !== 'string' || data.chunkData.length > CHUNK_SIZE * 4 / 3) throw new AppError('invalid_request');
      const bytes = Buffer.from(data.chunkData, 'base64');
      if (!bytes.length || bytes.toString('base64') !== data.chunkData || bytes.length !== Math.min(CHUNK_SIZE, upload.size - upload.offset)) throw new AppError('invalid_request');
      if (!upload.offset && !validFile(bytes, upload.mime)) throw new AppError('invalid_file');
      const offset = upload.offset + bytes.length;
      try { await dbx.filesUploadSessionAppendV2({ cursor, close: false, contents: bytes, content_hash: dropboxHash(bytes) }); }
      catch (error) { if (offsetOf(error) !== offset) throw new AppError('upload_failed', 502); }
      return { offset, uploadKey: seal(envelope.account, purpose, { ...upload, offset }, envelope.expires) };
    }
    if (upload.offset !== upload.size) throw new AppError('invalid_request');
    let saved;
    try {
      saved = (await dbx.filesUploadSessionFinish({ cursor, contents: Buffer.alloc(0),
        commit: { path: upload.path, mode: { '.tag': 'overwrite' }, autorename: false, mute: true } })).result;
    } catch {
      // Finishing may have succeeded before a response was lost. The stable,
      // reserved path plus hash makes recovery safe without another file copy.
      try { saved = (await dbx.filesGetMetadata({ path: upload.path })).result; }
      catch { throw new AppError('upload_failed', 502); }
    }
    if (!('size' in saved) || saved.size !== upload.size || saved.content_hash !== upload.hash) throw new AppError('upload_failed', 502);
    await tx`update ${table('preeval.files')} set state='ready' where id=${file.id}`;
    await tx`insert into ${table('preeval.audit')}(application_id,actor,action,detail) values (${id},${actor},'file.uploaded',${tx.json({ fileId: file.id })})`;
    return { complete: true };
  });
}
