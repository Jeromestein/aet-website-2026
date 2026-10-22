// One invocation for an existing scheduler. Never load the business database or AI.
try {
  const origin = new URL(process.env.PREEVAL_EMAIL_RECOVERY_ORIGIN || "");
  const secret = process.env.CRON_SECRET;
  if (origin.protocol !== "https:" || !/^[a-z0-9-]+\.vercel\.app$/.test(origin.hostname) ||
      origin.port || origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash ||
      !secret || secret.length < 16) throw new Error("configuration");
  const headers = { Authorization: `Bearer ${secret}` };
  if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) headers["x-vercel-protection-bypass"] = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  const response = await fetch(new URL("/api/internal/pre-evaluation/email-recovery", origin), {
    headers, redirect: "error", signal: AbortSignal.timeout(300000),
  });
  const result = await response.json();
  if (!response.ok || result.skipped || typeof result.applications !== "number") throw new Error("recovery");
  // Emit aggregates only, never response bodies, application IDs or credentials.
  console.log(JSON.stringify(Object.fromEntries(["applications", "attempted", "sent", "reviewRequired", "dispatchErrors"]
    .map(key => [key, typeof result[key] === "number" ? result[key] : null]))));
  if (result.reviewRequired) process.exitCode = 2;
} catch {
  console.error("Email recovery did not complete. Check the approved target, opt-in, scheduler credentials and server logs.");
  process.exitCode = 1;
}
