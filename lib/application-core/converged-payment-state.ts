import { coreTable } from './connection';
import { productionMode } from '../preeval/production';
import { compact } from './compact-files';
import type { Sql, TransactionSql } from 'postgres';
type DB = Sql | TransactionSql;
/** A recorded synthetic exemption is not money received. Never infer it from zero price. */
export const testPaymentExemption = (sql:DB) => productionMode()?sql`false`:compact()?sql`exists(select 1 from ${coreTable(sql,'aet_service_detail')} x where x.application_id=a.id and x.service_type='pre-evaluation'
  and x.amount_cents=0 and x.details->'payment_exemption' @> '{"scope":"synthetic-test","confirmed":true}'::jsonb
  and not exists(select 1 from ${coreTable(sql,'aet_payments')} p where p.application_id=a.id))`:sql`exists(
  select 1 from ${coreTable(sql,'aet_service_detail')} x join ${coreTable(sql,'aet_audit')} e
    on e.id::text=x.details->'payment_exemption'->>'audit_id' and e.application_id=x.application_id
  join ${coreTable(sql,'aet_audit')} original on original.id::text=x.details->'payment_exemption'->>'source_audit_id'
    and original.application_id=x.application_id
  where x.application_id=a.id and x.service_type='pre-evaluation' and x.amount_cents=0
    and x.details->'payment_exemption'->>'scope'='synthetic-test'
    and e.actor='migration' and e.action='test.payment_exemption.confirmed'
    and original.actor='synthetic-e2e-test' and original.action='test.payment_fixture'
    and original.detail @> '{"synthetic":true,"noCharge":true}'::jsonb
    and not exists(select 1 from ${coreTable(sql,'aet_payments')} p where p.application_id=a.id))`;
const paymentScope = (sql: DB) => productionMode()
  ? sql`p.provider='stripe' and p.provider_mode='live' and p.provider_account=${process.env.APPLICATION_CORE_PROVIDER_ACCOUNT || ''}`
  : sql`true`;
export const convergedPaymentState = (sql:DB) => sql`case
  when exists(select 1 from ${coreTable(sql,'aet_payments')} p where p.application_id=a.id and ${paymentScope(sql)} and p.payment_status='refunded') then 'refunded'
  when exists(select 1 from ${coreTable(sql,'aet_payments')} p where p.application_id=a.id and ${paymentScope(sql)} and p.payment_status='partially_refunded') then 'partially_refunded'
  when exists(select 1 from ${coreTable(sql,'aet_payments')} p where p.application_id=a.id and ${paymentScope(sql)} and p.payment_status='paid') then 'paid'
  when exists(select 1 from ${coreTable(sql,'aet_payments')} p where p.application_id=a.id and ${paymentScope(sql)} and p.payment_status in ('creating','open','pending')) then 'pending'
  when ${testPaymentExemption(sql)} then 'waived'
  else 'unpaid' end`;
export const convergedReleaseEligible = (state:string) => state==='paid'||state==='waived';
