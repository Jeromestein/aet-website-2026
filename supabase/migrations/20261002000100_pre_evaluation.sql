create schema if not exists preeval;
revoke all on schema preeval from public, anon, authenticated;

create table preeval.applications (
 id uuid primary key default gen_random_uuid(), request_id uuid unique not null,
 request_hash text not null, legacy_id uuid unique, email text not null,
 first_name text not null, middle_name text not null default '', last_name text not null,
 country text not null, locale text not null check(locale in ('en','zh','es')),
 office text, status text not null default 'submitted' check(status in ('submitted','processing','completed','cancelled','needs_information')),
 payment_status text not null default 'unpaid' check(payment_status in ('unpaid','pending','paid','partially_refunded','refunded')),
 result jsonb, result_version integer not null default 0, result_source text,
 ai_status text not null default 'idle' check(ai_status in ('idle','queued','running','completed','failed')),
 ai_error text, ai_locked_at timestamptz, ai_attempts integer not null default 0,
 input_version integer not null default 1, notes text not null default '',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table preeval.educations (
 id uuid primary key default gen_random_uuid(), application_id uuid not null unique references preeval.applications(id),
 legacy_id uuid, school_name text not null, country_of_study text not null,
 degree_obtained text not null, start_date text not null, end_date text not null
);
create table preeval.files (
 id uuid primary key, application_id uuid not null references preeval.applications(id),
 name text not null, mime_type text not null, bytes integer not null check(bytes between 1 and 20971520),
 sha256 text not null, dropbox_path text not null unique, state text not null default 'uploading' check(state in ('uploading','ready','failed')),
 created_at timestamptz not null default now(), unique(application_id,sha256)
);
create table preeval.tokens (
 hash text primary key, application_id uuid references preeval.applications(id),
 role text not null check(role in ('customer','admin')), email text not null,
 locale text not null default 'en', expires_at timestamptz not null, consumed_at timestamptz,
 created_at timestamptz not null default now(), check(role='admin' or application_id is not null)
);
create table preeval.sessions (
 hash text primary key, application_id uuid references preeval.applications(id),
 role text not null check(role in ('customer','admin')), email text not null,
 expires_at timestamptz not null, created_at timestamptz not null default now(),
 check(role='admin' or application_id is not null)
);
create table preeval.payments (
 id uuid primary key default gen_random_uuid(), application_id uuid not null references preeval.applications(id),
 session_id text unique, payment_intent text unique, amount_cents integer not null, currency text not null default 'usd',
 status text not null default 'creating', refunded_cents integer not null default 0,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index preeval_one_open_checkout on preeval.payments(application_id) where status in ('creating','open');
create table preeval.payment_events (id text primary key, type text not null, received_at timestamptz not null default now());
create table preeval.emails (
 id uuid primary key default gen_random_uuid(), application_id uuid references preeval.applications(id),
 kind text not null, dedupe_key text not null unique, subject text not null, recipient text not null,
 html text not null, state text not null default 'queued' check(state in ('queued','sending','sent','failed')),
 provider_id text, attempts integer not null default 0, error text,
 available_at timestamptz not null default now(), locked_at timestamptz, sent_at timestamptz,
 created_at timestamptz not null default now()
);
create table preeval.ai_runs (
 id uuid primary key default gen_random_uuid(), application_id uuid not null references preeval.applications(id),
 input_version integer not null, input jsonb not null, output jsonb, state text not null default 'running',
 error text, created_at timestamptz not null default now(), completed_at timestamptz
);
create table preeval.audit (
 id bigint generated always as identity primary key, application_id uuid references preeval.applications(id),
 actor text not null, action text not null, detail jsonb not null default '{}', created_at timestamptz not null default now()
);
create table preeval.rate_limits (key text primary key, count integer not null, expires_at timestamptz not null);
create index preeval_application_created on preeval.applications(created_at desc);
create index preeval_pending_emails on preeval.emails(state,available_at);
create index preeval_application_audit on preeval.audit(application_id,created_at);
create index preeval_application_files on preeval.files(application_id);
do $$ declare t record; begin
 for t in select tablename from pg_tables where schemaname='preeval' loop
  execute format('alter table preeval.%I enable row level security',t.tablename);
  execute format('revoke all on preeval.%I from public, anon, authenticated',t.tablename);
 end loop;
end $$;
