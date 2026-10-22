import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import postgres from 'postgres';

// Opt-in integration regression: PREEVAL_F3_TEST_PG_BIN=/path/to/postgres/bin
// pnpm exec vitest run tests/preeval-information.test.ts
// Always creates its own disposable cluster, with Unix sockets and no TCP.
// Never reads PREEVAL_DATABASE_URL or connects to an existing database.
const state = vi.hoisted(() => ({ sql: undefined as ReturnType<typeof postgres> | undefined }));
vi.mock('server-only', () => ({}));
vi.mock('../lib/preeval/db', () => ({
  db: () => state.sql!, table: (name: string) => state.sql!(name),
  audit: async (id: string, actor: string, action: string) => {
    await state.sql!`insert into preeval.audit(application_id,actor,action) values (${id},${actor},${action})`;
  },
}));
vi.mock('../lib/preeval/config', () => ({
  configuration: () => ({ origin: 'http://localhost:3022', recipient: 'synthetic@example.invalid' }),
  required: () => { throw new Error('External credentials are forbidden in F3 tests'); },
  requireExternalServices: () => { throw new Error('External services are forbidden in F3 tests'); },
}));
vi.mock('../lib/preeval/dropbox', () => ({
  filePath: async (_app: unknown, _kind: string, id: string, name: string) => `/synthetic/${id}/${name}`,
  uploadFile: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../lib/legacy-application/store', () => ({ saveLegacyPreeval: vi.fn() }));
vi.mock('../lib/preeval/ai-documents', () => ({
  documentManifest: async () => [], loadDocuments: async () => [],
  manifestHash: (manifest: unknown) => JSON.stringify(manifest),
}));
import { addFile, application, staffAction } from '../lib/preeval/service';
import { completeUploads, dueAIJobs, finishDocumentUpload, pauseForUpload, retryAnalysis, startDocumentUpload } from '../lib/preeval/ai-jobs';
import { processAI, type AIDependencies } from '../lib/preeval/ai';
import { publishIfReady } from '../lib/preeval/payments';
import { applicationEmail, renderQueuedEmail } from '../lib/preeval/email';
import { AIError } from '../lib/preeval/ai-contract';

const pgBin = process.env.PREEVAL_F3_TEST_PG_BIN;
describe.skipIf(!pgBin)('F3 information request/resubmission (isolated PostgreSQL)', () => {
  let directory: string;
  let started = false;
  let id: string;
  const sql = () => state.sql!;
  const row = async () => (await sql()`select * from preeval.applications where id=${id}`)[0];
  const request = () => staffAction(id, { action: 'information', message: 'Please upload the missing transcript.' }, 'synthetic-staff');
  const file = () => new File(['%PDF-1.7\nSynthetic transcript'], 'transcript.pdf', { type: 'application/pdf' });
  const generated = {
    analysis: { result: 'Synthetic updated degree', reasoning: 'Synthetic assessment for state transition tests.', basis: 'form_only' as const,
      facts: { institution: null, country: null, qualification: null, start: null, completion: null }, issues: [], evidence: [] },
    pageMap: [], model: 'synthetic-model', responseId: 'synthetic-response', usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 },
  };
  const analyze = vi.fn<AIDependencies['analyze']>();
  const process = () => processAI(id, {
    configured: () => ({ model: 'synthetic-model', apiKey: 'unused' }), analyze,
  });
  beforeAll(async () => {
    directory = mkdtempSync(join(tmpdir(), 'aet-f3-'));
    execFileSync(join(pgBin!, 'initdb'), ['-D', join(directory, 'data'), '-U', 'f3_test', '-A', 'trust', '--locale=C', '--encoding=UTF8'], { timeout: 30000, stdio: 'pipe' });
    execFileSync(join(pgBin!, 'pg_ctl'), ['-D', join(directory, 'data'), '-l', join(directory, 'postgres.log'), '-o', `-F -k ${directory} -h '' -p 55439`, '-w', 'start'], { timeout: 30000, stdio: 'pipe' });
    started = true;
    state.sql = postgres({ host: directory, port: 55439, database: 'postgres', username: 'f3_test', max: 5, onnotice: () => {} });
    await sql().unsafe('create role anon; create role authenticated;');
    for (const name of ['20261002000100_pre_evaluation.sql', '20261020165103_email_delivery_records.sql', '20261020232924_preeval_gpt_analysis.sql']) {
      await sql().unsafe(readFileSync(new URL(`../supabase/migrations/${name}`, import.meta.url), 'utf8'));
    }
    // Empty legacy tables exercise the existing fallback to preeval education.
    await sql().unsafe('create table public.aet_core_applications(id uuid); create table public.aet_core_educations(id uuid, application_id uuid);');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network calls are forbidden in F3 tests')));
  }, 60000);
  afterAll(async () => {
    vi.unstubAllGlobals();
    await state.sql?.end({ timeout: 1 });
    if (started) execFileSync(join(pgBin!, 'pg_ctl'), ['-D', join(directory, 'data'), '-m', 'immediate', '-w', 'stop'], { timeout: 10000, stdio: 'pipe' });
    if (directory) rmSync(directory, { recursive: true, force: true });
  });
  beforeEach(async () => {
    analyze.mockReset().mockResolvedValue(generated);
    const [app] = await sql()`insert into preeval.applications(request_id,request_hash,email,first_name,last_name,country,locale,
      status,payment_status,ai_status,ai_pipeline,result,result_version)
      values (${randomUUID()},'synthetic','synthetic@example.invalid','Synthetic','Applicant','US','en',
      'completed','paid','completed','openai',${sql().json({ result: 'Old degree', reasoning: 'Old synthetic assessment.' })},1) returning id`;
    id = app.id;
    await sql()`insert into preeval.educations(application_id,school_name,country_of_study,degree_obtained,start_date,end_date)
      values (${id},'Synthetic University','US','Degree','2018-09','2022-06')`;
  });

  it('runs staff request -> customer upload -> completion -> analysis -> one new paid result/email', async () => {
    await applicationEmail(await row(), 'result');
    const [oldMail] = await sql()`select * from preeval.emails where application_id=${id} and kind='result'`;
    await request();
    expect(await row()).toMatchObject({ status: 'needs_information', ai_status: 'idle', result: null, input_version: 2, payment_status: 'paid' });
    expect(await dueAIJobs(1, id)).toEqual([]);
    await expect(renderQueuedEmail(oldMail)).rejects.toThrow('result_superseded_or_withheld');
    const [info] = await sql()`select * from preeval.emails where application_id=${id} and kind='information'`;
    const rendered = await renderQueuedEmail(info);
    expect(rendered.html).toContain('Please upload the missing transcript.');
    expect(rendered.html).toContain('Review Request');
    expect(rendered.html).toContain(`applicationId=${id}`);
    await addFile(id, file(), 'synthetic-customer');
    expect(await row()).toMatchObject({ status: 'processing', uploads_pending: true, ai_status: 'idle', result: null, ai_active_run: null });
    expect((await application(id)).result).toBeNull();
    expect(await process()).toBe(false);
    await completeUploads(id);
    const queued = await row();
    expect(queued).toMatchObject({ status: 'processing', uploads_pending: false, ai_status: 'queued', result: null });
    await completeUploads(id);
    expect((await row()).input_version).toBe(queued.input_version);
    expect(await dueAIJobs(1, id)).toEqual([id]);
    expect(await process()).toBe(true);
    expect(await row()).toMatchObject({ status: 'completed', payment_status: 'paid', ai_status: 'completed', result_version: 2 });
    expect((await application(id)).result).toEqual({ result: generated.analysis.result, reasoning: generated.analysis.reasoning });
    await completeUploads(id);
    expect(await process()).toBe(false);
    await publishIfReady(id); await publishIfReady(id);
    expect(analyze).toHaveBeenCalledTimes(1);
    expect(await sql()`select id from preeval.ai_runs where application_id=${id}`).toHaveLength(1);
    expect(await sql()`select id from preeval.emails where application_id=${id} and kind='information'`).toHaveLength(1);
    expect(await sql()`select id from preeval.emails where application_id=${id} and kind='result' and result_version=2`).toHaveLength(1);
    await expect(renderQueuedEmail(oldMail)).rejects.toThrow('result_superseded_or_withheld');
  });

  it('resumes a shared-uploader batch requested before upload starts', async () => {
    await request();
    const attempt = await startDocumentUpload(id, 'transcript');
    await expect(completeUploads(id)).rejects.toThrow('uploads_incomplete');
    await finishDocumentUpload(id, attempt, true, { name: 'transcript.pdf', path: `/synthetic/${id}/shared.pdf`, size: 50, contentHash: id });
    await completeUploads(id);
    expect(await process()).toBe(true);
    expect((await row()).status).toBe('completed');
  });

  it('resumes when staff requests information while a customer batch is already pending', async () => {
    await addFile(id, file(), 'synthetic-customer');
    await request();
    expect(await row()).toMatchObject({ status: 'needs_information', uploads_pending: true });
    await completeUploads(id);
    expect(await row()).toMatchObject({ status: 'processing', uploads_pending: false, ai_status: 'queued' });
    expect(await process()).toBe(true);
  });

  it('requires new files from the customer, but permits an explicit staff retry with existing/form-only input', async () => {
    await request();
    await expect(completeUploads(id)).rejects.toThrow('application_unavailable');
    await expect(retryAnalysis(id)).rejects.toThrow('ai_retry_unavailable');
    expect(await process()).toBe(false);
    await staffAction(id, { action: 'retry_ai' }, 'synthetic-staff');
    expect(await row()).toMatchObject({ status: 'processing', ai_status: 'queued', uploads_pending: false });
    expect(await process()).toBe(true);
    expect(await sql()`select id from preeval.audit where application_id=${id} and action='ai.retry_requested'`).toHaveLength(1);
  });

  it('rejects an empty batch even when submission already set uploads_pending', async () => {
    await sql()`update preeval.applications set uploads_pending=true where id=${id}`;
    await request();
    await expect(completeUploads(id)).rejects.toThrow('uploads_incomplete');
    await expect(retryAnalysis(id, true)).rejects.toThrow('ai_retry_unavailable');
    expect(await process()).toBe(false);
    expect(await row()).toMatchObject({ status: 'needs_information', uploads_pending: true, ai_status: 'idle' });
  });

  it('does not treat re-uploading an already ready identical file as new information', async () => {
    await addFile(id, file(), 'synthetic-customer'); await completeUploads(id); await process();
    await request();
    await addFile(id, file(), 'synthetic-customer');
    await expect(completeUploads(id)).rejects.toThrow('application_unavailable');
    expect((await row()).status).toBe('needs_information');
  });

  it.each(['files', 'document_uploads'] as const)('blocks unfinished %s, even if the pending flag is inconsistent', async table => {
    await request();
    const attempt = await startDocumentUpload(id, 'transcript');
    if (table === 'files') {
      await finishDocumentUpload(id, attempt, true, { name: 't.pdf', path: `/synthetic/${id}/t.pdf`, size: 50, contentHash: id });
      await sql()`update preeval.files set state='failed' where application_id=${id}`;
    }
    await expect(completeUploads(id)).rejects.toThrow('uploads_incomplete');
    await expect(retryAnalysis(id, true)).rejects.toThrow('ai_retry_unavailable');
    expect(await process()).toBe(false);
    await sql()`update preeval.applications set uploads_pending=false where id=${id}`;
    await expect(retryAnalysis(id, true)).rejects.toThrow('ai_retry_unavailable');
    expect(analyze).not.toHaveBeenCalled();
  });

  it('blocks cancelled uploads, completion, customer/staff retries and information requests', async () => {
    await sql()`update preeval.applications set status='cancelled' where id=${id}`;
    const before = await row();
    await expect(addFile(id, file(), 'synthetic-customer')).rejects.toThrow('application_cancelled');
    await expect(pauseForUpload(id)).rejects.toThrow('application_unavailable');
    await expect(startDocumentUpload(id, 'transcript')).rejects.toThrow('application_unavailable');
    await expect(completeUploads(id)).rejects.toThrow('application_unavailable');
    await expect(retryAnalysis(id)).rejects.toThrow('ai_retry_unavailable');
    await expect(retryAnalysis(id, true)).rejects.toThrow('ai_retry_unavailable');
    await expect(request()).rejects.toThrow('application_cancelled');
    expect(await row()).toEqual(before);
    expect(await process()).toBe(false);
  });

  it.each(['unpaid', 'pending', 'refunded', 'partially_refunded'])('preserves %s and withholds regenerated results and result mail', async payment => {
    await sql()`update preeval.applications set payment_status=${payment} where id=${id}`;
    await request(); await addFile(id, file(), 'synthetic-customer'); await completeUploads(id); await process();
    expect(await row()).toMatchObject({ payment_status: payment, status: 'processing', ai_status: 'completed', result_version: 2 });
    expect((await application(id)).result).toBeNull();
    expect(await sql()`select id from preeval.emails where application_id=${id} and kind='result'`).toHaveLength(0);
  });

  it.each([false, true])('fences an old running analysis after request and resume (provider failure=%s)', async fail => {
    await retryAnalysis(id, true);
    let release!: () => void;
    let entered!: () => void;
    const waiting = new Promise<void>(resolve => { entered = resolve; });
    analyze.mockImplementationOnce(async () => {
      entered(); await new Promise<void>(resolve => { release = resolve; });
      if (fail) throw new AIError('ai_provider_failed', true);
      return generated;
    });
    const oldRun = process();
    await waiting;
    try {
      await request();
      expect(await row()).toMatchObject({ ai_status: 'idle', ai_active_run: null, ai_locked_at: null, result: null });
      await addFile(id, file(), 'synthetic-customer'); await completeUploads(id);
    } finally { release(); }
    await oldRun;
    expect(await row()).toMatchObject({ ai_status: 'queued', result: null, result_version: 1 });
    expect(await sql()`select state from preeval.ai_runs where application_id=${id}`).toEqual([{ state: 'superseded' }]);
    expect(await sql()`select id from preeval.emails where application_id=${id} and kind='result'`).toHaveLength(0);
    expect(await process()).toBe(true);
    expect((await row()).result_version).toBe(2);
  });
});
