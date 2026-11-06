import { table } from '../preeval/db';
import { coreTable, assertCoreConnection } from './connection';
import 'server-only';
import type { Sql, TransactionSql } from 'postgres';
import { z } from 'zod';
import { AppError, TOTAL_CENTS } from '../preeval/domain';
import { projectWorkspaceRecords, legacyRecords } from '../crm/workspace-server';

// Context is supplied by authenticated server code, never request JSON.
export type CoreActor = { role: 'customer'; applicationId: string } |
  { role: 'staff'; email: string; offices: string[]; includeUnassigned: boolean };
type DB = Sql | TransactionSql;
const paymentState = (sql: DB) => sql`case
  when exists(select 1 from ${coreTable(sql,'aet_payments')} p where p.application_id=a.id and p.payment_status='refunded') then 'refunded'
  when exists(select 1 from ${coreTable(sql,'aet_payments')} p where p.application_id=a.id and p.payment_status='partially_refunded') then 'partially_refunded'
  when exists(select 1 from ${coreTable(sql,'aet_payments')} p where p.application_id=a.id and p.payment_status='paid') then 'paid'
  when exists(select 1 from ${coreTable(sql,'aet_payments')} p where p.application_id=a.id and p.payment_status in ('creating','open','pending')) then 'pending'
  else 'unpaid' end`;

/** Shared read adapter with an explicit, verified connection. The current pre-evaluation cohort retains operational state.
 * Every read uses a read-only consistent transaction; no publication/email retry. */
export async function createCoreShadowReader(sql: Sql) {
  await assertCoreConnection(sql);
  return {
    async status(id: string, actor: CoreActor) {
      z.uuid().parse(id);
      if (actor.role === 'customer' && actor.applicationId !== id) throw new AppError('access_denied',403);
      return sql.begin('isolation level repeatable read read only', async tx => {
        const [app] = await tx`select a.id,a.first_name,a.middle_name,a.last_name,a.email,a.residence_country as country,
          a.status,a.created_at,a.updated_at,${paymentState(tx)} as payment_status,
          s.input_version,s.result,w.ai_status,w.uploads_pending,w.ai_error,
          w.input_version as current_input_version,w.result_version as current_result_version,
          w.payment_status as current_payment_status,w.status as current_status
          from ${coreTable(tx,'aet_core_applications')} a join ${coreTable(tx,'aet_service_detail')} s on s.application_id=a.id and s.service_type='pre-evaluation'
          join ${table("preeval.applications")} w on w.id=a.id and a.office is not distinct from w.office
          where a.id=${id} and a.primary_service='pre-evaluation'
          and (${actor.role === 'customer'} or a.office=any(${actor.role === 'staff' ? actor.offices : []}::text[])
            or (a.office is null and ${actor.role === 'staff' && actor.includeUnassigned}))`;
        if (!app) throw new AppError('not_found',404);
        const educations = await tx`select e.id,e.school_name,e.country_of_study,e.degree_obtained,
          concat(e.study_start_date->>'year','-',lpad(e.study_start_date->>'month',2,'0')) as start_date,
          concat(e.study_end_date->>'year','-',lpad(e.study_end_date->>'month',2,'0')) as end_date
          from ${coreTable(tx,'aet_education')} e join ${coreTable(tx,'aet_service_detail')} s on s.application_id=e.application_id
          where e.application_id=${id} and s.service_type='pre-evaluation'
            and s.details->'education_ids' @> jsonb_build_array(e.id::text) order by e.sort_order,e.id`;
        if (educations.length !== 1) throw new Error('Pre-evaluation education mapping requires review');
        const files = await tx`select id,original_filename as name,mime_type,size_bytes::int as bytes,'ready' as state
          from ${coreTable(tx,'aet_documents')} where application_id=${id} and access_scope='customer_input' order by id`;
        const visible = app.result?.status === 'released' && app.status === 'completed' && app.current_status === 'completed'
          && app.payment_status === 'paid' && app.current_payment_status === 'paid' && app.ai_status === 'completed'
          && !app.uploads_pending && app.input_version === app.current_input_version
          && app.result.input_version === app.current_input_version && app.result.version === app.current_result_version;
        // Explicit customer allowlist. Internal notes, AI failures, paths, IDs and
        // provider references never leak through a spread of database rows.
        return { id: app.id, first_name: app.first_name, middle_name: app.middle_name, last_name: app.last_name,
          email: app.email, country: app.country, status: app.status, payment_status: app.payment_status,
          ai_status: app.ai_status, uploads_pending: app.uploads_pending,
          document_issue: /^(document_|pdf_|image_|invalid_document|unreadable_document|encrypted_document|unsupported_document|uploads_incomplete)/.test(app.ai_error || ""),
          result: visible ? app.result.content : null, result_version: visible ? app.result.version : 0,
          education: educations[0], files, created_at: app.created_at, updated_at: app.updated_at };
      });
    },
    async workspace(raw: Record<string,string>, actor: Extract<CoreActor,{role:'staff'}>) {
      if (actor.role !== 'staff' || !Array.isArray(actor.offices)) throw new AppError('access_denied',403);
      return sql.begin('isolation level repeatable read read only', async tx => {
        const records = tx`select 'preeval'::text kind,a.id,concat_ws(' ',a.first_name,nullif(trim(a.middle_name),''),a.last_name) name,
          a.email,a.office,1 as "intakeVersion",a.status,${paymentState(tx)} as payment_status,a.created_at,a.updated_at,
          'Preliminary degree equivalency'::text purpose,a.residence_country as country,
          coalesce((select p.amount_cents from ${coreTable(tx,'aet_payments')} p where p.application_id=a.id order by p.created_at desc nulls last,p.id limit 1),${TOTAL_CENTS}) amount,
          'Pre-Evaluation'::text service,false as "mailDelivery",
          coalesce((select jsonb_agg(jsonb_build_object('degree',e.degree_obtained,'school',e.school_name,'country',e.country_of_study,
            'start',concat(e.study_start_date->>'year','-',lpad(e.study_start_date->>'month',2,'0')),
            'end',concat(e.study_end_date->>'year','-',lpad(e.study_end_date->>'month',2,'0'))) order by e.sort_order,e.id)
            from ${coreTable(tx,'aet_education')} e where e.application_id=a.id),'[]') educations,
          coalesce((select jsonb_agg(jsonb_build_object('id',d.id,'kind','document','name',d.original_filename,'bytes',d.size_bytes) order by d.id)
            from ${coreTable(tx,'aet_documents')} d where d.application_id=a.id and d.access_scope='customer_input'),'[]') files,
          coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'session_id',p.checkout_session_id,'amount_cents',p.amount_cents,
            'status',p.payment_status,'created_at',p.created_at) order by p.created_at desc,p.id)
            from ${coreTable(tx,'aet_payments')} p where p.application_id=a.id),'[]') payments
          from ${coreTable(tx,'aet_core_applications')} a join ${table("preeval.applications")} w on w.id=a.id
            and a.office is not distinct from w.office where a.primary_service='pre-evaluation'
            and exists(select 1 from ${coreTable(tx,'aet_service_detail')} s where s.application_id=a.id and s.service_type='pre-evaluation')`;
        const combined = tx`${records} union all select l.* from (${legacyRecords(tx)}) l
          where l.kind <> 'preeval' or not exists(select 1 from ${coreTable(tx,'aet_core_applications')} a where a.id=l.id)`;
        return projectWorkspaceRecords(tx, combined, raw, { email: actor.email, offices: actor.offices,
          include_unassigned: actor.includeUnassigned }, true);
      });
    },
  };
}
