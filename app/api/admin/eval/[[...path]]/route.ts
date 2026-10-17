import { readFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  guard,
  db,
  EvalError,
  bodyBytes,
  jsonBody,
  storageFetch,
  responseHeaders,
  EVAL_BUCKET,
  EVAL_PROJECT,
} from "@/lib/eval/server";
import {
  ReportSchema,
  SaveSchema,
  AssistantSchema,
  uuid,
} from "@/lib/eval/validation";
import { signatureFiles } from "@/lib/eval/assets";
import { analyzePdfWithGemini, assistReport } from "@/lib/eval/gemini/client";
import { generateDocx } from "@/lib/eval/docx";
import type { SampleData } from "@/lib/eval/report-data";
import type { Part } from "@google/genai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;
type Context = { params: Promise<{ path?: string[] }> };
type Report = {
  id: string;
  name: string;
  content: SampleData;
  updated_at: string;
  created_at: string;
};
type Chat = {
  id: string;
  role: string;
  content: string;
  image_urls: string[] | null;
  created_at: string;
};
const json = (value: unknown, status = 200) =>
  Response.json(value, { status, headers: responseHeaders });
const attachmentPath = (value: string) => {
  if (!/^[a-f0-9-]{36}\/[a-zA-Z0-9_.-]+$/.test(value) || value.includes(".."))
    throw new EvalError("Invalid attachment path");
  return value;
};
const objectUrl = (name: string) =>
  `https://${EVAL_PROJECT}.supabase.co/storage/v1/object/authenticated/${EVAL_BUCKET}/${name}`;
