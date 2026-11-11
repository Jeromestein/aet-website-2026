import type { Sql } from 'postgres';
import { createHash } from 'node:crypto';
import { assertRehearsalDatabase } from './preeval-backfill';

/** Retire optional operation history and request counters in an owned local copy. */
export async function simplifyPreevaluationSix(sql: Sql) {
  return sql.begin('isolation level serializable', async tx => {
    await assertRehearsalDatabase(tx);
    const expected = ['aet_core_applications', 'aet_education', 'aet_service_detail',
      'aet_documents', 'aet_payments', 'aet_ai_runs', 'aet_audit', 'aet_rate_limits'].sort();
    const names = (await tx`select tablename from pg_tables where schemaname='aet' order by tablename`).map(r => r.tablename);
    if (JSON.stringify(names) !== JSON.stringify(expected)) throw new Error('Expected reconciled eight-table source');
    for (const name of expected) await tx`lock table ${tx('aet.' + name)} in access exclusive mode`;
    if ((await tx`select id from aet.aet_service_detail where service_type <> 'pre-evaluation'`).length)
      throw new Error('Only pre-evaluation retirement is supported');
    // Current business state was materialized by the previous compact migration.
    await tx`select result_version,notification_state from aet.aet_service_detail limit 0`;
    const archive = {
      audit: (await tx`select to_jsonb(a) value from aet.aet_audit a order by id`).map(r => r.value),
      rateLimits: (await tx`select to_jsonb(l) value from aet.aet_rate_limits l order by key`).map(r => r.value),
    };
    await tx`drop table aet.aet_audit`;
    await tx`drop table aet.aet_rate_limits`;
    const tables = (await tx`select tablename from pg_tables where schemaname='aet' order by tablename`).map(r => r.tablename);
    if (tables.length !== 6) throw new Error('Expected exactly six tables');
    return { tables, archive, archiveDigest: createHash('sha256').update(JSON.stringify(archive)).digest('hex') };
  });
}
