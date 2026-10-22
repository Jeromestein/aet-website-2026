import { CHUNK_SIZE, validateFile } from '../dropbox/shared';
import { contentHash, base64 } from '../dropbox/upload-client';
import { MAX_FILE_BYTES } from './domain';

type UploadReply = { uploadKey?: string; offset?: number; complete?: boolean };
type Api = (path: string, body: unknown) => Promise<UploadReply>;
export function validateDocuments(files: File[]) {
  if (!files.length || files.length > 5) throw new Error('file_limit');
  for (const file of files) {
    if (!file.size || file.size > MAX_FILE_BYTES || !['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) throw new Error('invalid_file');
    try { validateFile(file.name, file.size, file.type); }
    catch { throw new Error('invalid_file'); }
  }
}
/** Both customer entry points use bounded requests, including small files.
 * Only replay append/finish: the server fences offsets and committed file IDs. */
export async function uploadDocuments(id: string, files: File[], api: Api) {
  validateDocuments(files);
  const endpoint = `applications/${id}/file-upload`;
  const signal = new AbortController().signal;
  async function retry(body: object) {
    for (let attempt = 0; ; attempt++) {
      try { return await api(endpoint, body); }
      catch (error) {
        if (attempt === 2 || !['upload_failed', 'service_unavailable', 'upstream', 'Failed to fetch', 'fetch failed'].includes((error as Error).message)) throw error;
      }
    }
  }
  for (const file of files) {
    let key: string | undefined;
    let finishing = false;
    try {
      const started = await api(endpoint, { action: 'start', fileName: file.name, fileSize: file.size, mime: file.type, contentHash: await contentHash(file, signal) });
      if (started.complete) continue;
      key = started.uploadKey;
      for (let offset = 0; offset < file.size; offset += CHUNK_SIZE) {
        const next = await retry({ action: 'append', uploadKey: key, chunkIndex: Math.floor(offset / CHUNK_SIZE), chunkData: await base64(file.slice(offset, offset + CHUNK_SIZE)) });
        key = next.uploadKey;
      }
      finishing = true;
      await retry({ action: 'finish', uploadKey: key });
    } catch (error) {
      // A lost finish response may mean the file is already saved. A subsequent
      // start resolves that by content hash; never cancel a possible commit.
      if (key && !finishing) await api(endpoint, { action: 'cancel', uploadKey: key }).catch(() => {});
      throw error;
    }
  }
  await api(`applications/${id}/uploads-complete`, {});
}
