import type { Sql } from 'postgres';
import { createHash } from 'node:crypto';
import { assertRehearsalDatabase } from './preeval-backfill';

/** Owned, disposable PostgreSQL only. No hosted entry point or replacement log. */
export async function simplifyPreevaluationEight(sql: Sql) {
  return sql.begin('isolation level serializable', async tx => {
    await assertRehearsalDatabase(tx);
    const expected = ['aet_core_applications', 'aet_education', 'aet_service_detail',
      'aet_documents', 'aet_payments', 'aet_ai_runs', 'aet_payment_events',
      'aet_audit', 'aet_rate_limits'].sort();
    const names = (await tx`select tablename from pg_tables where schemaname='aet' order by tablename`).map(r => r.tablename);
    if (JSON.stringify(names) !== JSON.stringify(expected)) throw new Error('Expected reconciled nine-table source');
    // Wait for existing local writers; no callback can be partly applied by DROP.
    for (const name of expected) await tx`lock table ${tx('aet.' + name)} in access exclusive mode`;
    if ((await tx`select id from aet.aet_service_detail where service_type <> 'pre-evaluation'`).length)
      throw new Error('Only pre-evaluation retirement is supported');
    const archive = (await tx`select to_jsonb(e) value from aet.aet_payment_events e order by id`).map(r => r.value);
    await tx`drop table aet.aet_payment_events`;
    const tables = (await tx`select tablename from pg_tables where schemaname='aet' order by tablename`).map(r => r.tablename);
    if (tables.length !== 8) throw new Error('Expected exactly eight tables');
    return { tables, archive, archiveDigest: createHash('sha256').update(JSON.stringify(archive)).digest('hex') };
  });
}
