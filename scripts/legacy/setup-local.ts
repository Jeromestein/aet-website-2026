import { readFile } from 'node:fs/promises';
import { db } from '../../lib/preeval/db';
import { configuration } from '../../lib/preeval/config';
async function main() {
configuration(); // Rejects remote hosts before any DDL can execute.
const sql = db();
try {
  await sql.begin(async tx => {
    const [{ count }] = await tx`select count(*)::int from information_schema.tables where table_schema='public' and table_name in ('aet_core_applications','aet_core_educations','aet_core_payments','fce_applications','fce_educations')`;
    if (count === 0) await tx.unsafe(await readFile(new URL('./schema-fixture.sql', import.meta.url), 'utf8'));
    else if (count !== 5) throw new Error('Partial legacy fixture; refusing to overwrite existing tables.');
    await tx.unsafe(await readFile(new URL('./workflow-bridge.sql', import.meta.url), 'utf8'));
  });
  console.log('Local legacy table fixture and workflow bridge ready. No remote database writes.');
} finally { await sql.end(); }

}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
