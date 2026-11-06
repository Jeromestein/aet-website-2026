import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import postgres from 'postgres';
import type Stripe from 'stripe';

const m = vi.hoisted(() => ({ sql: undefined as ReturnType<typeof postgres> | undefined,
  upload: vi.fn(), intent: vi.fn(), createCheckout: vi.fn(), retrieveCheckout: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('../lib/preeval/db', () => ({
  db: () => m.sql!, table: (name: string) => m.sql!(name),
  audit: async (id: string, actor: string, action: string) => {
    await m.sql!`insert into preeval.audit(application_id,actor,action) values (${id},${actor},${action})`;
  },
}));
vi.mock('../lib/preeval/config', () => ({
  configuration: () => ({ origin: 'http://localhost:3022', recipient: 'synthetic@example.invalid', cloudPreview: true }),
  required: (name: string) => name === 'STRIPE_TEST_SECRET_KEY' ? 'sk_test_synthetic' : 'synthetic@example.invalid',
  requireExternalServices: () => {},
}));
vi.mock('stripe', () => ({ default: class {
  checkout = { sessions: { create: m.createCheckout, retrieve: m.retrieveCheckout } };
  paymentIntents = { retrieve: m.intent };
} }));
vi.mock('../lib/preeval/dropbox', () => ({
  filePath: async (_app: unknown, _kind: string, id: string, name: string) => `/synthetic/${id}-${name}`,
  uploadFile: m.upload,
}));
vi.mock('../lib/preeval/ai-documents', () => ({
  documentManifest: async () => [], loadDocuments: async () => [],
  manifestHash: (manifest: unknown) => JSON.stringify(manifest),
}));

import { submit, addFile, application, staffAction } from '../lib/preeval/service';
import { completeUploads } from '../lib/preeval/ai-jobs';
import { abandonUpload, unfinishedUploads } from '../lib/preeval/upload-recovery';
import { processAI } from '../lib/preeval/ai';
import { checkout, applyCheckout, handleStripeEvent } from '../lib/preeval/payments';
import { flushEmails } from '../lib/preeval/email';
import { BASE_CENTS, TOTAL_CENTS } from '../lib/preeval/domain';
import { assertRehearsalDatabase, rehearsePreevaluation, type ReconciledFile } from '../scripts/database/preeval-backfill';

const pgBin = process.env.APPLICATION_CORE_TEST_PG_BIN;
const migrationName = '20261106220126_shared_application_core.sql';
const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const input = () => ({ requestId: randomUUID(), locale: 'en', email: 'synthetic@example.invalid',
  firstName: 'Synthetic', middleName: '', lastName: 'Applicant', country: 'US',
  schoolName: 'Synthetic University', countryOfStudy: 'US', degreeObtained: 'Bachelor of Science',
  startDate: '2018-09', endDate: '2022-06', terms: true, uploadsPending: true });
const image = (name = 'degree.png', extra = 1) => new File([
  new Uint8Array([137,80,78,71,13,10,26,10,extra]),
], name, { type: 'image/png' });

describe.skipIf(!pgBin)('shared core phase 1 (owned PostgreSQL cluster)', () => {
  let directory: string;
  let started = false;
  const sql = () => m.sql!;
  const generated = { analysis: { result: 'Synthetic degree', reasoning: 'Synthetic assessment used only for migration testing.',
    basis: 'form_only' as const, facts: { institution: null, country: null, qualification: null, start: null, completion: null },
    issues: [], evidence: [] }, pageMap: [], model: 'synthetic-model', responseId: 'synthetic-response',
    usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 } };
  const analyze = vi.fn().mockResolvedValue(generated);
  const runAI = (id: string) => processAI(id, { analyze, configured: () => ({ model: 'synthetic-model', apiKey: 'unused' }) });
  const project = (id: string, originalSubmission?: unknown, files?: ReconciledFile[]) => rehearsePreevaluation(sql(), id, {
    providerAccount: 'acct_synthetic', originalSubmission, files,
    verifiedServicePrice: { amountCents: BASE_CENTS, currency: 'USD', source: 'automatic' },
  });
  const service = async (id: string) => (await sql()`select * from aet.aet_service_detail where application_id=${id}`)[0];
  const paidSession = (id: string) => ({ id: `cs_${id}`, livemode: false, mode: 'payment', client_reference_id: id,
    metadata: { pilot: 'aet-2026-local', applicationId: id }, currency: 'usd', amount_total: TOTAL_CENTS,
    payment_status: 'paid', status: 'complete', payment_intent: `pi_${id}` } as unknown as Stripe.Checkout.Session);
  function setCharge(id: string, refunded = 0) {
    const charge = { id: `ch_${id}`, livemode: false, currency: 'usd', amount: TOTAL_CENTS,
      amount_refunded: refunded, payment_intent: `pi_${id}` };
    m.intent.mockResolvedValue({ id: `pi_${id}`, livemode: false, status: 'succeeded',
      currency: 'usd', amount: TOTAL_CENTS, latest_charge: charge });
    return charge;
  }
  async function upload(id: string, file = image()) {
    await addFile(id, file, 'customer');
    const [saved] = await sql()`select * from preeval.files where application_id=${id} and state='ready' order by created_at desc limit 1`;
    return { legacyFileId: saved.id, storageLocation: 'dropbox_test_ca', fileId: `id:${saved.id}`, revision: 'rev1',
      contentHash: 'synthetic-dropbox-hash', path: saved.dropbox_path, name: file.name, size: file.size } satisfies ReconciledFile;
  }

  beforeAll(async () => {
    directory = mkdtempSync(join(tmpdir(), 'aet-core-'));
    execFileSync(join(pgBin!, 'initdb'), ['-D', join(directory, 'data'), '-U', 'core_rehearsal', '-A', 'trust', '--locale=C', '--encoding=UTF8'], { timeout: 30000, stdio: 'pipe' });
    execFileSync(join(pgBin!, 'pg_ctl'), ['-D', join(directory, 'data'), '-l', join(directory, 'postgres.log'),
      '-o', `-F -k ${directory} -h '' -p 55443`, '-w', 'start'], { timeout: 30000, stdio: 'pipe' });
    started = true;
    const options = { host: directory, port: 55443, username: 'core_rehearsal', onnotice: () => {},
      connection: { statement_timeout: 5000 } };
    const admin = postgres({ ...options, database: 'postgres', max: 1 });
    try {
      await expect(assertRehearsalDatabase(admin)).rejects.toThrow('disposable');
      await admin.unsafe('create database aet_core_rehearsal');
    } finally { await admin.end(); }
    m.sql = postgres({ ...options, database: 'aet_core_rehearsal', max: 5 });
    await sql().unsafe('create role anon; create role authenticated;');
    // Explicit source migration list: future migrations must be reviewed before
    // they become part of this reproducible fixture.
    for (const name of [
      '20261002000100_pre_evaluation.sql', '20261002000200_formal_evaluation.sql',
      '20261002000300_evaluation_workflow.sql', '20261020165103_email_delivery_records.sql',
      '20261020173355_formal_email_delivery_records.sql', '20261020230256_application_document_locations.sql',
      '20261020232924_preeval_gpt_analysis.sql',
    ]) await sql().unsafe(read(`supabase/migrations/${name}`));
    await sql().unsafe(read('scripts/legacy/schema-fixture.sql'));
    await sql().unsafe(read('scripts/legacy/workflow-bridge.sql'));
    await sql().unsafe(read(`supabase/migrations/${migrationName}`));
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('External network is forbidden in migration tests')));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubEnv('PREEVAL_EMAIL_ENABLED', 'true');
  }, 60000);
  afterAll(async () => {
    vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks();
    await m.sql?.end({ timeout: 1 });
    if (started) execFileSync(join(pgBin!, 'pg_ctl'), ['-D', join(directory, 'data'), '-m', 'immediate', '-w', 'stop'], { timeout: 10000, stdio: 'pipe' });
    if (directory) rmSync(directory, { recursive: true, force: true });
  });
  beforeEach(() => {
    analyze.mockClear(); m.upload.mockReset().mockResolvedValue({ id: 'id:synthetic', rev: 'rev1' });
    m.createCheckout.mockReset().mockImplementation(async (params: { client_reference_id: string }) => ({
      id: `cs_${params.client_reference_id}`, url: 'https://checkout.example.invalid/synthetic', status: 'open',
    }));
    m.retrieveCheckout.mockReset().mockResolvedValue({ status: 'open', url: 'https://checkout.example.invalid/synthetic' });
  });

  it('runs submit, upload, AI, Checkout, callback recovery and email; reconciles every checkpoint', async () => {
    const original = input();
    const { app, token } = await submit(original);
    expect(token).toHaveLength(43);
    expect((await submit(original)).app.id).toBe(app.id);
    await expect(submit({ ...original, lastName: 'Changed' })).rejects.toMatchObject({ code: 'duplicate_conflict' });
    const first = await project(app.id, original);
    expect(first.educationIds).toHaveLength(1);
    const file = await upload(app.id);
    await completeUploads(app.id);
    expect(await runAI(app.id)).toBe(true);
    expect((await application(app.id)).result).toBeNull();
    await project(app.id, original, [file]);
    expect((await service(app.id)).result.status).toBe('draft');
    expect(await checkout(app.id)).toContain('checkout.example.invalid');
    await checkout(app.id);
    expect(m.createCheckout).toHaveBeenCalledTimes(1);
    setCharge(app.id);
    await sql().unsafe(`create function preeval.fail_core_test_publication() returns trigger language plpgsql as $$
      begin if new.status='completed' then raise exception 'synthetic publication failure'; end if; return new; end $$;
      create trigger fail_core_test_publication before update on preeval.applications
        for each row execute function preeval.fail_core_test_publication();`);
    try {
      await expect(applyCheckout(paidSession(app.id), `evt_${app.id}`, 'checkout.session.completed')).rejects.toThrow('synthetic publication failure');
      await project(app.id, original, [file]);
      expect((await service(app.id)).result.status).toBe('draft');
    } finally { await sql().unsafe('drop trigger fail_core_test_publication on preeval.applications; drop function preeval.fail_core_test_publication()'); }
    expect(await application(app.id)).toMatchObject({ status: 'completed', payment_status: 'paid', result: { result: 'Synthetic degree' } });
    await applyCheckout(paidSession(app.id), `evt_${app.id}`, 'checkout.session.completed');
    expect(analyze).toHaveBeenCalledTimes(1);
    await staffAction(app.id, { action: 'notes', notes: 'Private staff note' }, 'synthetic_staff');
    const report = await project(app.id, original, [file]);
    expect(await project(app.id, original, [file])).toEqual(report);
    expect(report.serviceId).toBe(first.serviceId);
    expect(report.documentIds).toEqual([file.legacyFileId]);
    const coreService = await service(app.id);
    expect(coreService).toMatchObject({ notes: null, staff_notes: 'Private staff note', amount_cents: BASE_CENTS,
      result: { status: 'released', released_at: null, version: 1 } });
    expect(await sql()`select amount_cents,refunded_cents,payment_status from aet.aet_payments where application_id=${app.id}`)
      .toEqual([{ amount_cents: TOTAL_CENTS, refunded_cents: 0, payment_status: 'paid' }]);
    const [payment] = await sql()`select paid_at,created_at,updated_at from aet.aet_payments where application_id=${app.id}`;
    expect(payment.paid_at).toBeInstanceOf(Date);
    expect(payment.created_at <= payment.updated_at).toBe(true);
    const [master] = await sql()`select * from aet.aet_core_applications where id=${app.id}`;
    expect(master.submitted_snapshot).not.toHaveProperty('locale');
    expect(master).toMatchObject({ phone: null, pronouns: null, date_of_birth: null, mailing_address: null });
    const send = vi.fn().mockRejectedValueOnce(new Error('synthetic email outage')).mockResolvedValue('synthetic_receipt');
    await flushEmails(send, app.id);
    await sql()`update preeval.emails set available_at=now() where application_id=${app.id} and state='failed'`;
    await flushEmails(send, app.id);
    const sentCount = send.mock.calls.length;
    await flushEmails(send, app.id);
    expect(send).toHaveBeenCalledTimes(sentCount);
    expect(await sql()`select kind,state from preeval.emails where application_id=${app.id} order by kind`)
      .toEqual([{ kind: 'confirmation', state: 'sent' }, { kind: 'result', state: 'sent' }]);
    expect(await sql()`select id from preeval.payment_events where id=${`evt_${app.id}`}`).toHaveLength(1);
  });

  it('recovers a replaced failed upload and does not invent File IDs for unresolved files', async () => {
    const original = input(); const { app } = await submit(original);
    m.upload.mockRejectedValueOnce(new Error('synthetic upload outage'));
    await expect(upload(app.id)).rejects.toMatchObject({ code: 'upload_failed' });
    const ready = await upload(app.id, image('replacement.png', 2));
    await expect(completeUploads(app.id)).rejects.toMatchObject({ code: 'uploads_incomplete' });
    const failed = (await unfinishedUploads(app.id)).uploads[0];
    await abandonUpload(app.id, failed, 'customer');
    await expect(abandonUpload(app.id, failed, 'customer')).rejects.toMatchObject({ code: 'upload_expired' });
    await completeUploads(app.id); expect(await runAI(app.id)).toBe(true);
    const unresolved = await project(app.id, original);
    expect(unresolved.documentIds).toEqual([]);
    expect(unresolved.exceptions).toContainEqual({ sourceTable: 'preeval.files', sourceId: ready.legacyFileId, reason: 'dropbox_file_id_not_reconciled' });
    await project(app.id, original, [ready]);
    await project(app.id, original, [{ ...ready, path: '/staff-moved/renamed.png', name: 'renamed.png', revision: 'rev2' }]);
    expect(await sql()`select id,storage_file_id,storage_path,storage_rev from aet.aet_documents where application_id=${app.id}`)
      .toEqual([{ id: ready.legacyFileId, storage_file_id: ready.fileId, storage_path: '/staff-moved/renamed.png', storage_rev: 'rev2' }]);
    expect(await sql()`select dropbox_path from preeval.files where id=${ready.legacyFileId}`).toEqual([{ dropbox_path: ready.path }]);
  });

  it('keeps refunds authoritative when a paid callback is replayed', async () => {
    const original = input(); const { app } = await submit(original); const file = await upload(app.id);
    await completeUploads(app.id); await runAI(app.id); await checkout(app.id); setCharge(app.id);
    await applyCheckout(paidSession(app.id), `evt_${app.id}`, 'checkout.session.completed');
    await project(app.id, original, [file]);
    const charge = setCharge(app.id, TOTAL_CENTS);
    await handleStripeEvent({ id: `refund_${app.id}`, type: 'charge.refunded', livemode: false, data: { object: charge } } as Stripe.Event);
    await applyCheckout(paidSession(app.id), `evt_${app.id}`, 'checkout.session.completed');
    await project(app.id, original, [file]);
    expect((await application(app.id)).result).toBeNull();
    expect((await service(app.id)).result.status).toBe('draft');
    expect(await sql()`select refunded_cents,payment_status from aet.aet_payments where application_id=${app.id}`)
      .toEqual([{ refunded_cents: TOTAL_CENTS, payment_status: 'refunded' }]);
    expect(analyze).toHaveBeenCalledTimes(1);
  });

  it('preserves unknown historical fields and reports missing submission/price evidence', async () => {
    const { app } = await submit(input());
    const report = await rehearsePreevaluation(sql(), app.id, { providerAccount: 'acct_synthetic' });
    expect(report.exceptions.map(item => item.reason)).toEqual(['original_submission_unavailable','service_price_not_reconciled']);
    expect((await service(app.id)).amount_cents).toBeNull();
    expect(await sql()`select submitted_snapshot,submission_version from aet.aet_core_applications where id=${app.id}`)
      .toEqual([{ submitted_snapshot: null, submission_version: null }]);
    expect(await sql()`select created_at,updated_at from aet.aet_education where application_id=${app.id}`)
      .toEqual([{ created_at: null, updated_at: null }]);
  });

  it('supports zero-education translation, multiple degrees and combined services', async () => {
    const [app] = await sql()`insert into aet.aet_core_applications(contact_name,email,primary_service)
      values ('Synthetic Organization','synthetic@example.invalid','translation') returning id`;
    await sql()`insert into aet.aet_service_detail(application_id,service_type,details,amount_cents,pricing_source)
      values (${app.id},'translation','{"source_language":"zh","target_language":"en"}',0,'manual')`;
    expect(await sql()`select id from aet.aet_education where application_id=${app.id}`).toHaveLength(0);
    const degrees = await sql()`insert into aet.aet_education(application_id,school_name,country_of_study,degree_obtained,study_start_date,study_end_date)
      values (${app.id},'Synthetic School','US','Degree A','{"year":"2010","month":"09"}','{"year":"2014","month":"06"}'),
             (${app.id},'Synthetic School','US','Degree B','{"year":"2014","month":"09"}','{"year":"2016","month":"06"}') returning id`;
    await sql()`insert into aet.aet_service_detail(application_id,service_type,details,amount_cents,pricing_source)
      values (${app.id},'evaluation',${sql().json({ education_ids: degrees.map(row => row.id) })},10000,'automatic')`;
    expect(await sql()`select id from aet.aet_service_detail where application_id=${app.id}`).toHaveLength(2);
    await expect(sql()`insert into aet.aet_service_detail(application_id,service_type,details) values (${app.id},'evaluation','{}')`).rejects.toMatchObject({ code: '23505' });
    await expect(sql()`update aet.aet_service_detail set amount_cents=-1 where application_id=${app.id}`).rejects.toMatchObject({ code: '23514' });
  });

  it('enforces identity, immutable submissions, reference ownership and payment constraints', async () => {
    const original = input(); const { app } = await submit(original); const file = await upload(app.id);
    await project(app.id, original, [file]);
    const { app: other } = await submit(input()); await project(other.id);
    await expect(project(app.id, { ...original, firstName: 'Wrong' })).rejects.toThrow('saved request hash');
    await expect(sql()`update aet.aet_core_applications set submitted_snapshot='{}' where id=${app.id}`).rejects.toThrow('immutable');
    const [education] = await sql()`select id from aet.aet_education where application_id=${app.id}`;
    await expect(sql()`update aet.aet_education set application_id=${other.id} where id=${education.id}`)
      .rejects.toThrow('association is immutable');
    await expect(sql()`delete from aet.aet_education where id=${education.id}`).rejects.toThrow('referenced by a service');
    await expect(sql()`update aet.aet_service_detail set result=${sql().json({ content: 'bad', documents: [],
      status: null, released_at: null, input_version: 1, version: 1 })} where application_id=${other.id}`)
      .rejects.toMatchObject({ code: '23514' });
    await expect(sql()`update aet.aet_service_detail set details=${sql().json({ education_ids: [education.id] })}
      where application_id=${other.id}`).rejects.toThrow('Education does not belong');
    await expect(sql()`update aet.aet_service_detail set result=${sql().json({ content: 'test', documents: [{ document_id: file.legacyFileId, storage_rev: 'rev1' }],
      status: 'draft', released_at: null, input_version: 1, version: 1 })} where application_id=${other.id}`).rejects.toThrow('Document does not belong');
    await expect(sql()`insert into aet.aet_documents(application_id,storage_location,storage_file_id,original_filename)
      values (${other.id},${file.storageLocation},${file.fileId},'duplicate.png')`).rejects.toMatchObject({ code: '23505' });
    await sql()`insert into aet.aet_payments(id,application_id,amount_cents,payment_status,provider,provider_account,provider_mode,checkout_session_id)
      values (${randomUUID()},${app.id},100,'open','stripe','acct_synthetic','test',${`cs_scope_${app.id}`})`;
    await expect(sql()`insert into aet.aet_payments(application_id,amount_cents,payment_status)
      values (${app.id},100,'creating')`).rejects.toMatchObject({ code: '23505' });
    await expect(sql()`insert into aet.aet_payments(amount_cents,refunded_cents,payment_status)
      values (100,101,'refunded')`).rejects.toMatchObject({ code: '23514' });
    await sql()`insert into aet.aet_payments(amount_cents,payment_status,provider,provider_account,provider_mode,checkout_session_id)
      values (100,'paid','stripe','acct_other','test',${`cs_scope_${app.id}`})`;
    await expect(sql()`insert into aet.aet_payments(amount_cents,payment_status,provider,provider_account,provider_mode,checkout_session_id)
      values (100,'paid','stripe','acct_synthetic','test',${`cs_scope_${app.id}`})`).rejects.toMatchObject({ code: '23505' });
  });

  it('rolls back the entire backfill on a conflicting File ID', async () => {
    const original = input(); const { app } = await submit(original); const file = await upload(app.id);
    await project(app.id, original, [file]);
    const otherInput = input(); const { app: other } = await submit(otherInput); const otherFile = await upload(other.id);
    await expect(project(other.id, otherInput, [{ ...otherFile, fileId: file.fileId }]))
      .rejects.toThrow('Document identity conflict');
    expect(await sql()`select id from aet.aet_core_applications where id=${other.id}`).toHaveLength(0);
    expect(await sql()`select id from preeval.applications where id=${other.id}`).toHaveLength(1);
    await expect(sql()`update aet.aet_documents set storage_file_id='id:replacement' where id=${file.legacyFileId}`)
      .rejects.toThrow('Storage file identity is immutable');
  });

  it('denies client roles and excludes obsolete target fields/tables', async () => {
    const tables = await sql()`select relname,relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='aet' and c.relkind='r' order by relname`;
    expect(tables).toHaveLength(5); expect(tables.every(row => row.relrowsecurity)).toBe(true);
    for (const role of ['anon','authenticated']) await expect(sql().begin(async tx => {
      await tx.unsafe(`set local role ${role}`); await tx`select * from aet.aet_core_applications`;
    })).rejects.toMatchObject({ code: '42501' });
    expect(await sql()`select column_name from information_schema.columns where table_schema='aet'
      and column_name in ('locale','storage_folder_id','kind','document_type','deleted_at','customer_user_id')`).toEqual([]);
    expect(await sql()`select column_name from information_schema.columns where table_schema='aet'
      and table_name='aet_core_applications' and column_name like 'storage%'`).toEqual([]);
  });

  it('rolls back only target tables, preserves source data, and replays deterministically', async () => {
    const original = input(); const { app } = await submit(original); const file = await upload(app.id);
    await completeUploads(app.id); await runAI(app.id); await checkout(app.id); setCharge(app.id);
    await applyCheckout(paidSession(app.id), `evt_${app.id}`, 'checkout.session.completed');
    const before = await project(app.id, original, [file]);
    const sourceBefore = await sql()`select row_to_json(a) as app from preeval.applications a where id=${app.id}`;
    const totalsBefore = await sql()`select sum(amount_cents)::text as total from preeval.payments`;
    const connection = await sql().reserve();
    try { await connection.unsafe(read('scripts/database/rollback-rehearsal.sql')); }
    finally { connection.release(); }
    expect(await sql()`select table_name from information_schema.tables where table_schema='aet'`).toEqual([]);
    expect(await sql()`select row_to_json(a) as app from preeval.applications a where id=${app.id}`).toEqual(sourceBefore);
    expect(await sql()`select sum(amount_cents)::text as total from preeval.payments`).toEqual(totalsBefore);
    expect((await application(app.id)).result).not.toBeNull();
    await sql().unsafe(read(`supabase/migrations/${migrationName}`));
    const after = await project(app.id, original, [file]);
    expect(after.applicationId).toBe(before.applicationId);
    expect(after.educationIds).toEqual(before.educationIds);
    expect(after.documentIds).toEqual(before.documentIds);
    expect(after.paymentIds).toEqual(before.paymentIds);
    expect((await service(app.id)).result.status).toBe('released');
  });
});
