import 'server-only';
import { resolveStorage } from './storage';
import { applicationFolder, initialStorage, type DocumentIdentity } from './paths';
import { createCipheriv, createDecipheriv, createHash, hkdfSync, randomBytes } from 'node:crypto';
import { Dropbox, type files } from 'dropbox';
import { accountForOffice, CHUNK_SIZE, DocumentError, HASH_BLOCK_SIZE, safeSegment, validateFile, type Account, type ApplicationKind, type FileEntry, type FilePage, type Office } from './shared';

export type ApplicationContext = DocumentIdentity;
type UploadContext = {
  application: ApplicationContext; sessionId: string; fileName: string; mime: string;
  size: number; offset: number; contentHash: string;
};
type Envelope<T> = { purpose: string; expires: number; data: T };
const lifetime = 2 * 60 * 60 * 1000;

export function documentsEnabled() { return process.env.DROPBOX_DOCUMENTS_ENABLED === 'true'; }
export function requireEnabled() {
  if (!documentsEnabled()) throw new DocumentError('unavailable', 503);
}
export function accountConfig(account: Account) {
  const prefix = `DROPBOX_${account}`;
  const config = {
    appKey: process.env[`${prefix}_KEY`], appSecret: process.env[`${prefix}_SECRET`],
    refreshToken: process.env[`${prefix}_REFRESH_TOKEN`], namespaceId: process.env[`${prefix}_NAMESPACE_ID`],
    basePath: account === 'AET_App' ? '/Team Files/WebsitesDev' : '/WebsitesDev',
    laPath: '/Team Files/AET ALL Offices/AET Services/2-Foreign Credential Evaluation',
  };
  if (!config.appKey || !config.appSecret || !config.refreshToken || !config.namespaceId) throw new DocumentError('unavailable', 503);
  return config as typeof config & { appKey: string; appSecret: string; refreshToken: string; namespaceId: string };
}
function contextKey(account: Account) {
  const { appSecret, appKey } = accountConfig(account);
  return Buffer.from(hkdfSync('sha256', appSecret, appKey, 'aet-website-2026:documents:v1', 32));
}
// Encrypted, authenticated context replaces process-local upload state. No OAuth
// token or raw Dropbox session ID is disclosed, and each purpose has its own AAD.
export function seal<T>(account: Account, purpose: string, data: T, expires = Date.now() + lifetime) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', contextKey(account), iv);
  cipher.setAAD(Buffer.from(`${account}:${purpose}`));
  const encrypted = Buffer.concat([cipher.update(JSON.stringify({ purpose, expires, data })), cipher.final()]);
  return `${account}.${Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64url')}`;
}
export function unseal<T>(token: unknown, purpose: string): Envelope<T> & { account: Account } {
  if (typeof token !== 'string' || token.length > 16000) throw new DocumentError('access', 401);
  const parts = token.split('.');
  if (parts.length !== 2 || !['AET_App', 'AET_App_East'].includes(parts[0]) || !/^[\w-]+$/.test(parts[1])) throw new DocumentError('access', 401);
  const account = parts[0] as Account;
  const key = contextKey(account);
  let result: Envelope<T>;
  try {
    const bytes = Buffer.from(parts[1], 'base64url');
    const decipher = createDecipheriv('aes-256-gcm', key, bytes.subarray(0, 12));
    decipher.setAAD(Buffer.from(`${account}:${purpose}`));
    decipher.setAuthTag(bytes.subarray(12, 28));
    result = JSON.parse(Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString());
  } catch { throw new DocumentError('access', 401); }
  if (result.purpose !== purpose || !Number.isFinite(result.expires)) throw new DocumentError('access', 401);
  if (result.expires < Date.now()) throw new DocumentError('expired', 401);
  return { ...result, account };
}
export function contextFromRequest(request: Request) {
  requireEnabled();
  const header = request.headers.get('authorization') ?? '';
  if (!header.startsWith('Bearer ')) throw new DocumentError('access', 401);
  const envelope = unseal<ApplicationContext>(header.slice(7), 'access');
  if (accountForOffice(envelope.data.office) !== envelope.account) throw new DocumentError('access', 401);
  return envelope;
}
export function requireUploadAllowed(context: ApplicationContext) {
  if (context.canUpload === false) throw new DocumentError('readOnly', 403);
}
export const folderPath = applicationFolder;
export function laFolderPath(context: ApplicationContext) {
  return initialStorage(context).archivePath;
}
// This cache is an optimization only. A cold instance can always refresh.
const tokenCache = new Map<Account, { token: string; until: number; fingerprint: string }>();
const refreshing = new Map<Account, Promise<string>>();
export async function accessToken(account: Account): Promise<string> {
  const config = accountConfig(account);
  const fingerprint = createHash('sha256').update(`${config.appKey}:${config.refreshToken}`).digest('hex');
  const cached = tokenCache.get(account);
  if (cached && cached.until > Date.now() && cached.fingerprint === fingerprint) return cached.token;
  const pending = refreshing.get(account);
  if (pending) return pending;
  const refresh = (async () => {
    try {
      const response = await fetch('https://api.dropbox.com/oauth2/token', {
        method: 'POST', body: new URLSearchParams({
          grant_type: 'refresh_token', refresh_token: config.refreshToken,
          client_id: config.appKey, client_secret: config.appSecret,
        }), cache: 'no-store', signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new DocumentError('unavailable', 503);
      const data = await response.json();
      if (typeof data.access_token !== 'string' || !Number.isFinite(data.expires_in)) throw new DocumentError('unavailable', 503);
      tokenCache.set(account, { token: data.access_token, until: Date.now() + Math.max(0, data.expires_in - 60) * 1000, fingerprint });
      return data.access_token as string;
    } catch { throw new DocumentError('unavailable', 503); }
  })();
  refreshing.set(account, refresh);
  try { return await refresh; } finally { refreshing.delete(account); }
}
export async function clientForOffice(office: Office) {
  const account = accountForOffice(office);
  const config = accountConfig(account);
  return new Dropbox({
    accessToken: await accessToken(account),
    pathRoot: JSON.stringify({ '.tag': 'namespace_id', namespace_id: config.namespaceId }),
    fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
      const response = await fetch(input, { ...init, cache: 'no-store', signal: AbortSignal.timeout(25000) });
      // The legacy SDK expects node-fetch's buffer() for downloads. Native
      // Node/Next fetch exposes arrayBuffer() instead.
      return Object.assign(response, { buffer: async () => Buffer.from(await response.arrayBuffer()) });
    },
  });
}
export function errorSummary(error: unknown): string {
  return (error as { error?: { error_summary?: string } })?.error?.error_summary ?? '';
}
function correctOffset(error: unknown) {
  const data = (error as { error?: { error?: { correct_offset?: number; lookup_failed?: { correct_offset?: number } } } })?.error?.error;
  return data?.correct_offset ?? data?.lookup_failed?.correct_offset;
}
export function dropboxHash(bytes: Buffer) {
  const hash = createHash('sha256');
  for (let offset = 0; offset < bytes.length; offset += HASH_BLOCK_SIZE) hash.update(createHash('sha256').update(bytes.subarray(offset, offset + HASH_BLOCK_SIZE)).digest());
  return hash.digest('hex');
}
function checkHeader(name: string, bytes: Buffer) {
  const extension = name.split('.').pop()!.toLowerCase();
  const valid = extension === 'pdf' ? bytes.subarray(0, 1024).includes(Buffer.from('%PDF-'))
    : extension === 'png' ? bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))
    : extension === 'jpg' || extension === 'jpeg' ? bytes.subarray(0, 3).equals(Buffer.from('ffd8ff', 'hex'))
    : extension === 'doc' ? bytes.subarray(0, 8).equals(Buffer.from('d0cf11e0a1b11ae1', 'hex'))
    : extension === 'docx' && bytes.subarray(0, 4).equals(Buffer.from('504b0304', 'hex'));
  if (!valid) throw new DocumentError('fileType', 415);
}
function fileEntry(file: files.FileMetadata): FileEntry {
  return { id: file.id, name: file.name, size: file.size, uploadedAt: file.server_modified, pathDisplay: file.path_display ?? '' };
}
async function finishResult(dbx: Dropbox, context: ApplicationContext, file: files.FileMetadata) {
  let archive: 'not-required' | 'saved' | 'failed' = 'not-required';
  const storage = await resolveStorage(context);
  if (storage.archivePath) {
    try {
      await dbx.filesCopyV2({ from_path: file.id, to_path: `${storage.archivePath}/${file.name}`, autorename: true });
      archive = 'saved';
    } catch { archive = 'failed'; }
  }
  return { success: true, file: fileEntry(file), archive };
}
export async function uploadSmall(context: ApplicationContext, file: File) {
  validateFile(file.name, file.size, file.type);
  if (file.size > CHUNK_SIZE) throw new DocumentError('tooLarge', 413);
  const bytes = Buffer.from(await file.arrayBuffer());
  checkHeader(file.name, bytes);
  const storage = await resolveStorage(context);
  const dbx = await clientForOffice(storage.write.office);
  let result;
  try {
    result = await dbx.filesUpload({
      path: `${storage.write.path}/${file.name}`, contents: bytes,
      mode: { '.tag': 'add' }, autorename: true, content_hash: dropboxHash(bytes),
    });
  } catch { throw new DocumentError('uncertain', 502); }
  return finishResult(dbx, context, result.result);
}
export async function startUpload(context: ApplicationContext, data: Record<string, unknown>, expires: number) {
  const { fileName, fileSize, mime, contentHash } = data;
  if (typeof fileName !== 'string' || typeof fileSize !== 'number' || typeof mime !== 'string' ||
    typeof contentHash !== 'string' || !/^[a-f0-9]{64}$/.test(contentHash)) throw new DocumentError('invalid');
  validateFile(fileName, fileSize, mime);
  if (fileSize <= CHUNK_SIZE) throw new DocumentError('invalid');
  const storage = await resolveStorage(context);
  const dbx = await clientForOffice(storage.write.office);
  const session = await dbx.filesUploadSessionStart({ close: false, contents: Buffer.alloc(0) });
  const upload: UploadContext = { application: context, sessionId: session.result.session_id, fileName, size: fileSize, mime, offset: 0, contentHash };
  return { success: true, uploadKey: seal(accountForOffice(context.office), 'upload', upload, expires), offset: 0 };
}
export async function continueUpload(context: ApplicationContext, data: Record<string, unknown>) {
  const envelope = unseal<UploadContext>(data.uploadKey, 'upload');
  const upload = envelope.data;
  if (JSON.stringify(upload.application) !== JSON.stringify(context)) throw new DocumentError('access', 403);
  if (!['append', 'finish', 'cancel'].includes(String(data.action))) throw new DocumentError('invalid');
  const storage = await resolveStorage(context);
  const dbx = await clientForOffice(storage.write.office);
  const cursor = { session_id: upload.sessionId, offset: upload.offset };
  if (data.action === 'cancel') {
    // Closing without a finish never commits a file. Cancellation may race with
    // the preceding append, so use Dropbox's acknowledged offset once if needed.
    try { await dbx.filesUploadSessionAppendV2({ cursor, close: true, contents: Buffer.alloc(0) }); }
    catch (error) {
      const offset = correctOffset(error);
      if (Number.isSafeInteger(offset)) await dbx.filesUploadSessionAppendV2({ cursor: { ...cursor, offset: offset! }, close: true, contents: Buffer.alloc(0) });
      else if (!/closed|not_found/.test(errorSummary(error))) throw error;
    }
    return { success: true };
  }
  if (data.action === 'append') {
    if (data.chunkIndex !== Math.floor(upload.offset / CHUNK_SIZE) || typeof data.chunkData !== 'string' ||
      data.chunkData.length > CHUNK_SIZE * 4 / 3) throw new DocumentError('sequence', 409);
    const bytes = Buffer.from(data.chunkData, 'base64');
    if (bytes.toString('base64') !== data.chunkData ||
      bytes.length !== Math.min(CHUNK_SIZE, upload.size - upload.offset) || !bytes.length) throw new DocumentError('sequence', 409);
    if (upload.offset === 0) checkHeader(upload.fileName, bytes);
    const nextOffset = upload.offset + bytes.length;
    try { await dbx.filesUploadSessionAppendV2({ cursor, close: false, contents: bytes, content_hash: dropboxHash(bytes) }); }
    catch (error) {
      // A retry after a lost response must not append the bytes twice.
      // The final full-file hash also rejects a replay with different bytes.
      if (correctOffset(error) !== nextOffset) throw error;
    }
    return { success: true, offset: nextOffset, uploadKey: seal(envelope.account, 'upload', { ...upload, offset: nextOffset }, envelope.expires) };
  }
  if (data.action !== 'finish' || upload.offset !== upload.size) throw new DocumentError('sequence', 409);
  let result;
  try {
    result = await dbx.filesUploadSessionFinish({
      cursor, contents: Buffer.alloc(0),
      commit: { path: `${storage.write.path}/${upload.fileName}`, mode: { '.tag': 'add' }, autorename: true },
    });
  } catch { throw new DocumentError('uncertain', 502); }
  if (result.result.size !== upload.size || result.result.content_hash !== upload.contentHash) {
    // Dropbox can return an existing identical file. Never auto-delete the
    // returned ID; a failed client-supplied hash must not erase prior uploads.
    // Leave it for review, report an integrity error and skip the LA copy.
    throw new DocumentError('integrity', 422);
  }
  return finishResult(dbx, context, result.result);
}
export async function listFiles(context: ApplicationContext, cursor?: string | null): Promise<FilePage> {
  const storage = await resolveStorage(context);
  const binding = JSON.stringify({ id: context.id, kind: context.kind, reads: storage.reads });
  let index = 0, upstream: string | null = null;
  if (cursor) {
    const saved = unseal<{ binding: string; index: number; cursor: string | null }>(cursor, 'cursor');
    if (saved.account !== accountForOffice(context.office) || saved.data.binding !== binding ||
        !Number.isInteger(saved.data.index) || saved.data.index < 0 || saved.data.index >= storage.reads.length) throw new DocumentError('access', 403);
    index = saved.data.index; upstream = saved.data.cursor;
  }
  while (index < storage.reads.length) {
    const location = storage.reads[index];
    const dbx = await clientForOffice(location.office);
    let result;
    try {
      result = (upstream ? await dbx.filesListFolderContinue({ cursor: upstream })
        : await dbx.filesListFolder({ path: location.path, limit: 100 })).result;
    } catch (error) {
      if (!upstream && errorSummary(error).startsWith('path/not_found')) { index++; continue; }
      throw error;
    }
    const next = result.has_more ? { binding, index, cursor: result.cursor }
      : index + 1 < storage.reads.length ? { binding, index: index + 1, cursor: null } : null;
    return { files: result.entries.filter((entry): entry is files.FileMetadataReference => entry['.tag'] === 'file').map(fileEntry),
      nextCursor: next ? seal(accountForOffice(context.office), 'cursor', next) : null };
  }
  return { files: [], nextCursor: null };
}
/** Download only an ID discovered in this application's authorized folders. */
export async function readDocument(context: ApplicationContext, fileId: string): Promise<Buffer> {
  const storage = await resolveStorage(context);
  let cursor: string | null = null;
  do {
    const page = await listFiles(context, cursor);
    const file = page.files.find(file => file.id === fileId);
    if (file) {
      if (file.size > 50 * 1024 * 1024) throw new DocumentError('tooLarge', 413);
      const location = storage.reads.find(location => file.pathDisplay.slice(0, file.pathDisplay.lastIndexOf('/')).toLowerCase() === location.path.toLowerCase());
      if (!location) throw new DocumentError('access', 403);
      const dbx = await clientForOffice(location.office);
      const result = await dbx.filesDownload({ path: file.id });
      return Buffer.from((result.result as files.FileMetadata & { fileBinary: Buffer }).fileBinary);
    }
    cursor = page.nextCursor;
  } while (cursor);
  throw new DocumentError('access', 403);
}
export async function readDiplomaImage(context: ApplicationContext): Promise<string | null> {
  if (context.kind !== 'pre-evaluation') throw new DocumentError('invalid');
  let cursor: string | null = null;
  do {
    const page = await listFiles(context, cursor);
    const image = page.files.find(file => /\.(png|jpe?g|gif|bmp|webp)$/i.test(file.name));
    if (image) return (await readDocument(context, image.id)).toString('base64');
    cursor = page.nextCursor;
  } while (cursor);
  return null;
}
