import { environmentValue } from "../../lib/application-environment.mjs";
import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
const key = process.env.STRIPE_TEST_SECRET_KEY;
if (!key?.startsWith("sk_test_") && !key?.startsWith("rk_test_"))
  throw new Error("Stripe test key required.");
const origin = new URL(environmentValue("APP_ORIGIN") || "");
if (!["localhost", "127.0.0.1"].includes(origin.hostname))
  throw new Error("Local forwarding only.");
await mkdir(".local", { recursive: true });
const child = spawn(
  "stripe",
  [
    "--config",
    ".local/stripe.toml",
    "listen",
    "--forward-to",
    origin.origin + "/api/pre-evaluation/stripe-webhook",
    "--events",
    "checkout.session.completed,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed,checkout.session.expired,charge.refunded",
  ],
  {
    env: { ...process.env, STRIPE_API_KEY: key },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
let found = false,
  buffer = "";
async function output(chunk) {
  const text = chunk.toString();
  buffer = (buffer + text).slice(-8000);
  const match = buffer.match(/whsec_[A-Za-z0-9]+/);
  if (match && !found) {
    found = true;
    const file = ".env.local",
      s = await readFile(file, "utf8");
    await writeFile(
      file,
      s.replace(
        /^STRIPE_TEST_WEBHOOK_SECRET=.*$/m,
        "STRIPE_TEST_WEBHOOK_SECRET=" + match[0],
      ),
      { mode: 0o600 },
    );
    console.log(
      "Stripe test webhook forwarding ready; signing secret updated privately.",
    );
  }
  if (text.includes("[200]"))
    console.log("Stripe test webhook accepted (HTTP 200).");
  if (/ERROR|Error|failed/i.test(text))
    console.log("Stripe forwarding reported an error. Check configuration.");
}
child.stdout.on("data", output);
child.stderr.on("data", output);
process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));
child.on("exit", (code) => {
  if (code)
    console.error(
      buffer
        .replace(/(?:whsec_|sk_test_|rk_test_)[A-Za-z0-9]+/g, "[redacted]")
        .slice(-1500),
    );
  process.exitCode = code || 0;
});
