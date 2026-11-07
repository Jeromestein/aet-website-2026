-- LOCAL REHEARSAL ONLY. Never include this retirement script in hosted migrations.
-- Only an empty synthetic source is accepted in this first convergence gate.
do $$ declare t record; n bigint; begin
 if current_database()<>'aet_core_rehearsal' or session_user<>'core_rehearsal' or inet_server_addr() is not null then
  raise exception 'Convergence requires the disposable rehearsal database';
 end if;
 for t in select schemaname,tablename from pg_tables where schemaname='preeval'
   or (schemaname='public' and tablename in ('aet_core_applications','aet_core_educations','aet_core_payments'))
   or schemaname='aet' loop
  execute format('select count(*) from %I.%I',t.schemaname,t.tablename) into n;
  if n<>0 then raise exception 'Populated cohort requires a separate reconciled migration: %.%',t.schemaname,t.tablename; end if;
 end loop;
end $$;
-- Move operational records, rather than introduce duplicate storage.
alter table preeval.files set schema aet;
alter table aet.files rename to aet_uploads;
alter table preeval.ai_runs set schema aet;
alter table aet.ai_runs rename to aet_ai_runs;
alter table preeval.emails set schema aet;
alter table aet.emails rename to aet_emails;
alter table preeval.payment_events set schema aet;
alter table aet.payment_events rename to aet_payment_events;
alter table preeval.tokens set schema aet;
alter table aet.tokens rename to aet_access_tokens;
alter table preeval.sessions set schema aet;
alter table aet.sessions rename to aet_sessions;
alter table preeval.audit set schema aet;
alter table aet.audit rename to aet_audit;
alter table preeval.rate_limits set schema aet;
alter table aet.rate_limits rename to aet_rate_limits;
-- Retarget every operational application FK before retiring the old parent.
do $$ declare r record; begin
 for r in select c.conname,c.conrelid::regclass rel from pg_constraint c
   join pg_class t on t.oid=c.conrelid join pg_namespace n on n.oid=t.relnamespace
   where n.nspname='aet' and c.contype='f' and c.confrelid='preeval.applications'::regclass loop
  execute format('alter table %s drop constraint %I',r.rel,r.conname);
  execute format('alter table %s add constraint %I foreign key(application_id) references aet.aet_core_applications(id)',r.rel,r.conname);
 end loop;
end $$;
alter table aet.aet_uploads drop constraint files_dropbox_path_key;
alter table aet.aet_uploads alter name drop not null, alter mime_type drop not null,
 alter bytes drop not null, alter sha256 drop not null, alter dropbox_path drop not null;
alter table aet.aet_uploads add column file_key text, add column attempt_id uuid,
 add column updated_at timestamptz not null default now();
create unique index aet_upload_key on aet.aet_uploads(application_id,file_key);
-- A run is also its queue/lease record. A new input supersedes the prior run.
alter table aet.aet_ai_runs alter input set default '{}'::jsonb;
alter table aet.aet_ai_runs add column current boolean not null default false,
 add column uploads_pending boolean not null default false,
 add column attempts integer not null default 0,
 add column available_at timestamptz not null default now(),
 add column locked_at timestamptz, add column lease uuid;
alter table aet.aet_ai_runs alter current set default true;
create unique index aet_ai_current on aet.aet_ai_runs(application_id) where current;
create index aet_ai_due on aet.aet_ai_runs(available_at) where current and state in ('queued','running');
-- Retirement: caller has verified source reconciliation and retargeted every FK.
drop table preeval.document_uploads;
drop table preeval.payments;
drop table preeval.educations;
drop table preeval.applications;
drop table public.aet_core_payments;
drop table public.aet_core_educations;
drop table public.aet_core_applications;
-- No replacement views, no CASCADE, and no historical/provider side effects.
