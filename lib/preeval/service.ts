import { randomUUID } from "node:crypto";
import { db, audit, type Row } from "./db";
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
import { publishIfReady, cancelApplication } from "./payments";

export async function submit(input: unknown) {
  const value = applicationSchema.safeParse(input);
  if (!value.success) throw new AppError("invalid_application");
  const v = value.data,
    fingerprint = hash(JSON.stringify(v));
  const app = await db().begin(async (tx) => {
    const [created] =
      await tx`insert into preeval.applications(request_id,request_hash,email,first_name,middle_name,last_name,country,locale,ai_status)
      values (${v.requestId},${fingerprint},${v.email},${v.firstName},${v.middleName},${v.lastName},${v.country},${v.locale},'queued') on conflict(request_id) do nothing returning *`;
    if (!created) {
      const [existing] =
        await tx`select * from preeval.applications where request_id=${v.requestId}`;
      if (!existing || existing.request_hash !== fingerprint)
        throw new AppError("duplicate_conflict", 409);
      return existing;
    }
    await tx`insert into preeval.educations(application_id,school_name,country_of_study,degree_obtained,start_date,end_date) values (${created.id},${v.schoolName},${v.countryOfStudy},${v.degreeObtained},${v.startDate},${v.endDate})`;
    await tx`insert into preeval.audit(application_id,actor,action) values (${created.id},'customer','application.submitted')`;
    return created;
  });
  await applicationEmail(app, "confirmation");
  return { app, token: await makeSession(app.id, "customer", app.email) };
}
export async function application(id: string, staff = false) {
  const [app] =
    await db()`select a.*,row_to_json(e) as education from preeval.applications a join preeval.educations e on e.application_id=a.id where a.id=${id}`;
  if (!app) throw new AppError("not_found", 404);
  const files =
    await db()`select id,name,mime_type,bytes,state,created_at from preeval.files where application_id=${id} order by created_at`;
  const visible =
    staff ||
    (canRelease(app.payment_status, app.status) && app.status === "completed");
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
    result: visible ? app.result : null,
    result_version: visible ? app.result_version : 0,
    education: app.education,
    files,
    created_at: app.created_at,
    updated_at: app.updated_at,
  };
  if (staff) {
    response.notes = app.notes;
    response.ai_error = app.ai_error;
    response.legacy_id = app.legacy_id;
    response.emails =
      await db()`select id,kind,state,attempts,provider_id,error,sent_at,created_at from preeval.emails where application_id=${id} order by created_at desc`;
    response.audit =
      await db()`select actor,action,detail,created_at from preeval.audit where application_id=${id} order by created_at desc limit 50`;
    response.payments =
      await db()`select session_id,amount_cents,status,refunded_cents,created_at from preeval.payments where application_id=${id} order by created_at desc`;
    response.runs =
      await db()`select id,input_version,input,output,state,error,created_at from preeval.ai_runs where application_id=${id} order by created_at desc limit 10`;
  }
  return response;
}
export async function addFile(id: string, file: File, actor: string) {
  const [app] =
    await db()`select status from preeval.applications where id=${id}`;
  if (!app || app.status === "cancelled")
    throw new AppError("application_cancelled", 409);
  const data = Buffer.from(await file.arrayBuffer());
  if (!validFile(data, file.type)) throw new AppError("invalid_file");
  const name = file.name.replace(/[\\/\x00-\x1f]/g, "_").slice(0, 180),
    digest = hash(data.toString("base64"));
  const record = await db().begin(async (tx) => {
    await tx`select id from preeval.applications where id=${id} for update`;
    const [existing] =
      await tx`select * from preeval.files where application_id=${id} and sha256=${digest}`;
    if (existing?.state === "ready") return existing;
    if (
      existing?.state === "uploading" &&
      Date.now() - new Date(existing.created_at).getTime() < 120000
    )
      throw new AppError("upload_in_progress", 409);
    if (
      !existing &&
      (await tx`select id from preeval.files where application_id=${id}`)
        .length >= 5
    )
      throw new AppError("file_limit");
    const fileId = existing?.id || randomUUID(),
      path = filePath(
        id,
        fileId,
        file.type === "application/pdf"
          ? "pdf"
          : file.type === "image/png"
            ? "png"
            : "jpg",
      );
    const [row] =
      await tx`insert into preeval.files(id,application_id,name,mime_type,bytes,sha256,dropbox_path) values (${fileId},${id},${name},${file.type},${data.length},${digest},${path})
      on conflict(application_id,sha256) do update set state='uploading',created_at=now() returning *`;
    return row;
  });
  if (record.state === "ready") return;
  try {
    await uploadFile(record.dropbox_path, data);
  } catch {
    await db()`update preeval.files set state='failed' where id=${record.id}`;
    throw new AppError("upload_failed", 502);
  }
  await db().begin(async (tx) => {
    await tx`update preeval.files set state='ready' where id=${record.id}`;
    await tx`update preeval.applications set input_version=input_version+1,ai_status='queued',ai_attempts=0,ai_error=null,result=null,status='processing',updated_at=now() where id=${id} and status<>'cancelled'`;
    await tx`insert into preeval.audit(application_id,actor,action,detail) values (${id},${actor},'file.uploaded',${tx.json({ fileId: record.id })})`;
  });
}
export async function staffAction(id: string, body: Row, actor: string) {
  if (body.action === "notes") {
    if (typeof body.notes !== "string" || body.notes.length > 5000)
      throw new AppError("invalid_request");
    await db()`update preeval.applications set notes=${body.notes},updated_at=now() where id=${id}`;
    await audit(id, actor, "notes.updated");
  } else if (body.action === "result") {
    const result = resultSchema.safeParse(body.result);
    if (!result.success) throw new AppError("invalid_result");
    const updated =
      await db()`update preeval.applications set result=${db().json(result.data)},result_version=result_version+1,result_source='staff',ai_status='completed',status='processing',input_version=input_version+1,updated_at=now() where id=${id} and status<>'cancelled' returning id`;
    if (!updated.length) throw new AppError("application_cancelled", 409);
    await audit(id, actor, "result.corrected");
    await publishIfReady(id);
  } else if (body.action === "retry_ai") {
    const updated =
      await db()`update preeval.applications set ai_status='queued',ai_attempts=0,ai_error=null,input_version=input_version+1,result=null,status='processing',updated_at=now() where id=${id} and status<>'cancelled' returning id`;
    if (!updated.length) throw new AppError("application_cancelled", 409);
    await audit(id, actor, "ai.retry_requested");
  } else if (body.action === "retry_email") {
    if (typeof body.emailId !== "string") throw new AppError("invalid_request");
    await db()`update preeval.emails set state='queued',attempts=0,available_at=now() where id=${body.emailId} and application_id=${id} and state='failed'`;
    await audit(id, actor, "email.retry_requested");
  } else if (body.action === "information") {
    if (
      typeof body.message !== "string" ||
      body.message.trim().length < 3 ||
      body.message.length > 2000
    )
      throw new AppError("invalid_request");
    const [app] =
      await db()`update preeval.applications set status='needs_information',updated_at=now() where id=${id} and status<>'cancelled' returning *`;
    if (!app) throw new AppError("application_cancelled", 409);
    await applicationEmail(app, "information", body.message);
    await audit(id, actor, "information.requested");
  } else if (body.action === "cancel") await cancelApplication(id, actor);
  else throw new AppError("invalid_request");
}
