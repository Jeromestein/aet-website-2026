-- Authorized dev Preview only. Retain all existing schemas, tables and rows.
-- Apply this file explicitly; never replay the local fixture migrations remotely.
do $$ begin
  if not exists(select 1 from pg_roles where rolname='aet_preview_runtime' and not rolsuper and not rolbypassrls)
    then raise exception 'Restricted Preview role required'; end if;
  if exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname in ('public','preeval','evaluation','aet') and c.relkind in ('r','p')
    and has_table_privilege('aet_preview_runtime',c.oid,'INSERT,UPDATE,DELETE,TRUNCATE'))
    then raise exception 'Preview role has production write access'; end if;
end $$;
-- Additive shared business model. Existing public/workflow tables stay intact.
-- No runtime grants or reader/writer cutover are included in this phase.
create schema aet_preview_core;
revoke all on schema aet_preview_core from public, anon, authenticated;

create table aet_preview_core.aet_core_applications (
  id uuid primary key default gen_random_uuid(),
  contact_name text,
  email text,
  phone text,
  mailing_address jsonb check (jsonb_typeof(mailing_address) = 'object'),
  office text,
  primary_service text not null,
  pronouns text,
  first_name text,
  middle_name text,
  last_name text,
  date_of_birth date,
  residence_country text,
  purpose text,
  source text,
  status text not null default 'draft'
    check (status in ('draft','submitted','processing','needs_information','completed','cancelled')),
  request_id uuid unique,
  request_hash text,
  request_hash_version integer check (request_hash_version >= 0),
  submission_version integer check (submission_version > 0),
  submitted_snapshot jsonb check (jsonb_typeof(submitted_snapshot) = 'object'),
  submitted_at timestamptz,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((request_id is null and request_hash is null and request_hash_version is null)
    or (request_id is not null and request_hash is not null and request_hash_version is not null)),
  check ((submitted_snapshot is null) = (submission_version is null))
);

