import type { Sql, TransactionSql } from 'postgres';
import { table } from './db';
import { PREVIOUS_BASE_CENTS } from './domain';
import { NET_PER_THOUSAND, PROCESSING_FIXED_CENTS } from '../application/checkout-pricing';

type DB = Sql | TransactionSql;

// The original pilot stored no service-price column. The submission audit
// records the price for new pilot orders; older orders retain their original rate.
export const pilotBase = (sql: DB) => sql`coalesce((select (e.detail->>'base_cents')::int
  from ${table('preeval.audit')} e where e.application_id=a.id and e.action='application.submitted'
  order by e.id limit 1), ${PREVIOUS_BASE_CENTS}::int)`;

// CRM aggregates outstanding amounts in SQL before paginating.
export const projectedTotal = (sql: DB, base: ReturnType<typeof pilotBase>) => sql`case when ${base}=0 then 0
  else round((${base}+${PROCESSING_FIXED_CENTS}::int)*1000::numeric/${NET_PER_THOUSAND}::int)::int end`;