const proxyUrl = (value: string) => {
  const prefix = `https://${EVAL_PROJECT}.supabase.co/storage/v1/object/authenticated/${EVAL_BUCKET}/`;
  return value.startsWith(prefix)
    ? `/api/admin/eval/attachments?path=${encodeURIComponent(attachmentPath(value.slice(prefix.length)))}`
    : "";
};
async function report(id: string) {
  uuid.parse(id);
  const rows = await db<Report[]>(`aet_fce_aice_report?id=eq.${id}&select=*`);
  if (!rows[0]) throw new EvalError("Report not found.", 404);
  return rows[0];
}
async function form(request: Request, max: number) {
  const bytes = await bodyBytes(request, max + 100000);
  const data = await new Response(bytes, {
    headers: { "Content-Type": request.headers.get("content-type") || "" },
  }).formData();
  const file = data.get("file");
  if (!(file instanceof File) || !file.size || file.size > max)
    throw new EvalError("Choose a file within the upload limit.", 400);
  return { file, bytes: Buffer.from(await file.arrayBuffer()) };
}
async function handle(request: Request, context: Context) {
  try {
    guard(request);
    const { path: parts = [] } = await context.params;
    const [area, id] = parts;
    const url = new URL(request.url);
    if (parts.length > 2) throw new EvalError("Not found", 404);
    if (request.method === "GET") {
      if (area === "reports" && !id) {
        const offset = z.coerce
          .number()
          .int()
          .min(0)
          .max(100000)
          .parse(url.searchParams.get("offset") || 0);
        const rows = await db<unknown[]>(
          `aet_fce_aice_report?select=id,name,created_at,updated_at,archived_at,applicant:content->>name,country:content->>country,ref_no:content->>refNo&order=updated_at.desc,id.asc&limit=101&offset=${offset}`,
        );
        return json({
          reports: rows.slice(0, 100),
          hasMore: rows.length > 100,
        });
      }
      if (area === "reports" && id) return json(await report(id));
      if (area === "history" && id) {
        await report(id);
        const offset = z.coerce
          .number()
          .int()
          .min(0)
          .parse(url.searchParams.get("offset") || 0);
        return json(
          await db(
            `report_history?report_id=eq.${id}&select=id,created_at,created_by&order=created_at.desc,id.desc&limit=50&offset=${offset}`,
          ),
        );
      }
      if (area === "revision" && id) {
        uuid.parse(id);
        const rows = await db<unknown[]>(`report_history?id=eq.${id}&select=*`);
        if (!rows[0]) throw new EvalError("Version not found", 404);
        return json(rows[0]);
      }
      if (area === "chat" && id) {
        await report(id);
        const rows = await db<Chat[]>(
          `report_chat_history?report_id=eq.${id}&select=*&order=created_at.desc,id.desc&limit=100`,
        );
        return json(
          rows
            .reverse()
            .map((row) => ({
              ...row,
              image_urls: row.image_urls?.map(proxyUrl).filter(Boolean) || [],
            })),
        );
      }
      if (area === "rules")
        return json(
          await db(
            "aet_aice_grade_conversion_rules?select=*&order=country.asc&limit=500",
          ),
        );
      if (
        area === "assets" &&
        id &&
        [...signatureFiles, "AET-seal.jpg", "AET-watermark.png"].includes(id)
      ) {
        const bytes = await readFile(
          path.join(process.cwd(), "lib/eval/assets", id),
        );
        return new Response(bytes, {
          headers: {
            ...responseHeaders,
            "Content-Type": id.endsWith(".jpg") ? "image/jpeg" : "image/png",
          },
        });
      }
      if (area === "attachments") {
        const name = attachmentPath(url.searchParams.get("path") || "");
        const res = await storageFetch(
          `/storage/v1/object/${EVAL_BUCKET}/${name}`,
        );
        if (!res.ok) throw new EvalError("Attachment not found", 404);
        const mime = res.headers.get("content-type") || "";
        if (!/^image\/(png|jpeg|webp)/.test(mime))
          throw new EvalError("Unsupported attachment type", 415);
        return new Response(await res.arrayBuffer(), {
          headers: {
            ...responseHeaders,
            "Content-Type": mime,
            "Content-Security-Policy": "default-src 'none'; sandbox",
          },
        });
      }
    }
    if (request.method === "POST") {
      if (area === "reports" && !id) {
        const input = SaveSchema.parse(await jsonBody(request));
        return json(
          await db("rpc/aet_eval_save_report", {
            method: "POST",
            body: JSON.stringify({
              p_id: input.id,
              p_name: input.name,
              p_content: input.content,
              p_expected_updated_at: input.expectedUpdatedAt,
            }),
          }),
        );
      }
      if (area === "export") {
        const input = ReportSchema.parse(await jsonBody(request));
        const file = await generateDocx(input);
        return new Response(new Uint8Array(file), {
          headers: {
            ...responseHeaders,
            "Content-Type":
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "Content-Disposition": 'attachment; filename="AET-Evaluation.docx"',
          },
        });
      }
      if (area === "parse") {
        const { bytes } = await form(request, 20 * 1024 * 1024);
        if (bytes.subarray(0, 5).toString() !== "%PDF-")
          throw new EvalError("Please choose a PDF document.");
        return json(
          await analyzePdfWithGemini(
            bytes.buffer.slice(
              bytes.byteOffset,
              bytes.byteOffset + bytes.byteLength,
            ) as ArrayBuffer,
          ),
        );
      }
      if (area === "attachments") {
        const reportId = uuid.parse(url.searchParams.get("reportId"));
        await report(reportId);
        const { file, bytes } = await form(request, 5 * 1024 * 1024);
        const mime = bytes
          .subarray(0, 8)
          .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
          ? "image/png"
          : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
            ? "image/jpeg"
            : bytes.subarray(0, 4).toString() === "RIFF" &&
                bytes.subarray(8, 12).toString() === "WEBP"
              ? "image/webp"
              : null;
        if (!mime || mime !== file.type)
          throw new EvalError("Choose a PNG, JPEG, or WebP image.");
        const name = `${reportId}/${randomUUID()}.${mime === "image/png" ? "png" : mime === "image/jpeg" ? "jpg" : "webp"}`;
        const result = await storageFetch(
          `/storage/v1/object/${EVAL_BUCKET}/${name}`,
          {
            method: "POST",
            body: bytes,
            headers: { "Content-Type": mime, "x-upsert": "false" },
          },
        );
        if (!result.ok) throw new EvalError("Image upload failed.", 502);
        return json({ path: name, url: proxyUrl(objectUrl(name)) });
      }
      if (area === "ai") {
        const input = AssistantSchema.parse(await jsonBody(request));
        await report(input.reportId);
        const history = await db<Chat[]>(
          `report_chat_history?report_id=eq.${input.reportId}&select=role,content&order=created_at.desc&limit=12`,
        );
        const images: Part[] = [];
        for (const value of input.imagePaths) {
          const name = attachmentPath(value);
          if (!name.startsWith(input.reportId + "/"))
            throw new EvalError("Image belongs to another report.");
          const file = await storageFetch(
            `/storage/v1/object/${EVAL_BUCKET}/${name}`,
          );
          if (!file.ok) throw new EvalError("Image could not be read.");
          const bytes = await file.arrayBuffer();
          if (bytes.byteLength > 5 * 1024 * 1024)
            throw new EvalError("Image is too large.");
          images.push({
            inlineData: {
              mimeType: file.headers.get("content-type") || "image/png",
              data: Buffer.from(bytes).toString("base64"),
            },
          });
        }
        const answer = await assistReport(
          input.content,
          input.message,
          history.reverse(),
          images,
        );
        await db("report_chat_history", {
          method: "POST",
          body: JSON.stringify([
            {
              report_id: input.reportId,
              role: "user",
              content: input.message,
              image_urls: input.imagePaths.map(objectUrl),
              created_at: new Date().toISOString(),
            },
            {
              report_id: input.reportId,
              role: "assistant",
              content: answer.reply,
              image_urls: [],
              created_at: new Date(Date.now() + 1).toISOString(),
            },
          ]),
        });
        return json(answer);
      }
    }
    if (request.method === "PATCH" && area === "reports" && id) {
      uuid.parse(id);
      const input = z
        .object({
          expectedUpdatedAt: z.string().datetime({ offset: true }),
          archived: z.boolean(),
        })
        .parse(await jsonBody(request));
      return json(
        await db("rpc/aet_eval_set_archived", {
          method: "POST",
          body: JSON.stringify({
            p_id: id,
            p_expected_updated_at: input.expectedUpdatedAt,
            p_archived: input.archived,
          }),
        }),
      );
    }
    throw new EvalError("Not found", 404);
  } catch (error) {
    if (error instanceof EvalError)
      return json({ error: error.message }, error.status);
    if (error instanceof z.ZodError)
      return json(
        {
          error: "Please check the report fields and try again.",
          fields: error.issues.map((i) => i.path.join(".")).slice(0, 8),
        },
        400,
      );
    return json(
      {
        error:
          "The request could not be completed. Your draft is still available.",
      },
      500,
    );
  }
}
export { handle as GET, handle as POST, handle as PATCH };
