-- Form-only milestone. Separate from the pre-evaluation payment/result lifecycle.
create schema if not exists evaluation;
revoke all on schema evaluation from public, anon, authenticated;
create table evaluation.applications (
  id uuid primary key default gen_random_uuid(),
  request_id uuid unique not null,
  request_hash text not null,
  access_hash text not null,
  locale text not null check (locale in ('en', 'zh', 'es')),
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  quote jsonb not null check (jsonb_typeof(quote) = 'object'),
  status text not null default 'submitted' check (status in ('submitted', 'cancelled')),
  created_at timestamptz not null default now()
);
alter table evaluation.applications enable row level security;
revoke all on all tables in schema evaluation from public, anon, authenticated;
alter default privileges in schema evaluation revoke all on tables from public, anon, authenticated;
