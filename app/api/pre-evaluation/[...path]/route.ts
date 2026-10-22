import { NextResponse, after } from "next/server";
import { z } from "zod";
import { table, db } from "@/lib/preeval/db";
import { configuration, required } from "@/lib/preeval/config";
import { AppError, resultPath, MAX_FILE_BYTES } from "@/lib/preeval/domain";
import {
  authorize,
  consumeLink,
  sessionCookie,
  sameOrigin,
  limit,
  hash,
  COOKIE,
} from "@/lib/preeval/auth";
import {
  applicationEmail,
  deliverApplicationEmails,
} from "@/lib/preeval/email";
import {
  submit,
  application,
  addFile,
  staffAction,
} from "@/lib/preeval/service";
import {
  checkout,
  reconcile,
  handleStripeEvent,
  stripeClient,
  cancelApplication,
} from "@/lib/preeval/payments";
import { flushFormalEmails } from '@/lib/evaluation-application/email';
import { handleStripeEvent as handleFormalEvent } from '@/lib/evaluation-application/payments';
import { completeUploads, retryAnalysis } from "@/lib/preeval/ai-jobs";
import { scheduleAI } from "@/lib/preeval/ai-scheduler";
import { downloadFile } from "@/lib/preeval/dropbox";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";
const response = (value: unknown, status = 200) =>
  NextResponse.json(value, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
      "Referrer-Policy": "no-referrer",
    },
  });
