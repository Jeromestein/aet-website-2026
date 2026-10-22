import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
const m = vi.hoisted(() => ({ query: vi.fn(), begin: vi.fn(), authorize: vi.fn(), origin: vi.fn(), limit: vi.fn(), pause: vi.fn(),
  start: vi.fn(), append: vi.fn(), finish: vi.fn(), metadata: vi.fn(), files: [] as any[], cancelled: false, audit: 0 }));
vi.mock('server-only', () => ({}));
vi.mock('../lib/preeval/db', () => ({ db: () => Object.assign(m.query, { begin: m.begin }), table: (name: string) => name }));
vi.mock('../lib/preeval/config', () => ({ configuration: () => ({}) }));
vi.mock('../lib/preeval/auth', () => ({ authorize: m.authorize, sameOrigin: m.origin, limit: m.limit }));
vi.mock('../lib/preeval/ai-jobs', () => ({ pauseForUpload: m.pause }));
vi.mock('../lib/preeval/dropbox', () => ({ filePath: async (_: unknown, __: unknown, id: string, name: string) => `/synthetic/${id}-${name}`, officeForStoredPath: () => 'Miami' }));
vi.mock('../lib/dropbox/server', async original => ({ ...await original<typeof import('../lib/dropbox/server')>(),
  requireEnabled: () => {}, clientForOffice: async () => ({ filesUploadSessionStart: m.start, filesUploadSessionAppendV2: m.append, filesUploadSessionFinish: m.finish, filesGetMetadata: m.metadata }) }));
