import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import postgres from 'postgres';
import type Stripe from 'stripe';

// PREEVAL_PUBLICATION_TEST_PG_BIN=/path/to/postgres/bin pnpm exec vitest run tests/preeval-publication.test.ts
// Own disposable cluster, Unix socket only. No .env or existing database access.
const m = vi.hoisted(() => ({ sql: undefined as ReturnType<typeof postgres> | undefined, intent: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('stripe', () => ({ default: class { paymentIntents = { retrieve: m.intent }; } }));
vi.mock('../lib/preeval/db', () => ({
  db: () => m.sql!, table: (name: string) => m.sql!(name),
  audit: async (id: string, actor: string, action: string) => {
    await m.sql!`insert into preeval.audit(application_id,actor,action) values (${id},${actor},${action})`;
  },
}));
vi.mock('../lib/preeval/config', () => ({
  configuration: () => ({ origin: 'http://localhost:3022', recipient: 'synthetic@example.invalid', cloudPreview: true }),
  required: () => 'sk_test_synthetic', requireExternalServices: () => {},
}));
vi.mock('../lib/preeval/dropbox', () => ({ filePath: vi.fn(), uploadFile: vi.fn() }));
vi.mock('../lib/legacy-application/store', () => ({ saveLegacyPreeval: vi.fn() }));
vi.mock('../lib/preeval/ai-documents', () => ({
  documentManifest: async () => [], loadDocuments: async () => [],
  manifestHash: (manifest: unknown) => JSON.stringify(manifest),
}));
import { application, staffAction } from '../lib/preeval/service';
import { dueAIJobs, retryAnalysis, startDocumentUpload } from '../lib/preeval/ai-jobs';
import { processAI, type AIDependencies } from '../lib/preeval/ai';
import { applyCheckout, handleStripeEvent, publishIfReady } from '../lib/preeval/payments';
import { flushEmails, renderQueuedEmail } from '../lib/preeval/email';
import { TOTAL_CENTS } from '../lib/preeval/domain';

const pgBin = process.env.PREEVAL_PUBLICATION_TEST_PG_BIN;
describe.skipIf(!pgBin)('result publication recovery (isolated PostgreSQL)', () => {
  let directory: string, id: string, session: Stripe.Checkout.Session, charge: Stripe.Charge;
  let started = false;
  const sql = () => m.sql!;
  const row = async () => (await sql()`select * from preeval.applications where id=${id}`)[0];
  const mails = () => sql()`select * from preeval.emails where application_id=${id} and kind='result' order by result_version`;
  const generated = {
    analysis: { result: 'Synthetic degree', reasoning: 'Synthetic assessment for publication regression.', basis: 'form_only' as const,
      facts: { institution: null, country: null, qualification: null, start: null, completion: null }, issues: [], evidence: [] },
    pageMap: [], model: 'synthetic-model', responseId: 'synthetic-response', usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 },
  };
  const result = { result: generated.analysis.result, reasoning: generated.analysis.reasoning };
  const corrected = { result: 'Staff corrected degree', reasoning: 'Staff correction supersedes the synthetic AI assessment.' };
  const analyze = vi.fn<AIDependencies['analyze']>();
  const run = () => processAI(id, { configured: () => ({ model: 'synthetic-model', apiKey: 'unused' }), analyze });
  const pay = () => applyCheckout(session, `paid:${id}`, 'checkout.session.completed');
  const refund = (amount: number) => handleStripeEvent({
    id: randomUUID(), type: 'charge.refunded', livemode: false,
    data: { object: { ...charge, amount_refunded: amount } },
  } as Stripe.Event);
  const failPublication = (enabled: boolean) => sql().unsafe(`alter table preeval.applications ${enabled ? 'enable' : 'disable'} trigger fail_publication`);
  const failEnqueue = (enabled: boolean) => sql().unsafe(`alter table preeval.emails ${enabled ? 'enable' : 'disable'} trigger fail_enqueue`);
  async function stranded() {
    await failPublication(true);
    try { expect(await run()).toBe(true); }
    finally { await failPublication(false); }
    expect(await row()).toMatchObject({ status: 'processing', ai_status: 'completed', result, result_version: 1 });
    expect(await mails()).toHaveLength(0);
  }

  beforeAll(async () => {
    directory = mkdtempSync(join(tmpdir(), 'aet-publication-'));
    execFileSync(join(pgBin!, 'initdb'), ['-D', join(directory, 'data'), '-U', 'publication_test', '-A', 'trust', '--locale=C', '--encoding=UTF8'], { timeout: 30000, stdio: 'pipe' });
    execFileSync(join(pgBin!, 'pg_ctl'), ['-D', join(directory, 'data'), '-l', join(directory, 'postgres.log'), '-o', `-F -k ${directory} -h '' -p 55440`, '-w', 'start'], { timeout: 30000, stdio: 'pipe' });
    started = true;
    m.sql = postgres({ host: directory, port: 55440, database: 'postgres', username: 'publication_test', max: 8,
      onnotice: () => {}, connection: { statement_timeout: 5000 } });
    await sql().unsafe('create role anon; create role authenticated;');
    for (const name of ['20261002000100_pre_evaluation.sql', '20261020165103_email_delivery_records.sql', '20261020232924_preeval_gpt_analysis.sql'])
      await sql().unsafe(readFileSync(new URL(`../supabase/migrations/${name}`, import.meta.url), 'utf8'));
    await sql().unsafe(`
      create table public.aet_core_applications(id uuid);
      create table public.aet_core_educations(id uuid, application_id uuid);
      create function preeval.reject_publication() returns trigger language plpgsql as $$
        begin if new.status='completed' then raise exception 'synthetic publication outage'; end if; return new; end $$;
      create trigger fail_publication before update on preeval.applications for each row execute function preeval.reject_publication();
      create function preeval.reject_enqueue() returns trigger language plpgsql as $$
        begin raise exception 'synthetic enqueue outage'; end $$;
      create trigger fail_enqueue before insert on preeval.emails for each row execute function preeval.reject_enqueue();
    `);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network forbidden in publication tests')));
    vi.spyOn(console, 'error').mockImplementation(() => {});
  }, 60000);
  afterAll(async () => {
    vi.unstubAllGlobals(); vi.restoreAllMocks();
    await m.sql?.end({ timeout: 1 });
    if (started) execFileSync(join(pgBin!, 'pg_ctl'), ['-D', join(directory, 'data'), '-m', 'immediate', '-w', 'stop'], { timeout: 10000, stdio: 'pipe' });
    if (directory) rmSync(directory, { recursive: true, force: true });
  });
  beforeEach(async () => {
    await failPublication(false); await failEnqueue(false);
    analyze.mockReset().mockResolvedValue(generated);
    id = randomUUID();
    await sql()`insert into preeval.applications(id,request_id,request_hash,email,first_name,last_name,country,locale,
      status,payment_status,ai_status,ai_pipeline)
      values (${id},${randomUUID()},'synthetic','synthetic@example.invalid','Synthetic','Applicant','US','en','processing','paid','queued','openai')`;
    await sql()`insert into preeval.educations(application_id,school_name,country_of_study,degree_obtained,start_date,end_date)
      values (${id},'Synthetic University','US','Degree','2018-09','2022-06')`;
    await sql()`insert into preeval.payments(application_id,session_id,payment_intent,amount_cents,status)
      values (${id},${'cs_' + id},${'pi_' + id},${TOTAL_CENTS},'paid')`;
    session = { id: 'cs_' + id, livemode: false, mode: 'payment', client_reference_id: id,
      metadata: { pilot: 'aet-2026-local', applicationId: id }, currency: 'usd', amount_total: TOTAL_CENTS,
      payment_status: 'paid', status: 'complete', payment_intent: 'pi_' + id } as unknown as Stripe.Checkout.Session;
    charge = { id: 'ch_' + id, livemode: false, currency: 'usd', amount: TOTAL_CENTS, amount_refunded: 0, payment_intent: 'pi_' + id } as Stripe.Charge;
    m.intent.mockReset().mockImplementation(async () => ({ id: 'pi_' + id, livemode: false, status: 'succeeded',
      amount: TOTAL_CENTS, currency: 'usd', latest_charge: charge }));
  });

  it.each([false, true])('recovers a stranded paid result on a read (staff=%s), without rerunning AI or duplicating mail', async staff => {
    await stranded();
    expect(await dueAIJobs(1, id)).toEqual([]);
    expect(await run()).toBe(false);
    expect(await application(id, staff)).toMatchObject({ status: 'completed', result, result_version: 1 });
    await Promise.all(Array.from({ length: 6 }, () => application(id)));
    expect(await mails()).toHaveLength(1);
    expect(analyze).toHaveBeenCalledTimes(1);
    expect(await sql()`select state from preeval.ai_runs where application_id=${id}`).toEqual([{ state: 'completed' }]);
  });

  it('keeps polling recoverable through another publication outage', async () => {
    await stranded(); await failPublication(true);
    expect(await application(id)).toMatchObject({ status: 'processing', result: null, result_version: 0 });
    expect((await row()).result).toEqual(result);
    await failPublication(false);
    expect(await application(id)).toMatchObject({ status: 'completed', result });
    expect(analyze).toHaveBeenCalledTimes(1);
  });

  it('keeps committed results visible through enqueue and transport failures', async () => {
    await stranded(); await failEnqueue(true);
    expect(await application(id)).toMatchObject({ status: 'completed', result });
    expect(await mails()).toHaveLength(0);
    await failEnqueue(false); await application(id);
    const transport = vi.fn().mockRejectedValue(new Error('synthetic transport outage'));
    vi.stubEnv('PREEVAL_EMAIL_ENABLED', 'true');
    try { await flushEmails(transport, id); }
    finally { vi.unstubAllEnvs(); }
    expect(transport).toHaveBeenCalledTimes(1);
    expect(await application(id)).toMatchObject({ status: 'completed', result });
    expect(await mails()).toMatchObject([{ state: 'failed', attempts: 1, result_version: 1 }]);
  });

  it.each(['unpaid', 'pending', 'refunded', 'partially_refunded'])('does not publish %s results', async payment => {
    await stranded();
    await sql()`update preeval.applications set payment_status=${payment} where id=${id}`;
    expect(await application(id)).toMatchObject({ status: 'processing', result: null, result_version: 0 });
    expect(await mails()).toHaveLength(0);
  });

  it.each(['cancelled', 'needs_information', 'uploads_pending', 'ai_incomplete'])('withholds a retained result when %s', async condition => {
    await stranded();
    if (condition === 'uploads_pending') await sql()`update preeval.applications set uploads_pending=true where id=${id}`;
    else if (condition === 'ai_incomplete') await sql()`update preeval.applications set ai_status='idle' where id=${id}`;
    else await sql()`update preeval.applications set status=${condition} where id=${id}`;
    expect((await application(id)).result).toBeNull();
    expect(await mails()).toHaveLength(0);
  });

  it.each(['uploads_pending', 'ai_incomplete'])('also hides previously completed results when %s', async condition => {
    await run();
    if (condition === 'uploads_pending') await sql()`update preeval.applications set uploads_pending=true where id=${id}`;
    else await sql()`update preeval.applications set ai_status='idle' where id=${id}`;
    expect((await application(id)).result).toBeNull();
  });

  it.each(['before', 'after'])('publishes with payment %s analysis and repeated checkout events', async order => {
    await sql()`update preeval.applications set payment_status='pending' where id=${id}`;
    await sql()`update preeval.payments set status='open' where application_id=${id}`;
    if (order === 'before') { await pay(); await stranded(); }
    else {
      await run();
      expect((await application(id)).result).toBeNull();
      await failPublication(true);
      await expect(pay()).rejects.toThrow('synthetic publication outage');
      await failPublication(false);
    }
    expect(await application(id)).toMatchObject({ status: 'completed', payment_status: 'paid', result });
    await pay(); await pay();
    expect(await mails()).toHaveLength(1);
    expect(analyze).toHaveBeenCalledTimes(1);
  });

  // Observe real lock waits before releasing the holder, rather than relying on
  // timing sleeps. Queue the actual mutation before the publication SELECT FOR UPDATE.
  async function mutationWins(action: () => Promise<unknown>) {
    let release!: () => void, entered!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const locked = new Promise<void>(resolve => { entered = resolve; });
    const holder = sql().begin(async tx => {
      await tx`select id from preeval.applications where id=${id} for update`;
      entered(); await gate;
    });
    await locked;
    const waitForBlocked = async (count: number) => {
      const deadline = Date.now() + 3000;
      while (Date.now() < deadline) {
        const [waiting] = await sql()`select count(*)::int as count from pg_stat_activity
          where datname=current_database() and cardinality(pg_blocking_pids(pid))>0`;
        if (waiting.count >= count) return;
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      throw new Error('Expected PostgreSQL row lock wait');
    };
    let mutation: Promise<unknown> | undefined, reading: ReturnType<typeof application> | undefined;
    try {
      mutation = action();
      await waitForBlocked(1);
      reading = application(id);
      await waitForBlocked(2);
    } finally { release(); await holder; }
    await mutation;
    return await reading!;
  }

  it.each([100, TOTAL_CENTS])('rechecks a concurrent refund (%s cents) before publication', async amount => {
    await stranded();
    expect((await mutationWins(() => refund(amount))).result).toBeNull();
    expect((await row()).payment_status).toBe(amount === TOTAL_CENTS ? 'refunded' : 'partially_refunded');
    await pay(); // Even a stale paid callback must preserve the refund.
    expect((await application(id)).result).toBeNull();
    expect(await mails()).toHaveLength(0);
  });

  it('does not restore the old result over a concurrent upload', async () => {
    await stranded();
    expect(await mutationWins(() => startDocumentUpload(id, 'transcript'))).toMatchObject({ result: null, uploads_pending: true });
    expect(await row()).toMatchObject({ result: null, ai_status: 'idle', result_version: 1 });
    expect(await mails()).toHaveLength(0);
  });

  it('publishes the current staff revision when correction wins the lock', async () => {
    await stranded();
    await mutationWins(() => staffAction(id, { action: 'result', result: corrected }, 'synthetic-staff'));
    expect(await application(id)).toMatchObject({ result: corrected, result_version: 2 });
    expect(await mails()).toMatchObject([{ result_version: 2 }]);
    expect(analyze).toHaveBeenCalledTimes(1);
  });

  it('fences a running AI result after a staff correction, including failed publication recovery', async () => {
    let release!: () => void, entered!: () => void;
    const ready = new Promise<void>(resolve => { entered = resolve; });
    analyze.mockImplementationOnce(async () => { entered(); await new Promise<void>(resolve => { release = resolve; }); return generated; });
    const running = run(); await ready;
    try {
      await failPublication(true);
      await expect(staffAction(id, { action: 'result', result: corrected }, 'synthetic-staff')).rejects.toThrow('synthetic publication outage');
      await failPublication(false);
    } finally { release(); }
    await running;
    expect(await application(id)).toMatchObject({ result: corrected, result_version: 1, status: 'completed' });
    expect((await row()).result_source).toBe('staff');
    expect(await sql()`select state from preeval.ai_runs where application_id=${id}`).toEqual([{ state: 'superseded' }]);
    expect(await mails()).toHaveLength(1);
  });

  it.each(['refund', 'upload', 'correction', 'information'])('withholds stale queued mail when %s follows recovery', async action => {
    await stranded(); await application(id);
    const [oldMail] = await mails();
    if (action === 'refund') await refund(100);
    else if (action === 'upload') await startDocumentUpload(id, 'transcript');
    else if (action === 'correction') await staffAction(id, { action: 'result', result: corrected }, 'synthetic-staff');
    else await staffAction(id, { action: 'information', message: 'Please provide another transcript.' }, 'synthetic-staff');
    await expect(renderQueuedEmail(oldMail)).rejects.toThrow('result_superseded_or_withheld');
    expect((await application(id)).result).toEqual(action === 'correction' ? corrected : null);
    await publishIfReady(id);
    expect(await mails()).toHaveLength(action === 'correction' ? 2 : 1);
  });

  it('does not turn a recovered result back into a due AI job', async () => {
    await stranded(); await application(id);
    await expect(retryAnalysis(id)).rejects.toThrow('ai_retry_unavailable');
    expect(await dueAIJobs(1, id)).toEqual([]);
    expect(await run()).toBe(false);
  });
});
