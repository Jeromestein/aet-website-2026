-- Existing queues stay on the legacy pipeline until explicitly retried.
alter table preeval.applications
  add column if not exists ai_pipeline text not null default 'legacy',
  add column if not exists uploads_pending boolean not null default false,
  add column if not exists ai_active_run uuid,
  add column if not exists ai_available_at timestamptz not null default now();
alter table preeval.ai_runs
  add column if not exists model text,
  add column if not exists response_id text,
  add column if not exists usage jsonb,
  add column if not exists input_hash text,
  add column if not exists prompt_version text;
create index if not exists preeval_ai_queue on preeval.applications(ai_available_at)
  where ai_status='queued' and ai_pipeline='openai' and not uploads_pending;
-- Track shared-uploader attempts as well as pilot uploads. Failed or interrupted
-- attempts block analysis until the same file is successfully retried.
create table if not exists preeval.document_uploads (
  application_id uuid not null references preeval.applications(id) on delete cascade,
  file_key text not null,
  attempt_id uuid not null,
  state text not null check(state in ('uploading','ready','failed')),
  updated_at timestamptz not null default now(),
  primary key(application_id,file_key)
);
alter table preeval.document_uploads enable row level security;
revoke all on preeval.document_uploads from public, anon, authenticated;

do $$ begin
  if exists(select 1 from pg_roles where rolname='aet_preview_runtime') then
    grant select,insert,update,delete on preeval.document_uploads to aet_preview_runtime;
    if not exists(select 1 from pg_policies where tablename='document_uploads' and policyname='preview_server') then
      create policy preview_server on preeval.document_uploads for all to aet_preview_runtime using (true) with check (true);
    end if;
  end if;
end $$;
