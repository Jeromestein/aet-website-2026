import 'server-only';
import { z } from 'zod';
import { db, table, type Row } from '../preeval/db';
import { configuration } from '../preeval/config';
import { AppError, TOTAL_CENTS } from '../preeval/domain';
import { WORKSPACE_PAGE_SIZE, type WorkspaceSnapshot } from './contracts';

const officeNames = ['Boston','New York','Miami','San Francisco','Los Angeles'];
export const workspaceQuery = z.object({
  view: z.enum(['applications','formal','equivalency','payments','documents']).default('applications'),
  filter: z.enum(['all','attention','processing','completed']).default('all'),
  office: z.string().max(50).default('all'), q: z.string().trim().max(100).default(''),
  sort: z.enum(['newest','oldest','name']).default('newest'),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  export: z.literal('csv').optional(),
}).strict();

/** Scope the entire dataset before computing metrics, lists, files or exports. */
export async function workspaceSnapshot(raw: Record<string,string>, staff: Row): Promise<WorkspaceSnapshot> {
  const query = workspaceQuery.parse(raw), sql = db();
  const allowedOffices: string[] = staff.offices || officeNames;
  const includeUnassigned = staff.offices ? Boolean(staff.include_unassigned) : true;
  if (query.office !== 'all' && !(query.office === 'unassigned' ? includeUnassigned : allowedOffices.includes(query.office))) throw new AppError('access_denied',403);
  const pattern = '%' + query.q.replace(/[\\%_]/g,'\\$&') + '%';
  const pageSize = query.export ? 5000 : WORKSPACE_PAGE_SIZE;
  const [result] = await sql`
    with records as (
      select 'formal'::text kind,a.id,coalesce(nullif(trim(concat_ws(' ',
        case lower(rtrim(coalesce(l.pronouns,a.data->'evaluee'->>'title'),'.')) when 'mr' then 'Mr.' when 'ms' then 'Ms.' when 'mx' then 'Mx.' else nullif(trim(coalesce(l.pronouns,a.data->'evaluee'->>'title')),'') end,
        nullif(trim(coalesce(l.first_name,a.data->'evaluee'->>'first')),''),
        nullif(trim(coalesce(l.middle_name,a.data->'evaluee'->>'middle')),''),
        nullif(trim(coalesce(l.last_name,a.data->'evaluee'->>'last')),''))),''),'Name not recorded') name,
        coalesce(l.email,a.data->'client'->>'email') email,
        case when l.id is null then nullif(a.data->'client'->>'office','') else l.office end office,
        a.status,a.payment_status,a.created_at,a.updated_at,
        coalesce(l.purpose,a.data->'client'->>'purpose','') purpose,coalesce(l.country,a.data->'client'->>'country','') country,
        coalesce((a.confirmed_quote->>'total')::int,case when not (a.quote->>'needsQuote')::boolean and a.quote->>'min'=a.quote->>'max' then (a.quote->>'min')::int end) amount,
        concat_ws(', ',
          case when coalesce(a.data->'services'->'document'->>'tier','')<>'' then 'Document by Document' end,
          case when coalesce(a.data->'services'->'course'->>'tier','')<>'' then 'Course by Course' end,
          case when coalesce(a.data->'services'->'expert'->>'tier','')<>'' then 'Expert Opinion Letter' end,
          case when coalesce(a.data->'services'->'position'->>'tier','')<>'' then 'Position Evaluation' end,
          case when (a.data->'services'->>'translation')::boolean then 'Translation' end,
          case when (a.data->'services'->>'customized')::boolean then 'Customized Evaluation' end) service,
        case when l.id is null then coalesce(a.data->'educations','[]'::jsonb) else coalesce((select jsonb_agg(jsonb_build_object('degree',e.degree_obtained,'school',e.school_name,'country',e.country_of_study,'start',concat(e.study_start_date->>'year','-',e.study_start_date->>'month'),'end',concat(e.study_end_date->>'year','-',e.study_end_date->>'month')) order by e.id) from ${table('public.fce_educations')} e where e.application_id=a.id),'[]'::jsonb) end educations,
        coalesce((select jsonb_agg(jsonb_build_object('id',f.id,'kind',f.kind,'name',f.name,'bytes',f.bytes) order by f.created_at) from ${table('evaluation.files')} f where f.application_id=a.id and f.state='ready'),'[]'::jsonb) files,
        coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'session_id',p.session_id,'amount_cents',p.amount_cents,'status',p.status,'created_at',p.created_at) order by p.created_at desc) from ${table('evaluation.payments')} p where p.application_id=a.id),'[]'::jsonb) payments
      from ${table('evaluation.applications')} a left join ${table('public.fce_applications')} l on l.id=a.id
      union all
      select 'preeval',a.id,concat_ws(' ',coalesce(l.first_name,a.first_name),nullif(trim(coalesce(l.middle_name,a.middle_name)),''),coalesce(l.last_name,a.last_name)),coalesce(l.email,a.email),a.office,
        a.status,a.payment_status,a.created_at,a.updated_at,'Preliminary degree equivalency',a.country,${TOTAL_CENTS},'Pre-Evaluation',
        coalesce((select jsonb_agg(jsonb_build_object('degree',coalesce(e.degree_obtained,p.degree_obtained),'school',coalesce(e.school_name,p.school_name),'country',coalesce(e.country_of_study,p.country_of_study),'start',p.start_date,'end',p.end_date) order by p.id) from ${table('preeval.educations')} p left join ${table('public.aet_core_educations')} e on e.id=p.id and e.application_id=a.id where p.application_id=a.id),'[]'::jsonb),
        coalesce((select jsonb_agg(jsonb_build_object('id',f.id,'kind','document','name',f.name,'bytes',f.bytes) order by f.created_at) from ${table('preeval.files')} f where f.application_id=a.id and f.state='ready'),'[]'::jsonb),
        coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'session_id',p.session_id,'amount_cents',p.amount_cents,'status',p.status,'created_at',p.created_at) order by p.created_at desc) from ${table('preeval.payments')} p where p.application_id=a.id),'[]'::jsonb)
      from ${table('preeval.applications')} a left join ${table('public.aet_core_applications')} l on l.id=a.id
    ), scoped as (
      select *, status not in ('completed','cancelled') and (status in ('submitted','reviewing','needs_information') or payment_status in ('unpaid','pending') or (kind='formal' and jsonb_array_length(files)=0)) attention
      from records where (office=any(${allowedOffices}::text[]) or (office is null and ${includeUnassigned}))
        and (${query.office}='all' or office=${query.office} or (${query.office}='unassigned' and office is null))
    ), viewed as (
      select * from scoped where (${query.view} not in ('formal','equivalency','documents') or (${query.view}='formal' and kind='formal') or (${query.view}='equivalency' and kind='preeval') or (${query.view}='documents' and jsonb_array_length(files)>0))
    ), filtered as (
      select * from viewed where (${query.filter}='all' or (${query.filter}='attention' and attention) or (${query.filter}='processing' and status in ('processing','reviewing')) or (${query.filter}='completed' and status='completed'))
        and concat_ws(' ',name,email,id::text,service,office,educations::text,case office when 'Boston' then 'BOS' when 'New York' then 'NYC' when 'Miami' then 'MIA' when 'San Francisco' then 'SF' when 'Los Angeles' then 'LA' end) ilike ${pattern}
    ), meta as (select count(*)::int total,least(${query.page},greatest(1,ceil(count(*)::numeric/${pageSize}))::int) page from filtered), page_rows as (
      select * from filtered order by case when ${query.sort}='name' then lower(name) end asc,case when ${query.sort}='oldest' then created_at end asc,case when ${query.sort}<>'oldest' then created_at end desc,kind,id
      limit ${pageSize} offset (select (page-1)*${pageSize} from meta)
    )
    select (select coalesce(jsonb_agg(to_jsonb(r)),'[]'::jsonb) from page_rows r) rows,
      (select total from meta) total,(select page from meta) page,
      (select jsonb_build_object('total',count(*),'attention',count(*) filter(where attention),'processing',count(*) filter(where status in ('processing','reviewing')),'completed',count(*) filter(where status='completed')) from viewed) counts,
      (select jsonb_build_object('total',count(*),'attention',count(*) filter(where attention),'processing',count(*) filter(where status in ('processing','reviewing')),'completed',count(*) filter(where status='completed'),
        'unpaid',count(*) filter(where payment_status in ('unpaid','pending') and status<>'cancelled'),
        'outstanding',coalesce(sum(amount) filter(where payment_status in ('unpaid','pending') and status<>'cancelled'),0),
        'unquoted',count(*) filter(where amount is null and status<>'cancelled'),
        'documents',coalesce(sum(jsonb_array_length(files)),0)) from scoped) stats`;
  if (query.export && result.total > pageSize) throw new AppError('export_too_large',413);
  return { ...result, pageSize, staff: { email: staff.email, offices: allowedOffices, includeUnassigned }, cloudPreview: configuration().cloudPreview } as WorkspaceSnapshot;
}
