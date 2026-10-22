import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import postgres from 'postgres';

// Real application functions and PostgreSQL transactions; only the connection,
// Dropbox SDK, storage lookup and OAuth transport are replaced. No .env is read.
const m = vi.hoisted(() => ({ sql: undefined as unknown as ReturnType<typeof postgres>,
  finish: vi.fn(), upload: vi.fn(), append: vi.fn(), copy: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('../lib/preeval/db', () => ({ db: () => m.sql, table: (name: string) => m.sql(name) }));
vi.mock('../lib/dropbox/storage', () => ({ resolveStorage: async () => ({
  write: { office: 'Miami', path: '/synthetic' }, reads: [], archivePath: '/synthetic-archive',
}) }));
vi.mock('dropbox', () => ({ Dropbox: class {
  filesUploadSessionFinish = m.finish;
  filesUpload = m.upload;
  filesUploadSessionAppendV2 = m.append;
  filesCopyV2 = m.copy;
} }));
import { completeUploads, finishDocumentUpload, startDocumentUpload } from '../lib/preeval/ai-jobs';
import { continueUpload, seal, uploadSmall, type ApplicationContext } from '../lib/dropbox/server';

// Opt in with PREEVAL_F4_TEST_PG_BIN=/path/to/postgres/bin when running this file.
// Ordinary unit-test runs do not require or start a local PostgreSQL server.
const bin = process.env.PREEVAL_F4_TEST_PG_BIN;
const id = '11111111-1111-4111-8111-111111111111';
const context: ApplicationContext = { id, kind: 'pre-evaluation', office: 'Miami',
  fullName: 'Synthetic Applicant', folderKey: id, submittedAt: '2026-10-22' };
const file = (suffix = 'new') => ({ name: 'diploma.pdf', path: `/synthetic/${suffix}.pdf`, size: 100, contentHash: suffix });
const metadata = { id: 'id:synthetic', name: 'diploma.pdf', size: 100,
  path_display: '/synthetic/new.pdf', content_hash: 'new', rev: 'synthetic', server_modified: '2026-10-22T00:00:00Z' };
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>(done => { resolve = done; });
  return { promise, resolve };
}
function uploadKey(attempt: string | null) {
  return seal('AET_App', 'upload', { application: context, sessionId: 'synthetic-session',
    fileName: 'diploma.pdf', mime: 'application/pdf', size: 100, offset: 100, contentHash: 'new', aiAttempt: attempt });
}

// The optional local binary is the only prerequisite. This always creates its
// own disposable cluster over a private Unix socket, never a configured DB URL.
describe.skipIf(!bin)('upload attempt fencing (isolated PostgreSQL, mocked Dropbox)', () => {
  let root: string;
  let running = false;
  beforeAll(async () => {
    root = mkdtempSync('/tmp/aet-f4-');
    execFileSync(join(bin!, 'initdb'), ['-D', join(root, 'data'), '-U', 'aet_f4_test', '-A', 'trust', '--no-locale', '--encoding=UTF8'], { timeout: 30000, stdio: 'pipe' });
    execFileSync(join(bin!, 'pg_ctl'), ['-D', join(root, 'data'), '-l', join(root, 'postgres.log'),
      '-o', `-k ${root} -h '' -p 55474 -F`, '-w', 'start'], { timeout: 30000, stdio: 'pipe' });
    running = true;
    m.sql = postgres({ path: join(root, '.s.PGSQL.55474'), port: 55474, user: 'aet_f4_test', database: 'postgres', max: 5,
      onnotice: () => {}, connection: { application_name: 'aet-f4-tests', statement_timeout: 5000 } });
    await m.sql.unsafe('create role anon; create role authenticated');
    for (const migration of ['20261002000100_pre_evaluation.sql', '20261020232924_preeval_gpt_analysis.sql']) {
      await m.sql.unsafe(readFileSync(new URL(`../supabase/migrations/${migration}`, import.meta.url), 'utf8'));
    }
  }, 30000);
  afterAll(async () => {
    if (m.sql) await m.sql.end({ timeout: 1 });
    if (running) execFileSync(join(bin!, 'pg_ctl'), ['-D', join(root, 'data'), '-m', 'immediate', '-w', 'stop'], { timeout: 10000, stdio: 'pipe' });
    if (root) rmSync(root, { recursive: true, force: true });
  });
  beforeEach(async () => {
    vi.clearAllMocks();
    for (const key of ['KEY', 'SECRET', 'REFRESH_TOKEN', 'NAMESPACE_ID']) vi.stubEnv(`DROPBOX_AET_App_${key}`, 'synthetic-only');
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ access_token: 'synthetic-token', expires_in: 3600 })));
    m.finish.mockReset().mockResolvedValue({ result: metadata });
    m.upload.mockReset().mockResolvedValue({ result: metadata });
    m.append.mockReset().mockResolvedValue({}); m.copy.mockReset().mockResolvedValue({});
    await m.sql`truncate preeval.applications cascade`;
    await m.sql`insert into preeval.applications(id,request_id,request_hash,email,first_name,last_name,country,locale)
      values (${id},${randomUUID()},'synthetic','test@example.invalid','Test','Applicant','CN','en')`;
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

  async function snapshot() {
    return {
      app: await m.sql`select * from preeval.applications where id=${id}`,
      files: await m.sql`select * from preeval.files order by id`,
      uploads: await m.sql`select * from preeval.document_uploads order by file_key`,
    };
  }
  async function replacement() {
    const old = (await startDocumentUpload(id, 'diploma.pdf'))!;
    await m.sql`update preeval.document_uploads set updated_at=now()-interval '16 minutes' where application_id=${id}`;
    const current = (await startDocumentUpload(id, 'diploma.pdf'))!;
    return { old, current };
  }
  async function publish(source: string) {
    await m.sql`update preeval.applications set result=${m.sql.json({ result: 'New result', source })},
      result_source=${source},result_version=7,status='completed',ai_status='completed',uploads_pending=false where id=${id}`;
  }
  async function waitForBlockedClaim() {
    await vi.waitFor(async () => {
      const rows = await m.sql`select pid from pg_stat_activity where application_name='aet-f4-tests'
        and wait_event_type='Lock' and query like '%for update%'`;
      expect(rows.length).toBeGreaterThan(0);
    }, { timeout: 2000, interval: 10 });
  }

  it('ignores old success and failure while a replacement is uploading', async () => {
    const { old } = await replacement();
    const before = await snapshot();
    await finishDocumentUpload(id, old, true, file('old'));
    await finishDocumentUpload(id, old, false);
    expect(await snapshot()).toEqual(before);
  });
  it.each(['openai', 'staff'])('preserves a newer %s result and files after late callbacks', async source => {
    const { old, current } = await replacement();
    await finishDocumentUpload(id, current, true, file());
    await completeUploads(id); await publish(source);
    const before = await snapshot();
    await finishDocumentUpload(id, old, true, file('old'));
    await finishDocumentUpload(id, old, false);
    await finishDocumentUpload(id, current, true, file('duplicate'));
    await finishDocumentUpload(id, current, false);
    expect(await snapshot()).toEqual(before);
  });
  it('settles two concurrent successful callbacks only once', async () => {
    const attempt = await startDocumentUpload(id, 'diploma.pdf');
    const before = (await snapshot()).app[0].input_version;
    await Promise.all([finishDocumentUpload(id, attempt, true, file()), finishDocumentUpload(id, attempt, true, file('duplicate'))]);
    const after = await snapshot();
    expect(after.files).toHaveLength(1);
    expect(after.app[0].input_version).toBe(before + 1);
    expect(after.uploads[0].state).toBe('ready');
  });
  it('does not revive a failed attempt; a new attempt can retry and finish a batch', async () => {
    const attempt = await startDocumentUpload(id, 'diploma.pdf');
    await finishDocumentUpload(id, attempt, false);
    const failed = await snapshot();
    await finishDocumentUpload(id, attempt, true, file('late'));
    await finishDocumentUpload(id, attempt, false);
    expect(await snapshot()).toEqual(failed);
    const retry = await startDocumentUpload(id, 'diploma.pdf');
    const other = await startDocumentUpload(id, 'transcript.pdf');
    await finishDocumentUpload(id, retry, true, file());
    await expect(completeUploads(id)).rejects.toMatchObject({ code: 'uploads_incomplete' });
    await finishDocumentUpload(id, other, true, { ...file('transcript'), name: 'transcript.pdf' });
    await completeUploads(id);
    const done = await snapshot();
    expect(done.files).toHaveLength(2); expect(done.app[0].uploads_pending).toBe(false);
    expect(done.app[0].ai_status).toBe('queued');
    await finishDocumentUpload(id, attempt, false);
    await finishDocumentUpload(id, retry, true, file());
    expect(await snapshot()).toEqual(done);
  });
  it('rejects an obsolete shared finish before Dropbox commit or archive copy', async () => {
    const { old } = await replacement();
    const before = await snapshot();
    await expect(continueUpload(context, { action: 'finish', uploadKey: uploadKey(old) })).rejects.toMatchObject({ code: 'sequence', status: 409 });
    expect(m.finish).not.toHaveBeenCalled(); expect(m.copy).not.toHaveBeenCalled();
    expect(await snapshot()).toEqual(before);
  });
  it('holds the claim through storage commit and fences a simultaneous finish', async () => {
    const attempt = await startDocumentUpload(id, 'diploma.pdf');
    const entered = deferred(), release = deferred();
    m.finish.mockImplementationOnce(async () => { entered.resolve(); await release.promise; return { result: metadata }; });
    const first = continueUpload(context, { action: 'finish', uploadKey: uploadKey(attempt) });
    await entered.promise;
    const second = continueUpload(context, { action: 'finish', uploadKey: uploadKey(attempt) }).catch(error => error);
    try { await waitForBlockedClaim(); expect(m.finish).toHaveBeenCalledTimes(1); }
    finally { release.resolve(); }
    await expect(first).resolves.toMatchObject({ success: true });
    expect(await second).toMatchObject({ code: 'sequence', status: 409 });
    expect(m.finish).toHaveBeenCalledTimes(1); expect(m.copy).toHaveBeenCalledTimes(1);
    expect((await snapshot()).files).toHaveLength(1);
  });
  it('prevents attempt replacement between validation and storage commit', async () => {
    const attempt = await startDocumentUpload(id, 'diploma.pdf');
    await m.sql`update preeval.document_uploads set updated_at=now()-interval '16 minutes' where application_id=${id}`;
    const entered = deferred(), release = deferred();
    m.finish.mockImplementationOnce(async () => { entered.resolve(); await release.promise; return { result: metadata }; });
    const finish = continueUpload(context, { action: 'finish', uploadKey: uploadKey(attempt) });
    await entered.promise;
    const next = startDocumentUpload(id, 'diploma.pdf');
    try { await waitForBlockedClaim(); }
    finally { release.resolve(); }
    await finish; const current = await next;
    expect(current).not.toBe(attempt);
    const before = await snapshot();
    expect(before.uploads[0]).toMatchObject({ attempt_id: current, state: 'uploading' });
    await finishDocumentUpload(id, attempt, false);
    await finishDocumentUpload(id, attempt, true, file('old'));
    expect(await snapshot()).toEqual(before);
  });
  it('rolls back the claim on storage failure and permits a new upload attempt', async () => {
    const attempt = await startDocumentUpload(id, 'diploma.pdf');
    m.finish.mockRejectedValueOnce(new Error('synthetic outage'));
    await expect(continueUpload(context, { action: 'finish', uploadKey: uploadKey(attempt) })).rejects.toMatchObject({ code: 'uncertain' });
    expect((await snapshot()).uploads[0].state).toBe('failed');
    expect((await snapshot()).files).toHaveLength(0);
    const retry = await startDocumentUpload(id, 'diploma.pdf');
    await expect(continueUpload(context, { action: 'finish', uploadKey: uploadKey(retry) })).resolves.toMatchObject({ success: true });
  });
  it('does not let a failure racing a claimed successful finish downgrade ready', async () => {
    const attempt = await startDocumentUpload(id, 'diploma.pdf');
    const entered = deferred(), release = deferred();
    m.finish.mockImplementationOnce(async () => { entered.resolve(); await release.promise; return { result: metadata }; });
    const success = continueUpload(context, { action: 'finish', uploadKey: uploadKey(attempt) });
    await entered.promise;
    const failure = finishDocumentUpload(id, attempt, false);
    try { await waitForBlockedClaim(); }
    finally { release.resolve(); }
    await Promise.all([success, failure]);
    expect((await snapshot()).uploads[0].state).toBe('ready');
    await completeUploads(id);
    expect((await snapshot()).app[0].ai_status).toBe('queued');
  });
  it('rolls back result changes and attempt settlement if file indexing fails', async () => {
    const attempt = await startDocumentUpload(id, 'diploma.pdf');
    const before = await snapshot();
    await expect(finishDocumentUpload(id, attempt, true, { ...file(), size: 0 })).rejects.toMatchObject({ code: '23514' });
    expect(await snapshot()).toEqual(before);
    await finishDocumentUpload(id, attempt, true, file());
    expect((await snapshot()).uploads[0].state).toBe('ready');
  });
  it('does not commit files for a cancelled application or a foreign attempt', async () => {
    const attempt = await startDocumentUpload(id, 'diploma.pdf');
    await m.sql`update preeval.applications set status='cancelled' where id=${id}`;
    const before = await snapshot();
    await expect(continueUpload(context, { action: 'finish', uploadKey: uploadKey(attempt) })).rejects.toMatchObject({ code: 'sequence' });
    await finishDocumentUpload(randomUUID(), attempt, true, file());
    expect(await snapshot()).toEqual(before); expect(m.finish).not.toHaveBeenCalled();
  });
  it('keeps integrity errors out of the file index and archive', async () => {
    const attempt = await startDocumentUpload(id, 'diploma.pdf');
    m.finish.mockResolvedValueOnce({ result: { ...metadata, content_hash: 'wrong' } });
    await expect(continueUpload(context, { action: 'finish', uploadKey: uploadKey(attempt) })).rejects.toMatchObject({ code: 'integrity' });
    expect((await snapshot()).uploads[0].state).toBe('failed');
    expect((await snapshot()).files).toHaveLength(0); expect(m.copy).not.toHaveBeenCalled();
  });
  it('does not change a newer attempt when an old session is cancelled', async () => {
    const { old } = await replacement(); const before = await snapshot();
    await continueUpload(context, { action: 'cancel', uploadKey: uploadKey(old) });
    expect(await snapshot()).toEqual(before); expect(m.finish).not.toHaveBeenCalled();
  });
  it('keeps normal small uploads and legacy uploads without an AI attempt working', async () => {
    await expect(uploadSmall(context, new File(['%PDF-synthetic'], 'diploma.pdf', { type: 'application/pdf' }))).resolves.toMatchObject({ success: true });
    expect((await snapshot()).uploads[0].state).toBe('ready');
    const before = await snapshot();
    await expect(continueUpload(context, { action: 'finish', uploadKey: uploadKey(null) })).resolves.toMatchObject({ success: true });
    expect(await snapshot()).toEqual(before);
  });
});
