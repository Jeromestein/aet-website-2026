-- Private local formal-evaluation workflow; shares the existing staff login only.
alter table evaluation.applications drop constraint applications_status_check;
alter table evaluation.applications add constraint applications_status_check check(status in ('submitted','reviewing','needs_information','processing','completed','cancelled'));
alter table evaluation.applications
  add column payment_status text not null default 'unpaid' check(payment_status in ('unpaid','pending','paid','partially_refunded','refunded')),
  add column version integer not null default 1,
  add column input_version integer not null default 1,
  add column confirmed_quote jsonb,
  add column customer_message text not null default '',
  add column staff_notes text not null default '',
  add column released_file_id uuid,
  add column updated_at timestamptz not null default now();
create table evaluation.files (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references evaluation.applications(id) on delete cascade,
  kind text not null check(kind in ('document','report')),
  name text not null, mime_type text not null, bytes integer not null check(bytes>0 and bytes<=20971520),
  sha256 text not null, dropbox_path text not null,
  state text not null default 'uploading' check(state in ('uploading','ready','failed')),
  input_version integer not null,
  created_at timestamptz not null default now(),
  unique(application_id,kind,sha256,input_version)
);
create table evaluation.payments (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references evaluation.applications(id) on delete cascade,
  session_id text unique, payment_intent text unique,
  amount_cents integer not null check(amount_cents>0),
  status text not null default 'creating' check(status in ('creating','open','paid','expired','partially_refunded','refunded')),
  refunded_cents integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index evaluation_one_open_payment on evaluation.payments(application_id) where status in ('creating','open');
create table evaluation.payment_events(id text primary key,type text not null,created_at timestamptz not null default now());
create table evaluation.audit(
  id bigint generated always as identity primary key,
  application_id uuid not null references evaluation.applications(id) on delete cascade,
  actor text not null, action text not null, detail jsonb not null default '{}', created_at timestamptz not null default now()
);
create table evaluation.access_tokens(
  hash text primary key, application_id uuid not null references evaluation.applications(id) on delete cascade,
  expires_at timestamptz not null, consumed_at timestamptz
);
create table evaluation.sessions(
  hash text primary key, application_id uuid not null references evaluation.applications(id) on delete cascade,
  expires_at timestamptz not null
);
create index evaluation_queue on evaluation.applications(created_at desc);
alter table evaluation.files enable row level security;
alter table evaluation.payments enable row level security;
alter table evaluation.payment_events enable row level security;
alter table evaluation.audit enable row level security;
alter table evaluation.access_tokens enable row level security;
alter table evaluation.sessions enable row level security;
revoke all on all tables in schema evaluation from public,anon,authenticated;
revoke all on all sequences in schema evaluation from public,anon,authenticated;
