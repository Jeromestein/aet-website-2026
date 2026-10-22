import { timingSafeEqual } from "node:crypto";
import { recoverApplicationEmails } from "@/lib/preeval/email-recovery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;
const json = (body: object, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const provided = Buffer.from(request.headers.get("authorization") || "");
  const expected = Buffer.from(`Bearer ${secret || ""}`);
  if (!secret || secret.length < 16 || provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return json({ error: "unauthorized" }, 401);
  }
  try {
    const outcome = await recoverApplicationEmails();
    return json(outcome, "dispatchErrors" in outcome && outcome.dispatchErrors ? 503 : 200);
  } catch {
    console.error("Pre-evaluation email recovery failed; delivery records remain persisted.");
    return json({ error: "email_recovery_failed" }, 503);
  }
}
