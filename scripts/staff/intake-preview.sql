-- Preview-only compatibility changes. Never apply to public or production evaluation schemas.
alter table aet_preview_legacy.fce_applications alter column date_of_birth drop not null;
alter table aet_preview_legacy.fce_applications drop constraint if exists fce_applications_phone_check;
alter table aet_preview_legacy.fce_applications drop constraint if exists fce_applications_zip_code_check;
-- This cloned legacy check mistakenly applies office names to payment_status.
alter table aet_preview_legacy.fce_applications drop constraint if exists fce_applications_payment_status_check1;
create table if not exists aet_preview_evaluation.intake_emails (
 id uuid primary key default gen_random_uuid(),
 application_id uuid unique not null references aet_preview_evaluation.applications(id) on delete cascade,
 recipient text not null check(recipient='errplusone@gmail.com'),payload_hash text,
 state text not null default 'queued' check(state in ('queued','sending','sent','failed')),
 attempts integer not null default 0,first_attempt_at timestamptz,available_at timestamptz not null default now(),
 locked_at timestamptz,lease uuid,error text,provider_id text,sent_at timestamptz,created_at timestamptz not null default now()
);
alter table aet_preview_evaluation.intake_emails enable row level security;
revoke all on aet_preview_evaluation.intake_emails from public,anon,authenticated;
grant select,insert,update,delete on aet_preview_evaluation.intake_emails to aet_preview_runtime;
drop policy if exists intake_runtime on aet_preview_evaluation.intake_emails;
create policy intake_runtime on aet_preview_evaluation.intake_emails for all to aet_preview_runtime using(true) with check(true);
