-- Add only the HTML Editor dataset. Existing CRM, Auth, and application data
-- are outside this migration. Data is copied separately from a verified backup.
create table public.aet_fce_aice_report (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text,
  content jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.report_history (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.aet_fce_aice_report(id) on delete cascade,
  content jsonb not null,
  created_at timestamptz not null default now(),
  created_by text default 'user'
);

-- Preserve the source's lack of a foreign key here. Legacy chat rows must be
-- retained even when their original report has been removed.
create table public.report_chat_history (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  image_urls text[],
  created_at timestamptz not null default now()
);

create table public.aet_aice_grade_conversion_rules (
  id uuid primary key default gen_random_uuid(),
  country text not null,
  education_level text,
  original_scale text,
  original_grade text not null,
  us_grade text not null,
  gpa_points numeric(3, 2),
  credit_coefficient numeric(4, 3),
  source text default 'AI_INFERRED',
  confidence text default 'medium',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index aet_eval_reports_updated_idx on public.aet_fce_aice_report (updated_at desc);
create index aet_eval_history_report_created_idx on public.report_history (report_id, created_at desc);
create index aet_eval_chat_report_created_idx on public.report_chat_history (report_id, created_at);
create index aet_eval_grade_rules_lookup_idx on public.aet_aice_grade_conversion_rules (country, original_grade);

create function public.aet_eval_set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.aet_eval_set_updated_at() from public, anon, authenticated;
grant execute on function public.aet_eval_set_updated_at() to service_role;

create trigger aet_eval_report_updated_at
before update on public.aet_fce_aice_report
for each row execute function public.aet_eval_set_updated_at();

-- The employee login feature is deferred. Data remains server-only; absence
-- of login must not expose reports or attachments through the public API.
alter table public.aet_fce_aice_report enable row level security;
alter table public.report_history enable row level security;
alter table public.report_chat_history enable row level security;
alter table public.aet_aice_grade_conversion_rules enable row level security;

revoke all on table public.aet_fce_aice_report, public.report_history,
  public.report_chat_history, public.aet_aice_grade_conversion_rules
  from public, anon, authenticated;
grant select, insert, update, delete on table public.aet_fce_aice_report,
  public.report_history, public.report_chat_history,
  public.aet_aice_grade_conversion_rules to service_role;

comment on table public.aet_fce_aice_report is 'AET Eval reports migrated from HTML Editor; server-only access.';
comment on table public.report_history is 'AET Eval report revisions with original IDs and timestamps.';
comment on table public.report_chat_history is 'AET Eval chat records; attachment URLs require server-authorized access.';
comment on table public.aet_aice_grade_conversion_rules is 'Legacy AET Eval grade conversion reference data.';