const uuid = (id: string) => {
  if (!z.uuid().safeParse(id).success) throw new AppError("not_found", 404);
  return id;
};
async function read(request: Request, max = 24000) {
  const reader = request.body?.getReader();
  if (!reader) throw new AppError("invalid_request");
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > max) {
      await reader.cancel();
      throw new AppError("request_too_large", 413);
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}
async function handler(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    configuration();
    const { path } = await params,
      endpoint = path.join("/"),
      isPost = request.method === "POST";
    if (isPost && endpoint !== "stripe-webhook") sameOrigin(request);
    if (endpoint === "stripe-webhook" && isPost) {
      const raw = await read(request, 1024 * 1024),
        signature = request.headers.get("stripe-signature");
      if (!signature) throw new AppError("invalid_signature");
      let event;
      try {
        event = stripeClient("pre-evaluation").webhooks.constructEvent(
          raw,
          signature,
          required("STRIPE_TEST_WEBHOOK_SECRET"),
        );
      } catch {
        throw new AppError("invalid_signature");
      }
      await handleStripeEvent(event);
      // The preview opt-in authorizes pre-evaluation payments only.
      if (!configuration().cloudPreview) {
        await handleFormalEvent(event);
        after(flushFormalEmails);
      }
      if (event.type.startsWith("checkout.session.")) {
        const metadata = (event.data.object as { metadata?: Record<string, string> }).metadata;
        if (metadata?.pilot === "aet-2026-local" && z.uuid().safeParse(metadata.applicationId).success)
          after(() => deliverApplicationEmails(metadata.applicationId));
      }
      return response({ received: true });
    }
    const isFileUpload =
      path[0] === "applications" && path[2] === "files" && isPost;
    let body: Record<string, any> = {};
    if (isPost && !isFileUpload) {
      try {
        body = JSON.parse((await read(request)).toString());
      } catch (e) {
        if (e instanceof AppError) throw e;
        throw new AppError("invalid_request");
      }
      if (!body || Array.isArray(body) || typeof body !== "object")
        throw new AppError("invalid_request");
    }
    if (endpoint === "applications" && isPost) {
      await limit("submissions", 30, 3600);
      const result = await submit(body);
      const res = response(
        {
          id: result.app.id,
          url: resultPath(result.app.locale, result.app.id),
        },
        201,
      );
      res.cookies.set(sessionCookie(result.token));
      await scheduleAI(result.app.id);
      after(() => deliverApplicationEmails(result.app.id));
      return res;
    }
    if (endpoint === "access/request" && isPost) {
      await limit("access:global", 30, 600);
      if (
        typeof body.applicationId === "string" &&
        z.uuid().safeParse(body.applicationId).success
      ) {
        await limit("access:" + body.applicationId, 3, 600);
        const [app] =
          await db()`select * from ${table("preeval.applications")} where id=${body.applicationId}`;
        if (app) {
          await applicationEmail(app, "access");
          after(() => deliverApplicationEmails(app.id));
        }
      }
      return response({ ok: true });
    }
    if (endpoint === "access/consume" && isPost) {
      await limit("token-consume", 30, 600);
      const { token, row } = await consumeLink(String(body.token || ""));
      const res = response({
        url: resultPath(row.locale, row.application_id),
      });
      res.cookies.set(sessionCookie(token));
      return res;
    }
    if (endpoint === "logout" && isPost) {
      const current = await authorize(
        body.admin ? undefined : body.applicationId,
      );
      await db()`delete from ${table("preeval.sessions")} where hash=${current.hash}`;
      const res = response({ ok: true });
      res.cookies.set({ ...sessionCookie(""), maxAge: 0 });
      return res;
    }
    if (endpoint === "admin/applications" && !isPost) {
      const current = await authorize();
      const url = new URL(request.url),
        search = (url.searchParams.get("q") || "").slice(0, 100),
        status = url.searchParams.get("status") || "all";
      const page = Math.max(
        1,
        Math.min(10000, Number(url.searchParams.get("page")) || 1),
      );
      const rows =
        await db()`select a.id,a.first_name,a.last_name,a.email,a.status,a.payment_status,a.ai_status,a.created_at,a.updated_at,e.school_name,e.degree_obtained,
        (select count(*)::int from ${table("preeval.files")} f where f.application_id=a.id and f.state='ready') file_count,
        (select count(*)::int from ${table("preeval.emails")} m where m.application_id=a.id and m.state='failed') email_failures,
        count(*) over()::int total
        from ${table("preeval.applications")} a join ${table("preeval.educations")} e on e.application_id=a.id
        where (${!current.offices} or (a.office=any(${current.offices || []}::text[]) or (a.office is null and ${Boolean(current.include_unassigned)})))
        and (${status}='all' or a.status=${status} or a.payment_status=${status} or a.ai_status=${status})
        and (a.first_name||' '||a.last_name||' '||a.email||' '||a.id::text||' '||e.school_name) ilike ${"%" + search + "%"}
        order by a.created_at desc limit 20 offset ${(page - 1) * 20}`;
      return response({ rows, total: rows[0]?.total || 0, page });
    }
    if (path[0] === "applications" && path[1]) {
      const id = uuid(path[1]),
        current = await authorize(id);
      if (path.length === 2 && !isPost) {
        const app = await application(id, current.role === "admin");
        if (['queued', 'running'].includes(app.ai_status)) await scheduleAI(id);
        after(() => deliverApplicationEmails(id));
        return response(app);
      }
      if (path[2] === "uploads-complete" && isPost) {
        await completeUploads(id); await scheduleAI(id); return response({ ok: true });
      }
      if (path[2] === "retry-ai" && isPost) {
        await limit("ai-retry:" + id, 3, 600);
        await retryAnalysis(id); await scheduleAI(id); return response({ ok: true });
      }
      if (path[2] === "checkout" && isPost) {
        await limit("checkout:" + id, 10, 600);
        return response({ url: await checkout(id) });
      }
      if (path[2] === "reconcile" && isPost) {
        await limit("reconcile:" + id, 20, 600);
        await reconcile(id);
        after(() => deliverApplicationEmails(id));
        return response({ ok: true });
      }
      if (path[2] === "cancel" && isPost) {
        await cancelApplication(id, current.email);
        return response({ ok: true });
      }
      if (path[2] === "files" && isPost) {
        await limit("files:" + id, 15, 600);
        const raw = await read(request, MAX_FILE_BYTES + 65536);
        const form = await new Response(new Uint8Array(raw), {
          headers: {
            "Content-Type": request.headers.get("content-type") || "",
          },
        }).formData();
        const file = form.get("file");
        if (!(file instanceof File)) throw new AppError("invalid_file");
        await addFile(id, file, current.email);
        return response({ ok: true });
      }
      if (path[2] === "staff" && isPost) {
        await authorize();
        await staffAction(id, body, current.email);
        if (body.action === "retry_ai") await scheduleAI(id);
        after(() => deliverApplicationEmails(id));
        return response({ ok: true });
      }
    }
    if (path[0] === "files" && path[1] && !isPost) {
      const id = uuid(path[1]);
      const [file] =
        await db()`select * from ${table("preeval.files")} where id=${id} and state='ready'`;
      if (!file) throw new AppError("not_found", 404);
      await authorize(file.application_id);
      const content = await downloadFile(file.dropbox_path);
      return new NextResponse(new Uint8Array(content), {
        headers: {
          "Content-Type": file.mime_type,
          "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`,
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
          "X-Robots-Tag": "noindex",
        },
      });
    }
    throw new AppError("not_found", 404);
  } catch (error) {
    if (error instanceof AppError)
      return response({ error: error.code }, error.status);
    console.error(
      "[pre-evaluation]",
      error instanceof Error ? error.name : "Unexpected error",
    );
    return response({ error: "service_unavailable" }, 503);
  }
}
export const GET = handler;
export const POST = handler;
