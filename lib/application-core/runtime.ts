import { converged,workflowRows,queueInput,adminConverged } from "./converged-store";
import { coreTable, assertCoreConnection, corePreviewConfiguration } from './connection';
import 'server-only';
import { createHash, randomUUID } from 'node:crypto';
import type { Sql, TransactionSql } from 'postgres';
import { z } from 'zod';
import { db, table, type Row } from '../preeval/db';
import { applicationSchema, AppError, BASE_CENTS } from '../preeval/domain';

type DB = Sql | TransactionSql;
const enabled = new WeakMap<Sql, { providerAccount: string }>();
/** Explicit test-harness activation. The hosted opt-in has a separate guard.
 * This entry point requires the owned, Unix-socket rehearsal cluster.
 * Existing historical rows require a separately approved cohort reconciliation. */
export async function activateCoreRehearsal(sql: Sql, providerAccount: string) {
  const [target] = await sql`select current_database() as name, session_user as owner, inet_server_addr() as address`;
  if (target.name !== 'aet_core_rehearsal' || target.owner !== 'core_rehearsal' || target.address !== null)
    throw new Error('Core writes require the disposable rehearsal database');
  if (!/^acct_[a-zA-Z0-9_]+$/.test(providerAccount)) throw new Error('Verified test account required');
  const missing = await sql`select w.id from ${table("preeval.applications")} w left join ${coreTable(sql,'aet_core_applications')} a on a.id=w.id
    where a.id is null or a.request_hash_version is distinct from 1 limit 1`;
  if ((await sql`select id from evaluation.applications limit 1`).length) throw new Error('Mixed cohorts require a separate cutover');
  if (missing.length) throw new Error('Existing cohort requires reconciliation before activation');
  enabled.set(sql, { providerAccount });
}
export const coreRuntimeEnabled = () => converged() || enabled.has(db()) || Boolean(corePreviewConfiguration());
export async function isCoreApplication(id: string, sql: DB = db()) {
  if (!coreRuntimeEnabled()) return false;
  await assertCoreConnection(sql);
  const [app] = await sql`select id from ${coreTable(sql,'aet_core_applications')} where id=${id}`;
  return Boolean(app);
}
const month = (value: string) => ({ year: value.slice(0,4), month: value.slice(5,7) });

/** New business identity and deduplication belong to the core. The workflow row
 * keeps operational leases, tokens and existing FKs; its profile is not editable truth. */
export async function submitCore(tx: TransactionSql, v: z.infer<typeof applicationSchema>) {
  if (!coreRuntimeEnabled()) throw new Error('Core runtime is not enabled');
  await assertCoreConnection(tx);
  // Serialize retries across the new and retained cohorts before choosing a writer.
  await tx`select pg_advisory_xact_lock(hashtextextended(${v.requestId},0))`;
  const [old] = await tx`select w.* from ${table('preeval.applications')} w
    where w.request_id=${v.requestId} and not exists(select 1 from ${coreTable(tx,'aet_core_applications')} a where a.id=w.id)`;
  if (old) {
    if (old.request_hash !== createHash('sha256').update(JSON.stringify(v)).digest('hex')) throw new AppError('duplicate_conflict',409);
    return old;
  }
  const { locale: _locale, ...snapshot } = v;
  const fingerprint = createHash('sha256').update(JSON.stringify(snapshot)).digest('hex');
  const [created] = await tx`insert into ${coreTable(tx,'aet_core_applications')}
    (contact_name,email,first_name,middle_name,last_name,residence_country,primary_service,purpose,source,status,
     request_id,request_hash,request_hash_version,submission_version,submitted_snapshot,submitted_at)
    values (${[v.firstName,v.middleName,v.lastName].filter(Boolean).join(' ')},${v.email},${v.firstName},${v.middleName},${v.lastName},${v.country},
      'pre-evaluation','Preliminary degree equivalency','dedicated-pre-evaluation','submitted',
      ${v.requestId},${fingerprint},1,1,${tx.json(snapshot)},now()) on conflict(request_id) do nothing returning *`;
  if (!created) {
    const [existing] = await tx`select id,request_hash,request_hash_version from ${coreTable(tx,'aet_core_applications')} where request_id=${v.requestId}`;
    // Migrated requests retain the original v0 hash, which includes locale.
    const expected = existing?.request_hash_version === 0
      ? createHash('sha256').update(JSON.stringify(v)).digest('hex') : fingerprint;
    if (!existing || ![0,1].includes(existing.request_hash_version) || existing.request_hash !== expected)
      throw new AppError('duplicate_conflict',409);
    const [workflow] = await tx`select * from ${table("preeval.applications")} where id=${existing.id}`;
    if (!workflow) throw new Error('Missing core workflow mapping');
    return { ...workflow, ...await coreProfile(tx,existing.id), locale:v.locale };
  }
  const educationId = randomUUID();
  await tx`insert into ${coreTable(tx,'aet_education')}(id,application_id,school_name,country_of_study,degree_obtained,study_start_date,study_end_date)
    values (${educationId},${created.id},${v.schoolName},${v.countryOfStudy},${v.degreeObtained},${tx.json(month(v.startDate))},${tx.json(month(v.endDate))})`;
  await tx`insert into ${coreTable(tx,'aet_service_detail')}(application_id,service_type,details,amount_cents,pricing_source)
    values (${created.id},'pre-evaluation',${tx.json({education_ids:[educationId]})},${BASE_CENTS},'automatic')`;
  const [workflow] = await tx`insert into ${table("preeval.applications")}(id,request_id,request_hash,email,first_name,middle_name,last_name,country,locale,ai_status,ai_pipeline,uploads_pending)
    values (${created.id},${v.requestId},${fingerprint},${v.email},${v.firstName},${v.middleName},${v.lastName},${v.country},${v.locale},
      ${v.uploadsPending ? 'idle' : 'queued'},'openai',${Boolean(v.uploadsPending)}) returning *`;
  await tx`insert into ${table("preeval.audit")}(application_id,actor,action) values (${created.id},'customer','application.submitted')`;
  return workflow;
}

