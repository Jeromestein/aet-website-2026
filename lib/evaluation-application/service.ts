import { queueFeeUpdateEmail } from './email';
import { fromLegacyFormal } from '../legacy-application/mapping';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { table, db } from '../preeval/db';
import { authorize, hash, session } from '../preeval/auth';
import { requireStaffApplication } from '../staff/session';
import { configuration } from '../preeval/config';
import { AppError, validFile } from '../preeval/domain';
import { filePath, uploadFile } from '../preeval/dropbox';
import { cookieName, keySchema } from './server';
import { canDownloadReport, confirmQuote, payableTotal, staffSchema, type ApplicationRecord } from './workflow';

export async function access(id: string) {
  if (!z.uuid().safeParse(id).success) throw new AppError('not_found', 404);
  const staff = await session();
  if (staff?.role === 'admin') {
    if (staff.offices) await requireStaffApplication('formal', id);
    return { admin: true, actor: staff.email as string };
  }
  const key = (await cookies()).get(cookieName(id))?.value;
  if (key && keySchema.safeParse(key).success) {
    const [row] = await db()`select id from ${table("evaluation.applications")} where id=${id} and
      ((access_hash=${hash(key)} and created_at>now()-interval '24 hours') or exists(select 1 from ${table("evaluation.sessions")} where application_id=${id} and hash=${hash(key)} and expires_at>now()))`;
    if (row) return { admin: false, actor: 'customer' };
  }
  return staffAccess(id);
}
export async function staffAccess(id: string) {
  if (!z.uuid().safeParse(id).success) throw new AppError('not_found', 404);
  const current = await authorize();
  if (current.offices) await requireStaffApplication('formal', id);
  return { admin: true, actor: current.email as string };
}
export async function application(id: string, admin: boolean): Promise<ApplicationRecord> {
  const [row] = await db()`select id,locale,data,quote,status,payment_status,version,input_version,confirmed_quote,customer_message,released_file_id,created_at,updated_at from ${table("evaluation.applications")} where id=${id}`;
  if (!row) throw new AppError('not_found', 404);
  const [legacy] = await db()`select * from ${table("public.fce_applications")} where id=${id}`;
  if (legacy) {
    const educationRows = await db()`select * from ${table("public.fce_educations")} where application_id=${id} order by array_position(${legacy.service_type.websiteQuote?.educationIds || []}::text[],id::text),id`;
    row.data = fromLegacyFormal(legacy, educationRows, row.data);
    // Old local pilot receipts without a public record remain readable.
    // The submitted price snapshot is never recomputed from today's catalog.
    if (legacy.service_type.websiteQuote?.version === 1) {
      const { version: _version, educationIds: _educationIds, ...savedQuote } = legacy.service_type.websiteQuote;
      row.quote = savedQuote;
    }
  }
  const files = await db()`select id,kind,name,bytes,input_version,created_at from ${table("evaluation.files")} where application_id=${id} and state='ready' order by created_at`;
  row.files = files.filter(f => admin || f.kind === 'document' || canDownloadReport(row as ApplicationRecord, f.id));
  row.total = payableTotal(row as ApplicationRecord);
  if (!admin) row.released_file_id = row.files.find((f: { kind: string }) => f.kind === 'report')?.id ?? null;
  if (admin) {
    const [privateFields] = await db()`select staff_notes from ${table("evaluation.applications")} where id=${id}`;
    row.staff_notes = privateFields.staff_notes;
    row.payments = await db()`select id,session_id,amount_cents,status,created_at from ${table("evaluation.payments")} where application_id=${id} order by created_at desc`;
    row.audit = await db()`select id,actor,action,created_at from ${table("evaluation.audit")} where application_id=${id} order by created_at desc limit 100`;
  }
  return row as ApplicationRecord;
}
export async function addFile(id: string, file: File, kind: 'document' | 'report', actor: string) {
  const data = Buffer.from(await file.arrayBuffer());
  if (!validFile(data, file.type) || (kind === 'report' && file.type !== 'application/pdf')) throw new AppError('invalid_file');
  const digest = createHash('sha256').update(data).digest('hex');
  const row = await db().begin(async tx => {
    const [app] = await tx`select * from ${table("evaluation.applications")} where id=${id} for update`;
    if (!app || ['cancelled', 'completed'].includes(app.status)) throw new AppError('application_locked', 409);
    const version = kind === 'report' ? app.input_version : 0;
    const [old] = await tx`select * from ${table("evaluation.files")} where application_id=${id} and kind=${kind} and sha256=${digest} and input_version=${version}`;
    if (old?.state === 'ready') return old;
    if (old?.state === 'uploading' && Date.now() - new Date(old.created_at).getTime() < 120000) throw new AppError('upload_in_progress', 409);
    const [{ count }] = await tx`select count(*)::int from ${table("evaluation.files")} where application_id=${id} and kind=${kind} and state<>'failed'`;
    if (count >= (kind === 'report' ? 10 : 20) && !old) throw new AppError('file_limit');
    const fileId = old?.id ?? randomUUID();
    const name = file.name.replace(/[\\/\x00-\x1f\x7f]/g, '_').slice(0, 180) || 'document';
    const path = old?.dropbox_path || await filePath({ id, office: app.data.client.office, first_name: app.data.evaluee.first, middle_name: app.data.evaluee.middle, last_name: app.data.evaluee.last, submitted_at: new Date(app.created_at).toISOString() }, 'evaluation', fileId, name, kind === 'report', tx);
    const [saved] = await tx`insert into ${table("evaluation.files")}(id,application_id,kind,name,mime_type,bytes,sha256,dropbox_path,input_version)
      values(${fileId},${id},${kind},${name},${file.type},${data.length},${digest},${path},${version})
      on conflict(application_id,kind,sha256,input_version) do update set state='uploading',created_at=now() returning *`;
    return saved;
  });
  if (row.state === 'ready') return;
  try { await uploadFile(row.dropbox_path, data); }
  catch { await db()`update ${table("evaluation.files")} set state='failed' where id=${row.id}`; throw new AppError('upload_failed', 502); }
  const ready = await db().begin(async tx => {
    const [app] = await tx`select status from ${table("evaluation.applications")} where id=${id} for update`;
    if (['cancelled', 'completed'].includes(app.status)) {
      await tx`update ${table("evaluation.files")} set state='failed' where id=${row.id}`;
      return false;
    }
    await tx`update ${table("evaluation.files")} set state='ready' where id=${row.id}`;
    await tx`update ${table("evaluation.applications")} set version=version+1,input_version=input_version+${kind === 'document' ? 1 : 0},status=case when ${kind}='document' then 'reviewing' else status end,updated_at=now() where id=${id}`;
    await tx`insert into ${table("evaluation.audit")}(application_id,actor,action,detail) values(${id},${actor},${kind + '.uploaded'},${tx.json({ fileId: row.id })})`;
    return true;
  });
  if (!ready) throw new AppError('application_locked', 409);
}
export async function staffAction(id: string, raw: unknown, actor: string) {
  const body = staffSchema.parse(raw);
  await db().begin(async tx => {
    const [app] = await tx`select * from ${table("evaluation.applications")} where id=${id} for update`;
    if (!app) throw new AppError('not_found', 404);
    if (app.version !== body.version) throw new AppError('stale_version', 409);
    if (app.status === 'cancelled') throw new AppError('application_locked', 409);
    if (body.action === 'notes') await tx`update ${table("evaluation.applications")} set staff_notes=${body.notes} where id=${id}`;
    if (body.action === 'quote') {
      if (app.payment_status !== 'unpaid' || (await tx`select id from ${table("evaluation.payments")} where application_id=${id} and status in ('creating','open','paid')`).length) throw new AppError('quote_locked', 409);
      const confirmed = confirmQuote(app.quote, app.data, body.base, body.additional, body.explanation);
      await tx`update ${table("evaluation.applications")} set confirmed_quote=${tx.json(confirmed)} where id=${id}`;
    }
    if (body.action === 'status') {
      if (body.status === 'needs_information' && body.message.length < 3) throw new AppError('message_required');
      if (body.status === 'processing' && (app.payment_status !== 'paid' || !(await tx`select id from ${table("evaluation.files")} where application_id=${id} and kind='document' and state='ready'`).length)) throw new AppError('payment_and_documents_required', 409);
      await tx`update ${table("evaluation.applications")} set status=${body.status},customer_message=${body.message},released_file_id=null where id=${id}`;
    }
    if (body.action === 'release') {
      const [file] = await tx`select id,input_version from ${table("evaluation.files")} where id=${body.fileId} and application_id=${id} and kind='report' and state='ready'`;
      const pending = await tx`select id from ${table("evaluation.files")} where application_id=${id} and kind='document' and state='uploading'`;
      const docs = await tx`select id from ${table("evaluation.files")} where application_id=${id} and kind='document' and state='ready'`;
      if (app.payment_status !== 'paid' || app.status !== 'processing' || !file || file.input_version !== app.input_version || pending.length || !docs.length) throw new AppError('report_not_ready', 409);
      await tx`update ${table("evaluation.applications")} set status='completed',released_file_id=${file.id},customer_message='' where id=${id}`;
    }
    await tx`update ${table("evaluation.applications")} set version=version+1,updated_at=now() where id=${id}`;
    const [event] = await tx`insert into ${table("evaluation.audit")}(application_id,actor,action,detail) values(${id},${actor},${'staff.' + body.action},${tx.json(body)}) returning id`;
    if (body.action === 'quote') await queueFeeUpdateEmail(tx, id, event.id);
  });
}
export async function makeAccessLink(id: string, actor: string) {
  const token = randomBytes(32).toString('hex');
  const [app] = await db()`select locale from ${table("evaluation.applications")} where id=${id}`;
  if (!app) throw new AppError('not_found', 404);
  await db().begin(async tx => {
    await tx`update ${table("evaluation.access_tokens")} set consumed_at=now() where application_id=${id} and consumed_at is null`;
    await tx`insert into ${table("evaluation.access_tokens")}(hash,application_id,expires_at) values(${hash(token)},${id},now()+interval '24 hours')`;
    await tx`insert into ${table("evaluation.audit")}(application_id,actor,action) values(${id},${actor},'access.link_created')`;
  });
  return `${configuration().origin}/${app.locale}/evaluation-access#token=${token}`;
}
export async function consumeAccess(token: string) {
  if (!keySchema.safeParse(token).success) throw new AppError('invalid_link');
  const key = randomBytes(32).toString('hex');
  const app = await db().begin(async tx => {
    const [used] = await tx`update ${table("evaluation.access_tokens")} set consumed_at=now() where hash=${hash(token)} and expires_at>now() and consumed_at is null returning application_id`;
    if (!used) throw new AppError('invalid_link');
    await tx`insert into ${table("evaluation.sessions")}(hash,application_id,expires_at) values(${hash(key)},${used.application_id},now()+interval '24 hours')`;
    const [row] = await tx`select id,locale from ${table("evaluation.applications")} where id=${used.application_id}`;
    return row;
  });
  return { app, key };
}