create table aet_preview_core.aet_education (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references aet_preview_core.aet_core_applications(id),
  school_name text not null,
  country_of_study text not null,
  degree_obtained text not null,
  study_start_date jsonb not null check (jsonb_typeof(study_start_date) = 'object'),
  study_end_date jsonb not null check (jsonb_typeof(study_end_date) = 'object'),
  sort_order integer not null default 0 check (sort_order >= 0),
  ai_output jsonb,
  -- Historical education timestamps are unknown; migration must pass NULL.
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index aet_education_application on aet_preview_core.aet_education(application_id, sort_order, id);

create table aet_preview_core.aet_service_detail (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references aet_preview_core.aet_core_applications(id),
  service_type text not null,
  details jsonb not null check (jsonb_typeof(details) = 'object'),
  details_version integer not null default 1 check (details_version > 0),
  status text not null default 'submitted'
    check (status in ('draft','submitted','processing','needs_information','completed','cancelled')),
  input_version integer not null default 1 check (input_version > 0),
  notes text check (char_length(notes) <= 3000),
  staff_notes text,
  customer_message text,
  amount_cents integer check (amount_cents >= 0),
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  pricing_source text check (pricing_source in ('automatic','manual')),
  result jsonb check (result is null or coalesce((
    jsonb_typeof(result) = 'object'
    and result ?& array['content','documents','status','released_at','input_version','version']
    and result->>'status' in ('draft','released')
    and jsonb_typeof(result->'documents') = 'array'
    and jsonb_typeof(result->'input_version') = 'number'
    and jsonb_typeof(result->'version') = 'number'), false)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (application_id, service_type),
  check (amount_cents is not null or pricing_source is null)
);

create table aet_preview_core.aet_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references aet_preview_core.aet_core_applications(id),
  storage_location text not null check (length(storage_location) > 0),
  storage_file_id text not null check (storage_file_id ~ '^id:.+'),
  storage_path text,
  storage_rev text,
  storage_content_hash text,
  original_filename text not null,
  mime_type text,
  size_bytes bigint check (size_bytes >= 0),
  access_scope text not null default 'staff_only' check (access_scope in ('customer_input','staff_only')),
  created_at timestamptz default now(),
  updated_at timestamptz not null default now(),
  unique (storage_location, storage_file_id)
);
create index aet_documents_application on aet_preview_core.aet_documents(application_id);

create table aet_preview_core.aet_payments (
  id text primary key default gen_random_uuid()::text,
  application_id uuid references aet_preview_core.aet_core_applications(id),
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  refunded_cents integer not null default 0 check (refunded_cents >= 0 and refunded_cents <= amount_cents),
  due_amount numeric generated always as (amount_cents::numeric / 100) stored,
  payment_status text not null
    check (payment_status in ('creating','open','pending','paid','failed','expired','partially_refunded','refunded','legacy_reported')),
  provider text,
  provider_account text,
  provider_mode text check (provider_mode in ('test','live')),
  checkout_session_id text,
  payment_intent_id text,
  payment_id text,
  source text,
  notes text,
  payer_snapshot jsonb check (jsonb_typeof(payer_snapshot) = 'object'),
  paid_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  check ((checkout_session_id is null and payment_intent_id is null)
    or (provider is not null and provider_account is not null and provider_mode is not null)),
  unique (provider, provider_account, provider_mode, checkout_session_id),
  unique (provider, provider_account, provider_mode, payment_intent_id)
);
create index aet_payments_application on aet_preview_core.aet_payments(application_id);
create unique index aet_payments_one_open on aet_preview_core.aet_payments(application_id)
  where application_id is not null and payment_status in ('creating','open');

-- A captured submission is evidence, not a projection of later staff edits.
create function aet_preview_core.protect_submission() returns trigger language plpgsql
set search_path = pg_catalog as $$
begin
  if old.submitted_snapshot is not null and
    (new.submitted_snapshot is distinct from old.submitted_snapshot or
     new.submission_version is distinct from old.submission_version) then
    raise exception 'Submitted snapshots are immutable';
  end if;
  return new;
end $$;
create trigger protect_submission before update on aet_preview_core.aet_core_applications
  for each row execute function aet_preview_core.protect_submission();

-- JSON references must not cross application boundaries. Revisions are pinned
-- in results; refreshing a document's current rev must not rewrite old results.
create function aet_preview_core.check_service_references() returns trigger language plpgsql
set search_path = pg_catalog as $$
declare reference jsonb;
begin
  if new.details ? 'education_ids' then
    if jsonb_typeof(new.details->'education_ids') <> 'array' then
      raise exception 'education_ids must be an array';
    end if;
    for reference in select value from jsonb_array_elements(new.details->'education_ids') loop
      perform 1 from aet_preview_core.aet_education where id=(reference #>> '{}')::uuid
        and application_id=new.application_id for key share;
      if not found then raise exception 'Education does not belong to application'; end if;
    end loop;
  end if;
  if new.result is not null then
    for reference in select value from jsonb_array_elements(new.result->'documents') loop
      if not (reference ?& array['document_id','storage_rev'])
        or nullif(reference->>'storage_rev','') is null then
        raise exception 'Result document requires ID and revision';
      end if;
      perform 1 from aet_preview_core.aet_documents where id=(reference->>'document_id')::uuid
        and application_id=new.application_id for key share;
      if not found then raise exception 'Document does not belong to application'; end if;
    end loop;
  end if;
  return new;
end $$;
create trigger check_service_references before insert or update on aet_preview_core.aet_service_detail
  for each row execute function aet_preview_core.check_service_references();

-- Keep JSON reference ownership valid when a referenced row is changed later.
create function aet_preview_core.protect_reference_identity() returns trigger language plpgsql
set search_path = pg_catalog as $$
begin
  if tg_op = 'UPDATE' then
    if new.id is distinct from old.id or new.application_id is distinct from old.application_id then
      raise exception 'Application association is immutable; reconcile explicitly';
    end if;
    if tg_table_name = 'aet_documents' then
      if new.storage_location is distinct from old.storage_location or new.storage_file_id is distinct from old.storage_file_id then
        raise exception 'Storage file identity is immutable; reconcile explicitly';
      end if;
    end if;
    return new;
  end if;
  if tg_table_name = 'aet_education' and exists (
    select 1 from aet_preview_core.aet_service_detail where application_id=old.application_id
      and details->'education_ids' @> jsonb_build_array(old.id::text)
  ) then raise exception 'Education is referenced by a service'; end if;
  if tg_table_name = 'aet_documents' and exists (
    select 1 from aet_preview_core.aet_service_detail where application_id=old.application_id
      and result->'documents' @> jsonb_build_array(jsonb_build_object('document_id',old.id::text))
  ) then raise exception 'Document is referenced by a service result'; end if;
  return old;
end $$;
create trigger protect_education_identity before update or delete on aet_preview_core.aet_education
  for each row execute function aet_preview_core.protect_reference_identity();
create trigger protect_document_identity before update or delete on aet_preview_core.aet_documents
  for each row execute function aet_preview_core.protect_reference_identity();
create trigger protect_service_identity before update on aet_preview_core.aet_service_detail
  for each row execute function aet_preview_core.protect_reference_identity();

-- No client policies: access adapters/office scoping are a later phase.
alter table aet_preview_core.aet_core_applications enable row level security;
alter table aet_preview_core.aet_education enable row level security;
alter table aet_preview_core.aet_service_detail enable row level security;
alter table aet_preview_core.aet_documents enable row level security;
alter table aet_preview_core.aet_payments enable row level security;
revoke all on all tables in schema aet_preview_core from public, anon, authenticated;
revoke all on all functions in schema aet_preview_core from public, anon, authenticated;
alter default privileges in schema aet_preview_core revoke all on tables from public, anon, authenticated;
alter default privileges in schema aet_preview_core revoke execute on functions from public, anon, authenticated;

grant usage on schema aet_preview_core to aet_preview_runtime;
grant select, insert, update, delete on all tables in schema aet_preview_core to aet_preview_runtime;
grant execute on all functions in schema aet_preview_core to aet_preview_runtime;
create policy preview_server on aet_preview_core.aet_core_applications for all to aet_preview_runtime using (true) with check (true);
create policy preview_server on aet_preview_core.aet_education for all to aet_preview_runtime using (true) with check (true);
create policy preview_server on aet_preview_core.aet_service_detail for all to aet_preview_runtime using (true) with check (true);
create policy preview_server on aet_preview_core.aet_documents for all to aet_preview_runtime using (true) with check (true);
create policy preview_server on aet_preview_core.aet_payments for all to aet_preview_runtime using (true) with check (true);