export async function coreEducation(sql: DB, id: string) {
  const rows = await sql`select e.id,e.school_name,e.country_of_study,e.degree_obtained,
    concat(e.study_start_date->>'year','-',lpad(e.study_start_date->>'month',2,'0')) start_date,
    concat(e.study_end_date->>'year','-',lpad(e.study_end_date->>'month',2,'0')) end_date
    from ${coreTable(sql,'aet_education')} e join ${coreTable(sql,'aet_service_detail')} s on s.application_id=e.application_id
    where e.application_id=${id} and s.service_type='pre-evaluation'
      and s.details->'education_ids' @> jsonb_build_array(e.id::text)`;
  if (rows.length!==1) throw new Error('Pre-evaluation education mapping requires review');
  return rows[0];
}
export async function coreProfile(sql: DB, id: string): Promise<Row> {
  const [app] = await sql`select a.id,a.first_name,a.middle_name,a.last_name,a.email,a.residence_country as country,
    a.office,s.staff_notes as notes from ${coreTable(sql,'aet_core_applications')} a join ${coreTable(sql,'aet_service_detail')} s on s.application_id=a.id
    where a.id=${id} and a.primary_service='pre-evaluation' and s.service_type='pre-evaluation'`;
  if (!app) throw new Error('Missing canonical pre-evaluation application');
  return { ...app, education:await coreEducation(sql,id) };
}

/** One transaction, one workflow writer. Operational state is retained during
 * phase 3; core is the customer/CRM projection for service results and payments.
 * Never copy workflow names/education back over the canonical business fields. */
