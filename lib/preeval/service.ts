import { sixTableMode } from '../application-core/convergence-mode';
import { compactNotificationRows,retryCompactNotification } from '../application-core/compact-notifications';
import { compact, compactFileRecords, reserveCompactFile, settleCompactFile } from '../application-core/compact-files';
import { converged,submitConverged,staffConverged,workflowRows } from "../application-core/converged-store";
import { coreTable } from '../application-core/connection';
import { coreRuntimeEnabled, isCoreApplication, submitCore, coreProfile, recordCoreFile, workflowMutation } from '../application-core/runtime';
import { createCoreShadowReader } from '../application-core/reader';
import { saveLegacyPreeval } from "../legacy-application/store";
import { pauseForUpload, retryAnalysis } from "./ai-jobs";
import { randomUUID } from "node:crypto";
import { table, db, audit, type Row } from "./db";
import { hash, makeSession, authorize } from "./auth";
import {
  applicationSchema,
  AppError,
  validFile,
  resultSchema,
  canRelease,
} from "./domain";
import { applicationEmail } from "./email";
import { uploadFile, filePath } from "./dropbox";
import { publishIfReady, cancelApplication, canVerifyPreEvaluationPayment } from "./payments";

export async function submit(input: unknown) {
  const value = applicationSchema.safeParse(input);
  if (!value.success) throw new AppError("invalid_application");
  const v = value.data,
    fingerprint = hash(JSON.stringify(v));
  const app = converged() ? await submitConverged(v) : await db().begin(async (tx) => {
    if (coreRuntimeEnabled()) return submitCore(tx,v);
    const [created] =
      await tx`insert into ${table("preeval.applications")}(request_id,request_hash,email,first_name,middle_name,last_name,country,locale,ai_status,ai_pipeline,uploads_pending)
      values (${v.requestId},${fingerprint},${v.email},${v.firstName},${v.middleName},${v.lastName},${v.country},${v.locale},${v.uploadsPending ? 'idle' : 'queued'},'openai',${Boolean(v.uploadsPending)}) on conflict(request_id) do nothing returning *`;
    if (!created) {
      const [existing] =
        await tx`select * from ${table("preeval.applications")} where request_id=${v.requestId}`;
      if (!existing || existing.request_hash !== fingerprint)
        throw new AppError("duplicate_conflict", 409);
      return existing;
    }
    const educationId = randomUUID();
    await saveLegacyPreeval(tx, created.id, educationId, v);
    await tx`insert into ${table("preeval.educations")}(id,application_id,school_name,country_of_study,degree_obtained,start_date,end_date) values (${educationId},${created.id},${v.schoolName},${v.countryOfStudy},${v.degreeObtained},${v.startDate},${v.endDate})`;
    if(!sixTableMode(db())) await tx`insert into ${table("preeval.audit")}(application_id,actor,action) values (${created.id},'customer','application.submitted')`;
    return created;
  });
  await applicationEmail(app, "confirmation");
  return { app, token: compact() ? null : await makeSession(app.id, "customer", app.email) };
}
export async function application(id: string, staff = false) {
  const core = converged() || await isCoreApplication(id);
  // Callers authorize this application before reading it. Recover a saved result
  // without another AI run, including in preview where no delivery worker runs.
  // Publication rechecks eligibility under the application lock. Always read a
  // fresh snapshot afterwards: a refund, upload or staff edit may have won it.
  try { await publishIfReady(id); }
  catch { console.error("Pre-evaluation publication incomplete; the next authorized read will retry."); }
  // Email enqueue happens after the publication commit. Its failure must not
  // hide a successfully published result or fail the customer's status read.
  const [app] = core
    ? await workflowRows(db(), id, false)
    : await db()`select a.*,row_to_json(e) as education from ${table("preeval.applications")} a join ${table("preeval.educations")} e on e.application_id=a.id where a.id=${id}`;
  if (!app) throw new AppError("not_found", 404);
  const [legacy] = core ? [] : await db()`select * from ${table("public.aet_core_applications")} where id=${id}`;
  if (legacy) {
    app.first_name = legacy.first_name; app.middle_name = legacy.middle_name || '';
    app.last_name = legacy.last_name; app.email = legacy.email;
    const [education] = await db()`select * from ${table("public.aet_core_educations")} where id=${app.education.id} and application_id=${id}`;
    if (education) app.education = { ...education,
      start_date: `${education.study_start_date.year}-${education.study_start_date.month}`,
      end_date: `${education.study_end_date.year}-${education.study_end_date.month}` };
  }
  if (core) Object.assign(app,await coreProfile(db(),id));
  const files =
    compact() ? await db()`select * from (${compactFileRecords(db())}) f where application_id=${id} order by created_at` :
    await db()`select id,name,mime_type,bytes,state,created_at from ${table("preeval.files")} where application_id=${id} order by created_at`;
  const visible =
    staff ||
    (canRelease(app.payment_status, app.status) && app.status === "completed" &&
      app.ai_status === "completed" && !app.uploads_pending);
  const response: Row = {
    id: app.id,
    first_name: app.first_name,
    last_name: app.last_name,
    middle_name: app.middle_name,
    email: app.email,
    country: app.country,
    locale: app.locale,
    status: app.status,
    payment_status: app.payment_status,
    ai_status: app.ai_status,
    uploads_pending: app.uploads_pending,
    document_issue: /^(document_|pdf_|image_|invalid_document|unreadable_document|encrypted_document|unsupported_document|uploads_incomplete)/.test(app.ai_error || ""),
    result: visible ? app.result : null,
    result_version: visible ? app.result_version : 0,
    // Legacy education rows include ai_output; never expose it through the customer payload.
    education: {
      id: app.education.id,
      school_name: app.education.school_name,
      country_of_study: app.education.country_of_study,
      degree_obtained: app.education.degree_obtained,
      start_date: app.education.start_date,
      end_date: app.education.end_date,
    },
    files,
    created_at: app.created_at,
    updated_at: app.updated_at,
  };
  if (core) {
    // Keep recoverable failed/uploading attempts; successful files and released
    // results come from canonical records and their strict version/payment gate.
    const canonical = await (await createCoreShadowReader(db())).status(id,{role:'customer',applicationId:id});
    Object.assign(response,canonical,{locale:app.locale,files:[...canonical.files,...files.filter(f=>f.state!=='ready')]});
  }
  if (staff) {
    if (core) {
      const [service]=await db()`select result from ${coreTable(db(),'aet_service_detail')} where application_id=${id} and service_type='pre-evaluation'`;
      response.result=service?.result?.content ?? null;
      response.result_version=service?.result?.version ?? 0;
    }
    response.payment_verification_enabled = canVerifyPreEvaluationPayment();
    response.office = app.office;
    response.notes = app.notes;
    response.ai_error = app.ai_error;
    response.legacy_id = app.legacy_id;
    response.emails =
      compact()?await compactNotificationRows(id):await db()`select id,kind,state,attempts,provider_id,error,sent_at,created_at from ${table("preeval.emails")} where application_id=${id} order by created_at desc`;
    response.audit = sixTableMode(db()) ? [] :
      await db()`select actor,action,detail,created_at from ${table("preeval.audit")} where application_id=${id} order by created_at desc limit 50`;
    response.payments =
      converged() ? await db()`select checkout_session_id as session_id,amount_cents,payment_status as status,refunded_cents,created_at from aet.aet_payments where application_id=${id} order by created_at desc` : await db()`select session_id,amount_cents,status,refunded_cents,created_at from ${table("preeval.payments")} where application_id=${id} order by created_at desc`;
    response.runs =
      await db()`select id,input_version,input,output,state,error,created_at,model,response_id,usage,prompt_version from ${table("preeval.ai_runs")} where application_id=${id} order by created_at desc limit 10`;
  }
  return response;
}
export async function addFile(id: string, file: File, actor: string) {
  const [app] =
    await workflowRows(db(), id, false);
  if (!app || app.status === "cancelled")
    throw new AppError("application_cancelled", 409);
  const data = Buffer.from(await file.arrayBuffer());
  if (!validFile(data, file.type)) throw new AppError("invalid_file");
  const name = file.name.replace(/[\\/\x00-\x1f]/g, "_").slice(0, 180),
    digest = hash(data.toString("base64"));
  const record = await db().begin(async (tx) => {
    const [locked] = await workflowRows(tx, id, true);
    if (!locked || locked.status === "cancelled") throw new AppError("application_cancelled", 409);
    const [existing] =
      compact() ? await tx`select * from (${compactFileRecords(tx)}) f where application_id=${id} and sha256=${digest}` :
      await tx`select * from ${table("preeval.files")} where application_id=${id} and sha256=${digest}`;
    if (existing?.state === "ready") return existing;
    if (
      existing?.state === "uploading" &&
      Date.now() - new Date(existing.created_at).getTime() < 120000
    )
      throw new AppError("upload_in_progress", 409);
    if (
      !existing &&
      (compact() ? await tx`select id from aet.aet_documents where application_id=${id} and access_scope='customer_input'` : await tx`select id from ${table("preeval.files")} where application_id=${id}`)
        .length >= 5
    )
      throw new AppError("file_limit");
    await pauseForUpload(id, tx);
    const fileId = existing?.id || randomUUID(),
      path = (!await isCoreApplication(id,tx) && existing?.dropbox_path) || await filePath({ ...app, created_at: new Date(app.created_at).toISOString() }, 'pre-evaluation', fileId, name, false, tx);
    const [row] = compact() ? [await reserveCompactFile(tx,{id:fileId,applicationId:id,name,mime:file.type,size:data.length,digest,path})] :
      await tx`insert into ${table("preeval.files")}(id,application_id,name,mime_type,bytes,sha256,dropbox_path) values (${fileId},${id},${name},${file.type},${data.length},${digest},${path})
      on conflict(application_id,sha256) do update set state='uploading',created_at=clock_timestamp() returning *,created_at::text as version`;
    return row;
  });
  if (record.state === "ready") return;
  try {
    await db().begin(async tx => {
      const [locked] = await workflowRows(tx, id, true);
      if (!locked || locked.status === 'cancelled') throw new AppError('application_cancelled', 409);
      const [current] = compact() ? await tx`select id from aet.aet_documents where id=${record.id} and application_id=${id} and upload_version::text=${record.version} and upload_state='uploading' for update` : await tx`select id from ${table("preeval.files")} where id=${record.id}
        and created_at=${record.version}::text::timestamptz and state='uploading' for update`;
      if (!current) throw new AppError('upload_expired', 409);
      // Keep the claim through storage so an abandoned/retried attempt cannot
      // overwrite a newer file or revive its index through a late callback.
      const metadata = await uploadFile(record.dropbox_path, data);
      await recordCoreFile(tx,record,metadata);
      if(compact())await settleCompactFile(tx,record.id,record.version,'ready');
      else await tx`update ${table("preeval.files")} set state='ready' where id=${record.id}`;
      if(!sixTableMode(db())) await tx`insert into ${table("preeval.audit")}(application_id,actor,action,detail) values (${id},${actor},'file.uploaded',${tx.json({ fileId: record.id })})`;
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    if(compact())await settleCompactFile(db(),record.id,record.version,'failed');
    else await db()`update ${table("preeval.files")} set state='failed' where id=${record.id}
      and created_at=${record.version}::text::timestamptz and state='uploading'`;
    throw new AppError('upload_failed', 502);
  }
}
export async function staffAction(id: string, body: Row, actor: string) {
  if(compact()&&body.action==='retry_email')return retryCompactNotification(id,String(body.emailId));
  if (converged() && body.action !== "retry_email") return staffConverged(id,body,actor);
  if (body.action === "notes") {
    if (typeof body.notes !== "string" || body.notes.length > 5000)
      throw new AppError("invalid_request");
    await workflowMutation(id, async tx => { await tx`update ${table("preeval.applications")} set notes=${body.notes},updated_at=now() where id=${id}`; });
    await audit(id, actor, "notes.updated");
  } else if (body.action === "result") {
    const result = resultSchema.safeParse(body.result);
    if (!result.success) throw new AppError("invalid_result");
    const updated =
      await workflowMutation(id, async tx => tx`update ${table("preeval.applications")} set result=${tx.json(result.data)},result_version=result_version+1,result_source='staff',ai_active_run=null,ai_locked_at=null,ai_status='completed',status='processing',input_version=input_version+1,updated_at=now() where id=${id} and status<>'cancelled' and not uploads_pending returning id`);
    if (!updated.length) throw new AppError("application_cancelled", 409);
    await audit(id, actor, "result.corrected");
    await publishIfReady(id);
  } else if (body.action === "retry_ai") {
    await retryAnalysis(id, true);
    await audit(id, actor, "ai.retry_requested");
  } else if (body.action === "retry_email") {
    if (typeof body.emailId !== "string") throw new AppError("invalid_request");
    const retried = await db()`update ${table("preeval.emails")} set state='queued',attempts=0,available_at=now()
      where id=${body.emailId} and application_id=${id} and state='failed' and available_at<>'infinity'::timestamptz
      and (first_attempt_at is null or first_attempt_at>now()-interval '23 hours') returning id`;
    if (!retried.length) throw new AppError("email_requires_review",409);
    await audit(id, actor, "email.retry_requested");
  } else if (body.action === "information") {
    if (
      typeof body.message !== "string" ||
      body.message.trim().length < 3 ||
      body.message.length > 2000
    )
      throw new AppError("invalid_request");
    const [app] =
      await workflowMutation(id, async tx => tx`update ${table("preeval.applications")} set status='needs_information',input_version=input_version+1,result=null,
        ai_status='idle',ai_active_run=null,ai_locked_at=null,ai_error=null,ai_attempts=0,updated_at=now() where id=${id} and status<>'cancelled' returning *`);
    if (!app) throw new AppError("application_cancelled", 409);
    const [request] = await db()`insert into ${table("preeval.audit")}(application_id,actor,action,detail)
      values (${id},${actor},'information.requested',${db().json({message:body.message})}) returning id`;
    await applicationEmail(app, "information", request.id);
  } else if (body.action === "cancel") await cancelApplication(id, actor);
  else throw new AppError("invalid_request");
}
