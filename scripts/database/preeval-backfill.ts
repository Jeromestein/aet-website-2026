import { createHash } from 'node:crypto';
import type { Sql, TransactionSql } from 'postgres';
import { applicationSchema } from '../../lib/preeval/domain';

/** Verified metadata returned by a storage lookup, not an ID derived from a path. */
export type ReconciledFile = {
  legacyFileId: string;
  storageLocation: string;
  fileId: string;
  revision: string;
  contentHash: string | null;
  path: string | null;
  name: string;
  size: number;
};
type Options = {
  files?: ReconciledFile[];
  originalSubmission?: unknown;
  // Explicitly supplied verified test account; never inferred from an office.
  providerAccount: string;
  verifiedServicePrice?: { amountCents: number; currency: string; source: 'automatic' | 'manual' };
};
export type RehearsalReport = {
  applicationId: string;
  serviceId: string;
  educationIds: string[];
  documentIds: string[];
  paymentIds: string[];
  exceptions: { sourceTable: string; sourceId: string; reason: string }[];
};

/** Defense against accidentally pointing a rehearsal at .env/hosted storage. */
export async function assertRehearsalDatabase(sql: Sql | TransactionSql) {
  const [target] = await sql`select current_database() as database, session_user as owner,
    inet_server_addr()::text as address`;
  if (target.database !== 'aet_core_rehearsal' || target.owner !== 'core_rehearsal' || target.address !== null)
    throw new Error('Rehearsal requires its disposable Unix-socket database; hosted/existing databases are forbidden');
}

/** One-way, explicit snapshot into private tables. No triggers, live dual writes,
 * source deletions, provider calls or automatic production connection. Re-running
 * refreshes this rehearsal projection; it must not run after target cutover. */