export async function syncCoreWorkflow(tx: TransactionSql, id: string) {
  if (converged()) return;
  const config = enabled.get(db()) || corePreviewConfiguration();
  if (!config || !await isCoreApplication(id,tx)) return;
  const [app] = await tx`select *,updated_at::text as updated_at from ${table("preeval.applications")} where id=${id} for update`;
  if (!app) return;
  const updated = await tx`update ${coreTable(tx,'aet_core_applications')} set status=${app.status},updated_at=${app.updated_at}::text::timestamptz,
    version=version+case when status is distinct from ${app.status} or updated_at is distinct from ${app.updated_at}::text::timestamptz then 1 else 0 end where id=${id} returning id`;
  if (!updated.length) throw new Error('Missing canonical pre-evaluation application');
  const conflicts=await tx`select p.id from ${table("preeval.payments")} p join ${coreTable(tx,'aet_payments')} c on c.id=p.id::text
    where p.application_id=${id} and (c.application_id is distinct from p.application_id or c.provider is distinct from 'stripe'
      or c.provider_account is distinct from ${config.providerAccount} or c.provider_mode is distinct from 'test'
      or c.amount_cents<>p.amount_cents or c.currency<>upper(p.currency)) limit 1`;
  if (conflicts.length) throw new Error('Payment identity or frozen amount requires reconciliation');
  await tx`insert into ${coreTable(tx,'aet_payments')}(id,application_id,amount_cents,currency,refunded_cents,payment_status,
    provider,provider_account,provider_mode,checkout_session_id,payment_intent_id,source,paid_at,created_at,updated_at)
    select id::text,application_id,amount_cents,upper(currency),refunded_cents,status,'stripe',${config.providerAccount},'test',
      session_id,payment_intent,'preeval-runtime',case when status='paid' then updated_at end,created_at,updated_at
    from ${table("preeval.payments")} where application_id=${id}
    on conflict(id) do update set payment_status=excluded.payment_status,refunded_cents=excluded.refunded_cents,
      checkout_session_id=excluded.checkout_session_id,payment_intent_id=excluded.payment_intent_id,
      paid_at=coalesce(aet_payments.paid_at,excluded.paid_at),updated_at=excluded.updated_at`;
  const services=await tx`update ${coreTable(tx,'aet_service_detail')} set status=${app.status},input_version=${app.input_version},staff_notes=${app.notes},
    result=case when ${app.result === null} then null else jsonb_build_object(
      'content',${tx.json(app.result)},'documents','[]'::jsonb,'version',${app.result_version}::int,'input_version',${app.input_version}::int,
      'status',case when ${app.status==='completed' && app.payment_status==='paid' && app.ai_status==='completed' && !app.uploads_pending} then 'released' else 'draft' end,
      'released_at',case when ${app.status==='completed' && app.payment_status==='paid' && app.ai_status==='completed' && !app.uploads_pending}
        then case when result->>'status'='released' and (result->>'version')::int=${app.result_version} then result->'released_at' else to_jsonb(clock_timestamp()) end else null end)
      end,updated_at=${app.updated_at}::text::timestamptz where application_id=${id} and service_type='pre-evaluation' returning id`;
  if (services.length!==1) throw new Error('Missing canonical pre-evaluation service');
}

/** Wrap standalone workflow mutations so a failed core write rolls back both. */
export async function workflowMutation<T>(id: string, action: (tx: TransactionSql) => Promise<T>) {
  return db().begin(async tx => { const result=await action(tx); await syncCoreWorkflow(tx,id); return result; });
}

export type CoreFileMetadata = { id?: string; rev?: string; content_hash?: string; storageLocation?: string; path_display?: string };
export async function recordCoreFile(tx: TransactionSql, file: Row, metadata: CoreFileMetadata) {
  if (!await isCoreApplication(file.application_id,tx)) return;
  if (!metadata.id?.startsWith('id:') || !metadata.rev || !['AET_App','AET_App_East'].includes(metadata.storageLocation || ''))
    throw new Error('Verified Dropbox File ID, revision and connection required');
  await tx`insert into ${coreTable(tx,'aet_documents')}(id,application_id,storage_location,storage_file_id,storage_path,storage_rev,storage_content_hash,
    original_filename,mime_type,size_bytes,access_scope)
    values (${file.id},${file.application_id},${metadata.storageLocation!},${metadata.id},${metadata.path_display || file.dropbox_path},${metadata.rev},${metadata.content_hash || null},
      ${file.name},${file.mime_type},${file.bytes},'customer_input')
    on conflict(storage_location,storage_file_id) do update set storage_path=excluded.storage_path,storage_rev=excluded.storage_rev,
      storage_content_hash=excluded.storage_content_hash,original_filename=excluded.original_filename,mime_type=excluded.mime_type,
      size_bytes=excluded.size_bytes,updated_at=now()
      where aet_documents.application_id=excluded.application_id and aet_documents.id=excluded.id returning id`;
  const [saved] = await tx`select id from ${coreTable(tx,'aet_documents')} where id=${file.id} and application_id=${file.application_id}`;
  if (!saved) throw new Error('File identity already belongs to another record');
}

const educationPatch=z.object({schoolName:applicationSchema.shape.schoolName,countryOfStudy:applicationSchema.shape.countryOfStudy,
  degreeObtained:applicationSchema.shape.degreeObtained,startDate:applicationSchema.shape.startDate,endDate:applicationSchema.shape.endDate})
  .strict().refine(v=>v.endDate>=v.startDate,{message:'End date must follow start date',path:['endDate']});
