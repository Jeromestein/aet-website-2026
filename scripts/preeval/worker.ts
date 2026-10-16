import { configuration } from "../../lib/preeval/config";
import { processAI } from "../../lib/preeval/ai";
import { flushEmails } from "../../lib/preeval/email";
import { db } from "../../lib/preeval/db";
import { publishIfReady } from "../../lib/preeval/payments";

let stop = false;
process.on("SIGTERM", () => {
  stop = true;
});
process.on("SIGINT", () => {
  stop = true;
});
async function main() {
  if (configuration().cloudPreview) throw new Error("Cloud preview workers are disabled.");
  console.log(
    "AET local worker started (Codex account authentication, Resend test recipient).",
  );
  do {
    try {
      await flushEmails();
      const pending =
        await db()`select id from preeval.applications where payment_status='paid' and result is not null and status not in ('cancelled','needs_information')`;
      for (const row of pending) await publishIfReady(row.id);
      const processed = await processAI();
      await flushEmails();
      if (process.argv.includes("--once")) break;
      if (!processed) await new Promise((resolve) => setTimeout(resolve, 2500));
    } catch (error) {
      console.error(
        "Worker cycle failed:",
        error instanceof Error ? error.name : "unknown",
      );
      if (process.argv.includes("--once")) {
        process.exitCode = 1;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  } while (!stop);
  await db().end();
}
main().catch(() => {
  console.error("Worker could not start. Check local configuration.");
  process.exitCode = 1;
});