import { POST } from '../app/api/pre-evaluation/applications/[id]/file-upload/route';
import { uploadDocuments } from '../lib/preeval/upload-client';
import { uploadDocument } from '../lib/preeval/uploads';
import { AppError } from '../lib/preeval/domain';
import { CHUNK_SIZE, HASH_BLOCK_SIZE } from '../lib/dropbox/shared';
import { unseal } from '../lib/dropbox/server';
const id = '10000000-0000-4000-8000-000000000001';
let version = 0;
let sessions: Map<string, Buffer[]>;
let stored: Map<string, any>;
let requests: { path: string; body: any; bytes: number }[];
const hash = (data: Buffer) => {
  const hashes: Buffer[] = [];
  for (let offset = 0; offset < data.length; offset += HASH_BLOCK_SIZE) hashes.push(createHash('sha256').update(data.subarray(offset, offset + HASH_BLOCK_SIZE)).digest());
  return createHash('sha256').update(Buffer.concat(hashes)).digest('hex');
};
function synthetic(size = 1024, type = 'application/pdf', name = 'synthetic.pdf') {
  const bytes = Buffer.alloc(size, 42);
  (type === 'image/png' ? Buffer.from('89504e470d0a1a0a', 'hex') : type === 'image/jpeg' ? Buffer.from('ffd8ff', 'hex') : Buffer.from('%PDF-')).copy(bytes);
  return new File([bytes], name, { type });
}
async function api(path: string, body: any) {
  const raw = JSON.stringify(body);
  requests.push({ path, body, bytes: Buffer.byteLength(raw) });
  if (path.endsWith('uploads-complete')) {
    if (m.files.some(file => file.state !== 'ready')) throw new Error('uploads_incomplete');
    return {};
  }
  const response = await POST(new Request(`http://localhost:3022/api/pre-evaluation/${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:3022' }, body: raw,
  }), { params: Promise.resolve({ id }) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error);
  return result;
}
const start = (extra = {}) => uploadDocument(id, { action: 'start', fileName: 'synthetic.pdf', fileSize: 1024, mime: 'application/pdf', contentHash: 'a'.repeat(64), ...extra }, 'test@example.invalid');
beforeEach(() => {
  vi.resetAllMocks(); version = 0; m.files = []; m.cancelled = false; m.audit = 0; sessions = new Map(); stored = new Map(); requests = [];
  process.env.DROPBOX_AET_App_KEY = 'synthetic'; process.env.DROPBOX_AET_App_SECRET = 'synthetic';
  process.env.DROPBOX_AET_App_REFRESH_TOKEN = 'synthetic'; process.env.DROPBOX_AET_App_NAMESPACE_ID = 'synthetic';
  m.authorize.mockResolvedValue({ email: 'test@example.invalid' });
  const query = async (strings: TemplateStringsArray, ...v: any[]) => {
    const sql = strings.join('?');
    if (sql.includes('from ? where id=? for update') && v[0] === 'preeval.applications') return [{ id, status: m.cancelled ? 'cancelled' : 'processing', created_at: new Date() }];
    if (sql.startsWith('select id,status')) return [{ id, status: m.cancelled ? 'cancelled' : 'processing' }];
    if (sql.includes('sha256=?') && sql.startsWith('select')) return m.files.filter(f => f.sha256 === v[2]);
    if (sql.startsWith('select id from') && v[0] === 'preeval.files') return m.files;
    if (sql.startsWith('insert into') && v[0] === 'preeval.files') {
      let row = m.files.find(f => f.sha256 === v[6]);
      const stamp = new Date(Date.now() + ++version).toISOString();
      if (!row) { row = { id: v[1], application_id: v[2], name: v[3], mime_type: v[4], bytes: v[5], sha256: v[6], dropbox_path: v[7] }; m.files.push(row); }
      Object.assign(row, { state: 'uploading', created_at: stamp, version: stamp }); return [{ ...row }];
    }
    if (sql.startsWith('select * from')) return m.files.filter(f => f.id === v[1] && f.application_id === v[2] && f.version === v[3]);
    if (sql.startsWith('update')) { const row = m.files.find(f => f.id === v[1]); if (row && (!v[2] || row.version === v[2])) row.state = sql.includes("state='ready'") ? 'ready' : 'failed'; return []; }
    if (sql.startsWith('insert into') && v[0] === 'preeval.audit') { m.audit++; return []; }
    throw new Error(`Unexpected SQL ${sql}`);
  };
  m.query.mockImplementation(query);
  let transaction = Promise.resolve();
  m.begin.mockImplementation((fn: any) => { const result = transaction.then(() => fn(Object.assign(query, { json: (x: any) => x }))); transaction = result.catch(() => {}); return result; });
  m.start.mockImplementation(async () => { const session_id = String(sessions.size); sessions.set(session_id, []); return { result: { session_id } }; });
  m.append.mockImplementation(async ({ cursor, contents }: any) => {
    const parts = sessions.get(cursor.session_id)!; const offset = parts.reduce((sum, part) => sum + part.length, 0);
    if (cursor.offset !== offset) throw { error: { error: { correct_offset: offset } } };
    parts.push(contents); return {};
  });
  m.finish.mockImplementation(async ({ cursor, commit }: any) => {
    const parts = sessions.get(cursor.session_id); if (!parts) throw new Error('closed');
    const bytes = Buffer.concat(parts); const result = { '.tag': 'file', size: bytes.length, content_hash: hash(bytes), path_display: commit.path };
    stored.set(commit.path, result); sessions.delete(cursor.session_id); return { result };
  });
  m.metadata.mockImplementation(async ({ path }: any) => { if (!stored.has(path)) throw new Error('not_found'); return { result: stored.get(path) }; });
});
describe('customer chunked transport with mocked Dropbox and SQL', () => {
  it.each([
    [6 * 1024 * 1024 + 17, 'application/pdf', 'synthetic.pdf'],
    [20 * 1024 * 1024 - 1, 'image/jpeg', 'synthetic.jpg'],
    [20 * 1024 * 1024, 'image/png', 'synthetic.png'],
    [1024, 'application/pdf', 'small.pdf'],
  ])('preserves all %i bytes of %s below the platform request cap', async (size, type, name) => {
    const file = synthetic(size as number, type as string, name as string);
    await uploadDocuments(id, [file], api);
    expect(requests.every(r => r.bytes < 4_500_000)).toBe(true);
    expect(m.append).toHaveBeenCalledTimes(Math.ceil(file.size / CHUNK_SIZE));
    expect(m.files).toHaveLength(1); expect(m.files[0]).toMatchObject({ name, bytes: size, state: 'ready' });
    expect([...stored.values()][0].content_hash).toBe(hash(Buffer.from(await file.arrayBuffer())));
    expect(requests.filter(r => r.path.endsWith('uploads-complete'))).toHaveLength(1);
    expect(m.audit).toBe(1);
  }, 30000);
  it('completes a PDF/JPEG/PNG batch only once, after all files are ready', async () => {
    await uploadDocuments(id, [synthetic(), synthetic(1025, 'image/jpeg', 'x.jpg'), synthetic(1026, 'image/png', 'x.png')], api);
    expect(m.files.every(f => f.state === 'ready')).toBe(true);
    expect(requests.at(-1)?.path).toMatch(/uploads-complete$/);
    expect(requests.filter(r => r.path.endsWith('uploads-complete'))).toHaveLength(1);
  });
  it('replays an append whose acknowledgement was lost without duplicate bytes', async () => {
    const append = m.append.getMockImplementation()!;
    m.append.mockImplementationOnce(async args => { await append(args); throw new Error('lost response'); });
    await uploadDocuments(id, [synthetic(CHUNK_SIZE + 50)], api);
    expect(m.append).toHaveBeenCalledTimes(3); expect(m.files[0].state).toBe('ready');
  });
  it('recovers a committed finish with a lost provider response', async () => {
    const finish = m.finish.getMockImplementation()!;
    m.finish.mockImplementationOnce(async args => { await finish(args); throw new Error('lost response'); });
    await uploadDocuments(id, [synthetic()], api);
    expect(m.metadata).toHaveBeenCalledOnce(); expect(m.audit).toBe(1); expect(stored.size).toBe(1);
  });
  it('retries a lost HTTP finish acknowledgement and repeated selection without another file', async () => {
    let lost = false;
    const transport = async (path: string, body: any) => { const result = await api(path, body); if (body.action === 'finish' && !lost) { lost = true; throw new Error('Failed to fetch'); } return result; };
    await uploadDocuments(id, [synthetic()], transport);
    await uploadDocuments(id, [synthetic()], api);
    expect(m.start).toHaveBeenCalledOnce(); expect(m.finish).toHaveBeenCalledOnce(); expect(m.audit).toBe(1); expect(m.files).toHaveLength(1);
  });
  it('keeps an interrupted batch pending and permits retry of the same file slot', async () => {
    m.append.mockRejectedValueOnce(new Error('offline')).mockRejectedValueOnce(new Error('offline')).mockRejectedValueOnce(new Error('offline'));
    await expect(uploadDocuments(id, [synthetic()], api)).rejects.toThrow('upload_failed');
    expect(m.files[0].state).toBe('failed'); expect(requests.some(r => r.path.endsWith('uploads-complete'))).toBe(false);
    await uploadDocuments(id, [synthetic()], api);
    expect(m.files).toHaveLength(1); expect(m.files[0].state).toBe('ready');
  });
  it('does not reupload successful files after a batch completion failure', async () => {
    const transport = async (path: string, body: any) => { if (path.endsWith('uploads-complete')) throw new Error('service_unavailable'); return api(path, body); };
    await expect(uploadDocuments(id, [synthetic()], transport)).rejects.toThrow();
    await uploadDocuments(id, [synthetic()], api);
    expect(m.finish).toHaveBeenCalledOnce(); expect(m.audit).toBe(1);
  });
  it.each([[], Array.from({ length: 6 }, () => synthetic()), [synthetic(20 * 1024 * 1024 + 1)], [synthetic(0)], [synthetic(10, 'text/plain', 'bad.txt')]].map(files => [files]))('rejects invalid selections before any network write', async files => {
    await expect(uploadDocuments(id, files as File[], api)).rejects.toThrow(); expect(requests).toHaveLength(0);
  });
  it('enforces the server quota, including concurrent reservations, and duplicate protection', async () => {
    for (let i = 0; i < 4; i++) await start({ contentHash: String(i).repeat(64) });
    const result = await Promise.allSettled([start({ contentHash: '4'.repeat(64) }), start({ contentHash: '5'.repeat(64) })]);
    expect(result.map(r => r.status)).toEqual(['fulfilled', 'rejected']); expect(m.files).toHaveLength(5);
    await expect(start({ contentHash: '4'.repeat(64) })).rejects.toMatchObject({ code: 'upload_in_progress' });
  });
  it.each([{ fileSize: 20 * 1024 * 1024 + 1 }, { fileSize: 0 }, { mime: 'application/msword', fileName: 'bad.doc' }, { fileName: '../bad.pdf' }])('rejects invalid metadata on the server %j', async metadata => {
    await expect(start(metadata)).rejects.toThrow(); expect(m.files).toHaveLength(0); expect(m.start).not.toHaveBeenCalled();
  });
  it('rejects forged content, mismatched upload identity and stale attempts', async () => {
    const begun = await start();
    await expect(uploadDocument('other', { action: 'append', uploadKey: begun.uploadKey }, '')).rejects.toMatchObject({ code: 'access_denied' });
    await expect(uploadDocument(id, { action: 'append', uploadKey: begun.uploadKey, chunkIndex: 0, chunkData: Buffer.alloc(1024).toString('base64') }, '')).rejects.toMatchObject({ code: 'invalid_file' });
    m.files[0].version = 'replacement';
    await expect(uploadDocument(id, { action: 'finish', uploadKey: begun.uploadKey }, '')).rejects.toMatchObject({ code: 'upload_expired' });
    expect(m.finish).not.toHaveBeenCalled();
  });
  it('does not complete a file with a false hash', async () => {
    const transport = (path: string, body: any) => api(path, body.action === 'start' ? { ...body, contentHash: 'a'.repeat(64) } : body);
    await expect(uploadDocuments(id, [synthetic()], transport)).rejects.toThrow('upload_failed');
    expect(m.files[0].state).toBe('uploading'); expect(m.audit).toBe(0);
    expect(requests.some(r => r.path.endsWith('uploads-complete'))).toBe(false);
  });
  it('rechecks authorization and cancellation for every chunk', async () => {
    const begun = await start();
    m.authorize.mockRejectedValue(new AppError('access_denied', 401));
    await expect(api(`applications/${id}/file-upload`, { action: 'finish', uploadKey: begun.uploadKey })).rejects.toThrow('access_denied');
    m.cancelled = true;
    await expect(uploadDocument(id, { action: 'finish', uploadKey: begun.uploadKey }, '')).rejects.toMatchObject({ code: 'application_cancelled' });
    expect(m.finish).not.toHaveBeenCalled();
  });
  it('caps request bodies before dispatch and rejects cross-origin requests', async () => {
    await expect(api(`applications/${id}/file-upload`, { action: 'append', chunkData: 'a'.repeat(4 * 1024 * 1024 + 32768) })).rejects.toThrow('tooLarge');
    m.origin.mockImplementation(() => { throw new AppError('access_denied', 403); });
    await expect(api(`applications/${id}/file-upload`, { action: 'start' })).rejects.toThrow('access_denied');
    expect(m.start).not.toHaveBeenCalled();
  });
  it('seals the provider session instead of returning credentials or a caller-selected path', async () => {
    const begun = await start();
    expect(begun.uploadKey).not.toContain('/synthetic/');
    expect(unseal<any>(begun.uploadKey, 'preeval-file-upload').data.id).toBe(id);
    await expect(uploadDocument(id, { action: 'finish', uploadKey: begun.uploadKey + 'x' }, '')).rejects.toThrow();
  });
});
