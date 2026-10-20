-- Delivery records contain references only; render from business data at send time.
alter table evaluation.payments add column if not exists paid_at timestamptz;
create table if not exists evaluation.emails (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references evaluation.applications(id) on delete cascade,
  kind text not null check(kind in ('payment','fee_update')),
  dedupe_key text not null unique,
  recipient text not null,
  payment_id uuid references evaluation.payments(id) on delete cascade,
  audit_id bigint references evaluation.audit(id) on delete cascade,
  state text not null default 'queued' check(state in ('queued','sending','sent','failed')),
  attempts integer not null default 0,
  provider_id text, error text, payload_hash text,
  available_at timestamptz not null default now(),
  first_attempt_at timestamptz, locked_at timestamptz, lease uuid, sent_at timestamptz,
  created_at timestamptz not null default now(),
  check ((kind='payment' and payment_id is not null and audit_id is null)
      or (kind='fee_update' and audit_id is not null and payment_id is null))
);
create index if not exists formal_email_queue on evaluation.emails(available_at,created_at) where state in ('queued','failed');
alter table evaluation.emails enable row level security;
revoke all on evaluation.emails from public,anon,authenticated;
-- The optional restricted preview role may access this private delivery table only.
do $$ begin
  if exists(select 1 from pg_roles where rolname='aet_preview_runtime') then
    grant select,insert,update,delete on evaluation.emails to aet_preview_runtime;
    drop policy if exists preview_server on evaluation.emails;
    create policy preview_server on evaluation.emails for all to aet_preview_runtime using (true) with check (true);
  end if;
end $$;