/** Server-authorized staff adapter; no browser can supply the actor context. */
export async function updateCoreEducation(id: string, educationId: string, input: unknown, version: number,
  actor: { email:string; offices:string[]; includeUnassigned:boolean }) {
  if (!coreRuntimeEnabled()) throw new Error('Core runtime is not enabled');
  const v=educationPatch.parse(input);
  return db().begin(async tx=>{
    const [workflow]=await workflowRows(tx,id,true);
    const [app]=await tx`select * from ${coreTable(tx,'aet_core_applications')} where id=${id} for update`;
    if (!workflow || !app || !(app.office===null ? actor.includeUnassigned : actor.offices.includes(app.office))) throw new AppError('access_denied',403);
    if (app.version!==version) throw new AppError('stale_application',409);
    const rows=await tx`update ${coreTable(tx,'aet_education')} set school_name=${v.schoolName},country_of_study=${v.countryOfStudy},degree_obtained=${v.degreeObtained},
      study_start_date=${tx.json(month(v.startDate))},study_end_date=${tx.json(month(v.endDate))},updated_at=now() where id=${educationId} and application_id=${id} returning id`;
    if (!rows.length) throw new AppError('not_found',404);
    if (converged()) {
      if(workflow.status==='cancelled')throw new AppError('application_cancelled',409);
      await queueInput(tx,id,workflow.uploads_pending?'idle':'queued',workflow.uploads_pending);
      await tx`insert into ${table('preeval.audit')}(application_id,actor,action,detail) values (${id},${actor.email},'education.updated',${tx.json({educationId})})`;
      return;
    }
    const changed=await tx`update ${table("preeval.applications")} set result=null,input_version=input_version+1,status='processing',
      ai_status=case when uploads_pending then 'idle' else 'queued' end,ai_active_run=null,ai_locked_at=null,ai_attempts=0,ai_error=null,ai_available_at=now(),updated_at=clock_timestamp()
      where id=${id} and status<>'cancelled' returning id`;
    if (!changed.length) throw new AppError('application_cancelled',409);
    await syncCoreWorkflow(tx,id);
    await tx`insert into ${table("preeval.audit")}(application_id,actor,action,detail) values (${id},${actor.email},'education.updated',${tx.json({educationId})})`;
  });
}

export async function coreAdminApplications(search:string,status:string,page:number,staff:Row) {
  if(converged())return adminConverged(search,status,page,staff);
  const pattern='%'+search.replace(/[\\%_]/g,'\\$&')+'%';
  await assertCoreConnection(db());
  return db()`with records as (
    select a.id,a.first_name,a.last_name,a.email,a.status,w.payment_status,w.ai_status,a.created_at,a.updated_at,a.office,e.school_name,e.degree_obtained,
      (select count(*)::int from ${coreTable(db(),'aet_documents')} d where d.application_id=a.id and d.access_scope='customer_input') file_count
      from ${coreTable(db(),'aet_core_applications')} a join ${table('preeval.applications')} w on w.id=a.id and w.office is not distinct from a.office
      join ${coreTable(db(),'aet_service_detail')} s on s.application_id=a.id and s.service_type='pre-evaluation'
      join ${coreTable(db(),'aet_education')} e on e.application_id=a.id and s.details->'education_ids' @> jsonb_build_array(e.id::text)
    union all
    select a.id,a.first_name,a.last_name,a.email,a.status,a.payment_status,a.ai_status,a.created_at,a.updated_at,a.office,e.school_name,e.degree_obtained,
      (select count(*)::int from ${table('preeval.files')} f where f.application_id=a.id and f.state='ready')
      from ${table('preeval.applications')} a join ${table('preeval.educations')} e on e.application_id=a.id
      where not exists(select 1 from ${coreTable(db(),'aet_core_applications')} c where c.id=a.id)
  ) select a.*,(select count(*)::int from ${table('preeval.emails')} m where m.application_id=a.id and m.state='failed') email_failures,
    count(*) over()::int total from records a
    where (${!staff.offices} or a.office=any(${staff.offices || []}::text[]) or (a.office is null and ${Boolean(staff.include_unassigned)}))
    and (${status}='all' or a.status=${status} or a.payment_status=${status} or a.ai_status=${status})
    and concat_ws(' ',a.first_name,a.last_name,a.email,a.id::text,a.school_name) ilike ${pattern}
    order by a.created_at desc,a.id limit 20 offset ${(page-1)*20}`;
}
