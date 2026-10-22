import "server-only";
import { configuration } from "./config";
import { db, table } from "./db";
import { flushEmails } from "./email";
import type { EmailTransport } from "../email/delivery";

/** Recovery authorizes only a finite, operator-selected set, never historical mail globally. */
export function emailRecoveryScope() {
  if (process.env.PREEVAL_EMAIL_RECOVERY_ENABLED !== "true" || process.env.PREEVAL_EMAIL_ENABLED !== "true") return null;
  const config = configuration(); // Retain database role, origin, branch and employee-cutover guards.
  if (process.env.PREEVAL_EMAIL_RECOVERY_ORIGIN !== config.origin ||
      process.env.PREEVAL_EMAIL_RECOVERY_RECIPIENT !== config.recipient) {
    throw new Error("Email recovery environment requires review");
  }
  const ids = (process.env.PREEVAL_EMAIL_RECOVERY_APPLICATION_IDS || "").split(",").map(id => id.trim());
  if (!ids.length || ids.length > 20 || ids.some(id => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))) {
    throw new Error("Email recovery requires 1 to 20 explicit application IDs");
  }
  return { ids: [...new Set(ids.map(id => id.toLowerCase()))], recipient: config.recipient };
}

/** No AI/job eligibility, page lifecycle, detached work or unbounded draining. */
export async function recoverApplicationEmails(transport?: EmailTransport) {
  const scope = emailRecoveryScope();
  if (!scope) return { skipped: true };
  const applications = await db()`select application_id from ${table("preeval.emails")}
    where application_id=any(${scope.ids}::uuid[]) and recipient=${scope.recipient}
      and available_at<>'infinity'::timestamptz
      and ((state in ('queued','failed') and available_at<=now())
        or (state='sending' and locked_at<now()-interval '3 minutes'))
    group by application_id order by min(created_at),application_id limit 3`;
  // Selection is advisory. The existing atomic SKIP LOCKED claim arbitrates overlaps.
  const results = await Promise.allSettled(applications.map(row => flushEmails(transport, row.application_id)));
  const outcome = { applications: applications.length, attempted: 0, sent: 0, reviewRequired: 0, dispatchErrors: 0 };
  for (const result of results) {
    if (result.status === "rejected") { outcome.dispatchErrors++; continue; }
    if (result.value) {
      outcome.attempted += result.value.attempted;
      outcome.sent += result.value.sent;
      outcome.reviewRequired += result.value.reviewRequired;
    }
  }
  return outcome;
}
