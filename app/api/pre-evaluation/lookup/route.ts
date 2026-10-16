import { NextRequest, NextResponse } from "next/server";
import { table, db } from "@/lib/preeval/db";
import { limit, makeSession, sameOrigin, sessionCookie } from "@/lib/preeval/auth";
import { customerLookupSchema } from "@/lib/preeval/customer-access";
import { AppError, resultPath } from "@/lib/preeval/domain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const respond = (data: unknown, status = 200) => NextResponse.json(data, {
  status,
  headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow", "Referrer-Policy": "no-referrer" },
});

export async function POST(request: NextRequest) {
  try {
    sameOrigin(request);
    await limit("customer-lookup:global", 200, 600);
    const address = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    await limit("customer-lookup:" + address, 30, 600);
    const reader = request.body?.getReader();
    if (!reader) throw new AppError("invalid_application_id");
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 512) { await reader.cancel(); throw new AppError("request_too_large", 413); }
      chunks.push(value);
    }
    let body: unknown;
    try { body = JSON.parse(Buffer.concat(chunks).toString()); }
    catch { throw new AppError("invalid_application_id"); }
    const parsed = customerLookupSchema.safeParse(body);
    if (!parsed.success) throw new AppError("invalid_application_id");
    const { applicationId, locale } = parsed.data;
    const [app] = await db()`select id,email from ${table("preeval.applications")} where id=${applicationId}`;
    if (!app) throw new AppError("not_found", 404);
    // Keep API/file authorization scoped to this application without customer accounts.
    const token = await makeSession(app.id, "customer", app.email);
    const response = respond({ url: resultPath(locale, app.id) });
    response.cookies.set(sessionCookie(token));
    return response;
  } catch (error) {
    return error instanceof AppError
      ? respond({ error: error.code }, error.status)
      : respond({ error: "service_unavailable" }, 503);
  }
}
