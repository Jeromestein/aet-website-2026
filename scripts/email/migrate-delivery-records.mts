import { environmentValue } from "../../lib/application-environment.mjs";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import postgres from "postgres";
import { configuration, CLOUD_PROJECT } from "../../lib/preeval/config";

const config = configuration();
const connection = config.cloudPreview ? process.env.STAFF_AUTH_DATABASE_URL : environmentValue("APPLICATION_DATABASE_URL");
assert.ok(connection, "Missing database connection");
const url = new URL(connection);
if (config.cloudPreview) {
  assert.ok(url.hostname === `db.${CLOUD_PROJECT}.supabase.co` ||
    (url.hostname.endsWith(".pooler.supabase.com") && decodeURIComponent(url.username).endsWith("." + CLOUD_PROJECT)), "Unexpected project");
} else {
  assert.ok(["localhost", "127.0.0.1"].includes(url.hostname), "Only local databases or the isolated preview are supported");
}
let source = await readFile(new URL("../../supabase/migrations/20261020165103_email_delivery_records.sql", import.meta.url), "utf8");
if (config.cloudPreview) {
  source = source.replaceAll("preeval.", "aet_preview_preeval.").replaceAll("evaluation.", "aet_preview_evaluation.")
    .replaceAll("table_schema='preeval'", "table_schema='aet_preview_preeval'")
    .replaceAll("table_schema='evaluation'", "table_schema='aet_preview_evaluation'");
}
const sql = postgres(connection, { prepare: false, max: 1, connect_timeout: 10 });
try {
  await sql.begin(async tx => {
    await tx`set local lock_timeout='5s'`;
    await tx.unsafe(source);
    const schemas = config.cloudPreview ? ["aet_preview_preeval", "aet_preview_evaluation"] : ["preeval", "evaluation"];
    const [remaining] = await tx`select count(*)::int as count from information_schema.columns
      where table_schema=any(${schemas}) and table_name in ('emails','intake_emails') and column_name in ('subject','html')`;
    assert.equal(remaining.count, 0, "Email bodies must not remain in delivery tables");
  });
  console.log("Delivery-record migration verified; production schemas and staff accounts were not changed.");
} finally {
  await sql.end();
}
