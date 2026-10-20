-- Private application-to-Dropbox mapping. No customer files or legacy rows move.
-- No foreign key: live records and isolated same-ID projections share this map.
create table if not exists evaluation.document_locations (
  application_id uuid not null,
  kind text not null check (kind in ('evaluation','pre-evaluation')),
  storage jsonb not null check (jsonb_typeof(storage)='object'),
  created_at timestamptz not null default now(),
  primary key (application_id,kind)
);
alter table evaluation.document_locations enable row level security;
revoke all on evaluation.document_locations from public, anon, authenticated;
-- The local postgres owner bypasses RLS; cloud preview uses its existing server role.
do $$ begin
  if exists(select 1 from pg_roles where rolname='aet_preview_runtime') then
    grant select,insert on evaluation.document_locations to aet_preview_runtime;
    if not exists(select 1 from pg_policies where schemaname='evaluation' and tablename='document_locations' and policyname='document_server_select') then
      create policy document_server_select on evaluation.document_locations for select to aet_preview_runtime using (true);
      create policy document_server_insert on evaluation.document_locations for insert to aet_preview_runtime with check (true);
    end if;
  end if;
end $$;