export async function rehearsePreevaluation(sql: Sql, applicationId: string, options: Options): Promise<RehearsalReport> {
  return sql.begin('isolation level repeatable read', async tx => {
    await assertRehearsalDatabase(tx);
    if (!options.providerAccount.trim()) throw new Error('Verified provider account required');
    const price = options.verifiedServicePrice;
    if (price && (!Number.isSafeInteger(price.amountCents) || price.amountCents < 0 ||
        !/^[A-Z]{3}$/.test(price.currency) || !['automatic','manual'].includes(price.source)))
      throw new Error('Invalid verified service price');
    const [app] = await tx`select *,created_at::text as created_at,updated_at::text as updated_at from preeval.applications where id=${applicationId} for update`;
    if (!app) throw new Error('Pre-evaluation application not found');
    const [legacy] = await tx`select * from public.aet_core_applications where id=${applicationId}`;
    const [existing] = await tx`select primary_service,request_id from aet.aet_core_applications where id=${applicationId}`;
    if (existing && (existing.primary_service !== 'pre-evaluation' || existing.request_id !== app.request_id))
      throw new Error('Target application identity conflict');
    const report: RehearsalReport = { applicationId, serviceId: '', educationIds: [], documentIds: [], paymentIds: [], exceptions: [] };
    const issue = (sourceTable: string, sourceId: string, reason: string) => report.exceptions.push({ sourceTable, sourceId, reason });
    let snapshot: Record<string, unknown> | null = null;
    if (options.originalSubmission !== undefined) {
      const parsed = applicationSchema.parse(options.originalSubmission);
      if (createHash('sha256').update(JSON.stringify(parsed)).digest('hex') !== app.request_hash)
        throw new Error('Original submission does not match the saved request hash');
      // Preserve the old hash and its rule (v0 includes locale), not UI language.
      const { locale: _locale, ...businessInputs } = parsed;
      snapshot = businessInputs;
    } else issue('preeval.applications', applicationId, 'original_submission_unavailable');
    const [submitted] = await tx`select min(created_at)::text as at from preeval.audit
      where application_id=${applicationId} and action='application.submitted'`;
    const first = legacy?.first_name ?? app.first_name;
    const middle = legacy?.middle_name ?? app.middle_name;
    const last = legacy?.last_name ?? app.last_name;
    await tx`insert into aet.aet_core_applications
      (id,email,office,primary_service,first_name,middle_name,last_name,residence_country,purpose,source,status,
       request_id,request_hash,request_hash_version,submission_version,submitted_snapshot,submitted_at,created_at,updated_at)
      values (${applicationId},${legacy?.email ?? app.email},${app.office},'pre-evaluation',${first},${middle},${last},${app.country},
        ${legacy?.purpose ?? null},${legacy?.source ?? null},${app.status},${app.request_id},${app.request_hash},0,
        ${snapshot ? 1 : null},${snapshot ? tx.json(snapshot as never) : null},${submitted?.at ?? null}::text::timestamptz,${app.created_at}::text::timestamptz,${app.updated_at}::text::timestamptz)
      on conflict(id) do update set email=excluded.email,office=excluded.office,first_name=excluded.first_name,
        middle_name=excluded.middle_name,last_name=excluded.last_name,residence_country=excluded.residence_country,
        purpose=excluded.purpose,source=excluded.source,status=excluded.status,updated_at=excluded.updated_at,
        submitted_at=excluded.submitted_at,
        submitted_snapshot=coalesce(aet.aet_core_applications.submitted_snapshot,excluded.submitted_snapshot),
        submission_version=coalesce(aet.aet_core_applications.submission_version,excluded.submission_version)`;
    // Do not invent the client's contact name/phone, pronouns, birthday or address.
    const educations = await tx`select e.*,l.school_name as legacy_school,l.country_of_study as legacy_country,
      l.degree_obtained as legacy_degree,l.study_start_date,l.study_end_date,l.ai_output
      from preeval.educations e left join public.aet_core_educations l on l.id=e.id and l.application_id=e.application_id
      where e.application_id=${applicationId} order by e.id`;
    if (educations.length !== 1) throw new Error('Dedicated pre-evaluation requires exactly one source education');
    for (const education of educations) {
      const month = (value: string) => ({ year: value.slice(0, 4), month: value.slice(5, 7) });
      const [old] = await tx`select application_id from aet.aet_education where id=${education.id}`;
      if (old && old.application_id !== applicationId) throw new Error('Education identity conflict');
      await tx`insert into aet.aet_education(id,application_id,school_name,country_of_study,degree_obtained,
        study_start_date,study_end_date,sort_order,ai_output,created_at,updated_at)
        values (${education.id},${applicationId},${education.legacy_school ?? education.school_name},
          ${education.legacy_country ?? education.country_of_study},${education.legacy_degree ?? education.degree_obtained},
          ${tx.json(education.study_start_date ?? month(education.start_date))},
          ${tx.json(education.study_end_date ?? month(education.end_date))},0,${education.ai_output ? tx.json(education.ai_output) : null},null,null)
        on conflict(id) do update set school_name=excluded.school_name,country_of_study=excluded.country_of_study,
          degree_obtained=excluded.degree_obtained,study_start_date=excluded.study_start_date,
          study_end_date=excluded.study_end_date,ai_output=excluded.ai_output`;
      report.educationIds.push(education.id);
    }
    const files = await tx`select * from preeval.files where application_id=${applicationId} order by id`;
    const reconciled = new Map((options.files ?? []).map(file => [file.legacyFileId, file]));
    if (reconciled.size !== (options.files ?? []).length) throw new Error('Duplicate source file mapping');
    for (const id of reconciled.keys()) if (!files.some(file => file.id === id && file.state === 'ready'))
      throw new Error('File mapping must reference a ready file in this application');
    for (const file of files) {
      if (file.state !== 'ready') {
        issue('preeval.files', file.id, 'upload_attempt_retained_in_workflow');
        continue;
      }
      const metadata = reconciled.get(file.id);
      if (!metadata) {
        issue('preeval.files', file.id, 'dropbox_file_id_not_reconciled');
        continue;
      }
      if (!metadata.storageLocation.trim() || !metadata.fileId.startsWith('id:') || !metadata.revision ||
          !Number.isSafeInteger(metadata.size) || metadata.size < 0)
        throw new Error('Invalid reconciled file metadata');
      const [old] = await tx`select id,application_id,storage_location,storage_file_id from aet.aet_documents
        where id=${file.id} or (storage_location=${metadata.storageLocation} and storage_file_id=${metadata.fileId})`;
      if (old && (old.id !== file.id || old.application_id !== applicationId ||
          old.storage_location !== metadata.storageLocation || old.storage_file_id !== metadata.fileId))
        throw new Error('Document identity conflict; explicit reconciliation required');
      await tx`insert into aet.aet_documents(id,application_id,storage_location,storage_file_id,storage_path,storage_rev,
        storage_content_hash,original_filename,mime_type,size_bytes,access_scope,created_at)
        values (${file.id},${applicationId},${metadata.storageLocation},${metadata.fileId},${metadata.path},${metadata.revision},
          ${metadata.contentHash},${file.name},${file.mime_type},${metadata.size},'customer_input',null)
        on conflict(id) do update set storage_path=excluded.storage_path,storage_rev=excluded.storage_rev,
          storage_content_hash=excluded.storage_content_hash,size_bytes=excluded.size_bytes,
          updated_at=case when (aet.aet_documents.storage_path,aet.aet_documents.storage_rev,aet.aet_documents.storage_content_hash,aet.aet_documents.size_bytes)
            is distinct from (excluded.storage_path,excluded.storage_rev,excluded.storage_content_hash,excluded.size_bytes)
            then now() else aet.aet_documents.updated_at end`;
      report.documentIds.push(file.id);
    }
    const payments = await tx`select p.*,l.application_id as legacy_application_id,l.payment_id,l.source,l.notes,l.paid_at::text as paid_at,p.created_at::text as created_at,p.updated_at::text as updated_at
      from preeval.payments p left join public.aet_core_payments l on l.id=p.id::text
      where p.application_id=${applicationId} order by p.created_at,p.id`;
    for (const payment of payments) {
      if (payment.legacy_application_id && payment.legacy_application_id !== applicationId)
        throw new Error('Legacy payment identity conflict');
      const [old] = await tx`select application_id,provider,provider_account,provider_mode from aet.aet_payments where id=${payment.id}`;
      if (old && (old.application_id !== applicationId || old.provider !== 'stripe' ||
          old.provider_account !== options.providerAccount || old.provider_mode !== 'test'))
        throw new Error('Payment identity conflict');
      if (['paid','partially_refunded','refunded'].includes(payment.status) && !payment.paid_at)
        issue('preeval.payments', payment.id, 'paid_at_unknown');
      await tx`insert into aet.aet_payments(id,application_id,amount_cents,currency,refunded_cents,payment_status,
        provider,provider_account,provider_mode,checkout_session_id,payment_intent_id,payment_id,source,notes,paid_at,created_at,updated_at)
        values (${payment.id},${applicationId},${payment.amount_cents},${payment.currency.toUpperCase()},${payment.refunded_cents},
          ${payment.status},'stripe',${options.providerAccount},'test',${payment.session_id},${payment.payment_intent},
          ${payment.payment_id ?? null},${payment.source ?? null},${payment.notes ?? null},${payment.paid_at ?? null}::text::timestamptz,${payment.created_at}::text::timestamptz,${payment.updated_at}::text::timestamptz)
        on conflict(id) do update set amount_cents=excluded.amount_cents,currency=excluded.currency,
          refunded_cents=excluded.refunded_cents,payment_status=excluded.payment_status,
          checkout_session_id=excluded.checkout_session_id,payment_intent_id=excluded.payment_intent_id,
          payment_id=excluded.payment_id,source=excluded.source,notes=excluded.notes,paid_at=excluded.paid_at,updated_at=excluded.updated_at`;
      report.paymentIds.push(payment.id);
    }
    const released = app.status === 'completed' && app.payment_status === 'paid' && app.ai_status === 'completed' && !app.uploads_pending;
    // There is no reliable historic release timestamp in the current row.
    // updated_at may reflect a later staff edit; retain unknown as NULL.
    if (released && app.result) issue('preeval.applications', applicationId, 'result_released_at_unknown');
    const result = app.result ? { content: app.result, documents: [], status: released ? 'released' : 'draft',
      released_at: null, input_version: app.input_version, version: app.result_version } : null;
    // A payment may include processing/shipping fees: it is not a service price.
    if (!price) issue('preeval.applications', applicationId, 'service_price_not_reconciled');
    const [service] = await tx`insert into aet.aet_service_detail(application_id,service_type,details,status,input_version,
      staff_notes,amount_cents,currency,pricing_source,result,created_at,updated_at)
      values (${applicationId},'pre-evaluation',${tx.json({ education_ids: report.educationIds })},${app.status},${app.input_version},
        ${app.notes},${price?.amountCents ?? null},${price?.currency ?? 'USD'},${price?.source ?? null},${result ? tx.json(result) : null},${app.created_at}::text::timestamptz,${app.updated_at}::text::timestamptz)
      on conflict(application_id,service_type) do update set details=excluded.details,status=excluded.status,
        input_version=excluded.input_version,staff_notes=excluded.staff_notes,amount_cents=excluded.amount_cents,
        currency=excluded.currency,pricing_source=excluded.pricing_source,result=excluded.result,updated_at=excluded.updated_at returning id`;
    report.serviceId = service.id;
    return report;
  });
}
