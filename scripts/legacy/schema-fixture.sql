-- Local test fixture captured from the legacy database catalog on 2026-10-02.
-- No customer rows or production policies. Apply only through setup-local.ts.
create table public.aet_core_applications (
  "id" uuid default gen_random_uuid() not null,
  "first_name" text not null,
  "last_name" text not null,
  "email" text not null,
  "purpose" text,
  "source" text,
  "status" text default 'draft'::text not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "middle_name" text,
  constraint "aet_core_applications_email_check" CHECK ((email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text)),
  constraint "aet_core_applications_pkey" PRIMARY KEY (id),
  constraint "aet_core_applications_status_check" CHECK ((status = ANY (ARRAY['draft'::text, 'submitted'::text, 'processing'::text, 'completed'::text, 'cancelled'::text])))
);
alter table public.aet_core_applications enable row level security;
revoke all on public.aet_core_applications from public, anon, authenticated;
create table public.aet_core_educations (
  "id" uuid default gen_random_uuid() not null,
  "application_id" uuid not null,
  "country_of_study" text not null,
  "degree_obtained" text not null,
  "school_name" text not null,
  "study_start_date" jsonb not null,
  "study_end_date" jsonb not null,
  "ai_output" jsonb,
  constraint "aet_core_educations_pkey" PRIMARY KEY (id)
);
alter table public.aet_core_educations enable row level security;
revoke all on public.aet_core_educations from public, anon, authenticated;
create table public.aet_core_payments (
  "id" text not null,
  "application_id" uuid,
  "due_amount" numeric(6,2) not null,
  "payment_status" text default 'pending'::text not null,
  "paid_at" timestamp with time zone,
  "payment_id" text,
  "source" text,
  "notes" text,
  constraint "aet_core_payments_pkey" PRIMARY KEY (id)
);
alter table public.aet_core_payments enable row level security;
revoke all on public.aet_core_payments from public, anon, authenticated;
create table public.fce_applications (
  "id" uuid default gen_random_uuid() not null,
  "status" text default 'draft'::text not null,
  "current_step" smallint default 0 not null,
  "name" text not null,
  "country" text not null,
  "street_address" text not null,
  "street_address2" text,
  "city" text not null,
  "region" text not null,
  "zip_code" text not null,
  "fax" text,
  "phone" text not null,
  "email" text not null,
  "purpose" text not null,
  "purpose_other" text,
  "pronouns" text not null,
  "first_name" text not null,
  "last_name" text not null,
  "middle_name" text,
  "date_of_birth" date not null,
  "service_type" jsonb not null,
  "delivery_method" text not null,
  "additional_services" text[] default '{}'::text[],
  "additional_services_quantity" jsonb default '{"pdf_only": 0, "extra_copy": 0, "pdf_with_hard_copy": 0}'::jsonb,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "submitted_at" timestamp with time zone,
  "payment_status" text default 'pending'::text,
  "payment_id" text,
  "paid_at" timestamp with time zone,
  "office" text,
  "due_amount" numeric(6,2) default NULL::numeric,
  constraint "fce_applications_delivery_method_check" CHECK ((delivery_method = ANY (ARRAY['no_delivery_needed'::text, 'usps_first_class_domestic'::text, 'usps_first_class_international'::text, 'usps_priority_domestic'::text, 'usps_express_domestic'::text, 'ups_express_domestic'::text, 'usps_express_international'::text, 'fedex_express_international'::text]))),
  constraint "fce_applications_email_check" CHECK ((email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text)),
  constraint "fce_applications_fax_check" CHECK ((fax ~ '^\d{3}-\d{3}-\d{4}$'::text)),
  constraint "fce_applications_payment_status_check" CHECK ((payment_status = ANY (ARRAY['pending'::text, 'paid'::text, 'failed'::text, 'expired'::text, 'refunded'::text]))),
  constraint "fce_applications_payment_status_check1" CHECK ((payment_status = ANY (ARRAY['boston'::text, 'new york'::text, 'miami'::text, 'san francisco'::text, 'los angeles'::text, NULL::text]))),
  constraint "fce_applications_phone_check" CHECK ((phone ~ '^\d{3}-\d{3}-\d{4}$'::text)),
  constraint "fce_applications_pkey" PRIMARY KEY (id),
  constraint "fce_applications_pronouns_check" CHECK ((pronouns = ANY (ARRAY['mr'::text, 'ms'::text, 'mx'::text]))),
  constraint "fce_applications_purpose_check" CHECK ((purpose = ANY (ARRAY['evaluation-uscis'::text, 'evaluation-immigration'::text, 'evaluation-employment'::text, 'evaluation-education'::text, 'immigration'::text, 'employment'::text, 'education'::text, 'other'::text, 'translation'::text, 'evaluation'::text, 'interpretation'::text, 'visa'::text]))),
  constraint "fce_applications_status_check" CHECK ((status = ANY (ARRAY['draft'::text, 'submitted'::text, 'processing'::text, 'completed'::text, 'cancelled'::text]))),
  constraint "fce_applications_zip_code_check" CHECK ((zip_code ~ '^\d{5}(-\d{4})?$'::text))
);
alter table public.fce_applications enable row level security;
revoke all on public.fce_applications from public, anon, authenticated;
create table public.fce_educations (
  "id" uuid default gen_random_uuid() not null,
  "application_id" uuid not null,
  "country_of_study" text not null,
  "degree_obtained" text not null,
  "school_name" text not null,
  "study_start_date" jsonb not null,
  "study_end_date" jsonb not null,
  constraint "fce_educations_pkey" PRIMARY KEY (id)
);
alter table public.fce_educations enable row level security;
revoke all on public.fce_educations from public, anon, authenticated;
alter table public.aet_core_educations add constraint "aet_core_educations_application_id_fkey" FOREIGN KEY (application_id) REFERENCES aet_core_applications(id) ON DELETE CASCADE;
alter table public.aet_core_payments add constraint "aet_core_payments_application_id_fkey" FOREIGN KEY (application_id) REFERENCES aet_core_applications(id) ON DELETE CASCADE;
alter table public.fce_educations add constraint "fce_educations_application_id_fkey" FOREIGN KEY (application_id) REFERENCES fce_applications(id) ON DELETE CASCADE;
