import { NextResponse, after } from 'next/server';
import { z } from 'zod';
import { configuration, required } from '@/lib/preeval/config';
import { authorize, sameOrigin, limit } from '@/lib/preeval/auth';
import { AppError, MAX_FILE_BYTES } from '@/lib/preeval/domain';
import { table, db } from '@/lib/preeval/db';
import { downloadFile } from '@/lib/preeval/dropbox';
import { stripeClient } from '@/lib/preeval/payments';
import { cookieName } from '@/lib/evaluation-application/server';
import { access, staffAccess, application, addFile, staffAction, makeAccessLink, consumeAccess } from '@/lib/evaluation-application/service';
import { checkout, reconcile, cancel, handleStripeEvent } from '@/lib/evaluation-application/payments';
import { canDownloadReport, receiptPath, type ApplicationRecord } from '@/lib/evaluation-application/workflow';
import { flushFormalEmails } from '@/lib/evaluation-application/email';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const privateHeaders = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow', 'Referrer-Policy': 'no-referrer' };
const response = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: privateHeaders });
async function read(request: Request, max = 24000) {
  const reader = request.body?.getReader();
  if (!reader) throw new AppError('invalid_request');
  const chunks: Uint8Array[] = []; let total = 0;
  while (true) { const { value, done } = await reader.read(); if (done) break; total += value.length; if (total > max) { await reader.cancel(); throw new AppError('request_too_large', 413); } chunks.push(value); }
  return Buffer.concat(chunks);
}
async function handler(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    configuration();
    const { path } = await params; const endpoint = path.join('/'); const post = request.method === 'POST';
    if (post && endpoint !== 'stripe-webhook') sameOrigin(request);
    if (endpoint === 'stripe-webhook' && post) {
      const signature = request.headers.get('stripe-signature'); if (!signature) throw new AppError('invalid_signature');
      let event; const raw = await read(request, 1048576);
      try { event = stripeClient().webhooks.constructEvent(raw, signature, required('STRIPE_TEST_WEBHOOK_SECRET')); } catch { throw new AppError('invalid_signature'); }
      await handleStripeEvent(event); after(flushFormalEmails); return response({ received: true });
    }
    const upload = path[0] === 'applications' && path.length === 3 && ['files', 'reports'].includes(path[2]) && post;
    let body: unknown;
    if (post && !upload) { try { body = JSON.parse((await read(request)).toString()); } catch (e) { if (e instanceof AppError) throw e; throw new AppError('invalid_request'); } }
    if (endpoint === 'access/consume' && post) {
      await limit('formal-access-consume', 30, 600);
      const { token } = z.object({ token: z.string() }).strict().parse(body);
      const { app, key } = await consumeAccess(token);
      const res = response({ url: receiptPath(app.locale, app.id) });
      res.cookies.set({ name: cookieName(app.id), value: key, httpOnly: true, sameSite: 'strict', secure: configuration().origin.startsWith('https:'), path: `/api/evaluation/applications/${app.id}`, maxAge: 86400 });
      return res;
    }
    if (endpoint === 'admin/applications' && !post) {
      const current = await authorize(); const url = new URL(request.url); const q = (url.searchParams.get('q') || '').slice(0, 100); const status = url.searchParams.get('status') || 'all';
      const page = Math.max(1, Math.min(10000, Math.trunc(Number(url.searchParams.get('page')) || 1)));
      const filter = '%' + q.replace(/[\\%_]/g, '\\$&') + '%';
      const rows = await db()`select a.id,a.data->'client'->>'name' as name,a.data->'client'->>'email' as email,
        case when l.id is null then nullif(a.data->'client'->>'office','') else l.office end as office,
        a.data->'educations' as educations,a.data->'services' as services,a.status,a.payment_status,a.created_at,a.updated_at,
        (select count(*)::int from ${table("evaluation.files")} where application_id=a.id and kind='document' and state='ready') file_count,count(*) over()::int total
        from ${table("evaluation.applications")} a left join ${table("public.fce_applications")} l on l.id=a.id
        where (${!current.offices} or ((case when l.id is null then nullif(a.data->'client'->>'office','') else l.office end)=any(${current.offices || []}::text[]) or ((case when l.id is null then nullif(a.data->'client'->>'office','') else l.office end) is null and ${Boolean(current.include_unassigned)})))
        and (${status}='all' or a.status=${status} or a.payment_status=${status}) and ((a.data->'client'->>'name')||' '||(a.data->'client'->>'email')||' '||a.id::text) ilike ${filter}
        order by a.created_at desc limit 20 offset ${(page - 1) * 20}`;
      return response({ rows, total: rows[0]?.total || 0, page });
    }
    if (path[0] === 'applications' && path[1]) {
      const id = path[1];
      // Staff routes always require a staff session even when a customer cookie also exists.
      const staffRoute = ['staff', 'reports', 'access-link', 'admin'].includes(path[2]);
      const current = staffRoute ? await staffAccess(id) : await access(id);
      if (!z.uuid().safeParse(id).success) throw new AppError('not_found', 404);
      const [intake]=await db()`select data->>'intakeVersion' as version from ${table('evaluation.applications')} where id=${id}`;
      if(intake?.version==='2') throw new AppError('intake_preview_read_only',409);
      if (path[2] === 'admin' && path.length === 3 && !post) return response(await application(id, true));
      if (path[2] === 'staff' && path.length === 3 && post) { await staffAction(id, body, current.actor); after(flushFormalEmails); return response({ ok: true }); }
      if (path[2] === 'access-link' && path.length === 3 && post) { await limit('formal-link:' + id, 10, 600); return response({ url: await makeAccessLink(id, current.actor) }); }
      if (path[2] === 'checkout' && path.length === 3 && post) { await limit('formal-checkout:' + id, 10, 600); return response({ url: await checkout(id) }); }
      if (path[2] === 'reconcile' && path.length === 3 && post) { await limit('formal-reconcile:' + id, 30, 600); await reconcile(id); after(flushFormalEmails); return response({ ok: true }); }
      if (path[2] === 'cancel' && path.length === 3 && post) { await cancel(id, current.actor); return response({ ok: true }); }
      if (upload) {
        await limit('formal-files:' + id, 40, 600);
        const raw = await read(request, MAX_FILE_BYTES + 65536);
        let form; try { form = await new Response(new Uint8Array(raw), { headers: { 'Content-Type': request.headers.get('content-type') || '' } }).formData(); } catch { throw new AppError('invalid_file'); }
        const file = form.get('file'); if (!(file instanceof File)) throw new AppError('invalid_file');
        await addFile(id, file, path[2] === 'reports' ? 'report' : 'document', current.actor); return response({ ok: true });
      }
      if (path[2] === 'files' && path.length === 4 && !post) {
        if (!z.uuid().safeParse(path[3]).success) throw new AppError('not_found', 404);
        const [file] = await db()`select * from ${table("evaluation.files")} where id=${path[3]} and application_id=${id} and state='ready'`;
        if (!file) throw new AppError('not_found', 404);
        const app = await application(id, current.admin);
        if (!current.admin && file.kind === 'report' && !canDownloadReport(app as ApplicationRecord, file.id)) throw new AppError('access_denied', 403);
        const content = await downloadFile(file.dropbox_path);
        return new NextResponse(new Uint8Array(content), { headers: { ...privateHeaders, 'Content-Type': file.mime_type, 'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`, 'X-Content-Type-Options': 'nosniff' } });
      }
    }
    throw new AppError('not_found', 404);
  } catch (error) {
    if (error instanceof z.ZodError) return response({ error: 'invalid_request' }, 400);
    if (error instanceof AppError) return response({ error: error.code }, error.status);
    console.error('[formal-evaluation]', error instanceof Error ? error.name : 'Unknown error');
    return response({ error: 'service_unavailable' }, 503);
  }
}
export const GET = handler;
export const POST = handler;
