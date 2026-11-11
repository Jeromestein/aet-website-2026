-- Dev Preview only. Creates an empty private six-table target, without changing source or Production tables.
-- Data import, source-writer freeze, acceptance and old-table retirement are separate guarded steps.
DO $$ BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='aet_preview_runtime' AND NOT rolsuper AND NOT rolbypassrls) THEN
    RAISE EXCEPTION 'Restricted Preview role required';
  END IF;
END $$;
CREATE SCHEMA aet_preview_shared;


--
-- Name: check_service_references(); Type: FUNCTION; Schema: aet; Owner: -
--

CREATE FUNCTION aet_preview_shared.check_service_references() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'pg_catalog'
    AS $$
declare reference jsonb;
begin
  if new.details ? 'education_ids' then
    if jsonb_typeof(new.details->'education_ids') <> 'array' then
      raise exception 'education_ids must be an array';
    end if;
    for reference in select value from jsonb_array_elements(new.details->'education_ids') loop
      perform 1 from aet_preview_shared.aet_education where id=(reference #>> '{}')::uuid
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
      perform 1 from aet_preview_shared.aet_documents where id=(reference->>'document_id')::uuid
        and application_id=new.application_id for key share;
      if not found then raise exception 'Document does not belong to application'; end if;
    end loop;
  end if;
  return new;
end $$;


--
-- Name: protect_reference_identity(); Type: FUNCTION; Schema: aet; Owner: -
--

CREATE FUNCTION aet_preview_shared.protect_reference_identity() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'pg_catalog'
    AS $$
begin
  if tg_op = 'UPDATE' then
    if new.id is distinct from old.id or new.application_id is distinct from old.application_id then
      raise exception 'Application association is immutable; reconcile explicitly';
    end if;
    if tg_table_name = 'aet_documents' then
      if old.storage_file_id is not null and (new.storage_location is distinct from old.storage_location or new.storage_file_id is distinct from old.storage_file_id) then
        raise exception 'Storage file identity is immutable; reconcile explicitly';
      end if;
    end if;
    return new;
  end if;
  if tg_table_name = 'aet_education' and exists (
    select 1 from aet_preview_shared.aet_service_detail where application_id=old.application_id
      and details->'education_ids' @> jsonb_build_array(old.id::text)
  ) then raise exception 'Education is referenced by a service'; end if;
  if tg_table_name = 'aet_documents' and exists (
    select 1 from aet_preview_shared.aet_service_detail where application_id=old.application_id
      and result->'documents' @> jsonb_build_array(jsonb_build_object('document_id',old.id::text))
  ) then raise exception 'Document is referenced by a service result'; end if;
  return old;
end $$;


--
-- Name: protect_submission(); Type: FUNCTION; Schema: aet; Owner: -
--

CREATE FUNCTION aet_preview_shared.protect_submission() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'pg_catalog'
    AS $$
begin
  if old.submitted_snapshot is not null and
    (new.submitted_snapshot is distinct from old.submitted_snapshot or
     new.submission_version is distinct from old.submission_version) then
    raise exception 'Submitted snapshots are immutable';
  end if;
  return new;
end $$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: aet_ai_runs; Type: TABLE; Schema: aet; Owner: -
--

CREATE TABLE aet_preview_shared.aet_ai_runs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    application_id uuid NOT NULL,
    input_version integer NOT NULL,
    input jsonb DEFAULT '{}'::jsonb NOT NULL,
    output jsonb,
    state text DEFAULT 'running'::text NOT NULL,
    error text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    model text,
    response_id text,
    usage jsonb,
    input_hash text,
    prompt_version text,
    current boolean DEFAULT true NOT NULL,
    uploads_pending boolean DEFAULT false NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    available_at timestamp with time zone DEFAULT now() NOT NULL,
    locked_at timestamp with time zone,
    lease uuid
);


--
-- Name: aet_core_applications; Type: TABLE; Schema: aet; Owner: -
--

CREATE TABLE aet_preview_shared.aet_core_applications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    contact_name text,
    email text,
    phone text,
    mailing_address jsonb,
    office text,
    primary_service text NOT NULL,
    pronouns text,
    first_name text,
    middle_name text,
    last_name text,
    date_of_birth date,
    residence_country text,
    purpose text,
    source text,
    status text DEFAULT 'draft'::text NOT NULL,
    request_id uuid,
    request_hash text,
    request_hash_version integer,
    submission_version integer,
    submitted_snapshot jsonb,
    submitted_at timestamp with time zone,
    version integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT aet_core_applications_check CHECK ((((request_id IS NULL) AND (request_hash IS NULL) AND (request_hash_version IS NULL)) OR ((request_id IS NOT NULL) AND (request_hash IS NOT NULL) AND (request_hash_version IS NOT NULL)))),
    CONSTRAINT aet_core_applications_check1 CHECK (((submitted_snapshot IS NULL) = (submission_version IS NULL))),
    CONSTRAINT aet_core_applications_mailing_address_check CHECK ((jsonb_typeof(mailing_address) = 'object'::text)),
    CONSTRAINT aet_core_applications_request_hash_version_check CHECK ((request_hash_version >= 0)),
    CONSTRAINT aet_core_applications_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'submitted'::text, 'processing'::text, 'needs_information'::text, 'completed'::text, 'cancelled'::text]))),
    CONSTRAINT aet_core_applications_submission_version_check CHECK ((submission_version > 0)),
    CONSTRAINT aet_core_applications_submitted_snapshot_check CHECK ((jsonb_typeof(submitted_snapshot) = 'object'::text)),
    CONSTRAINT aet_core_applications_version_check CHECK ((version > 0))
);


--
-- Name: aet_documents; Type: TABLE; Schema: aet; Owner: -
--

CREATE TABLE aet_preview_shared.aet_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    application_id uuid NOT NULL,
    storage_location text,
    storage_file_id text,
    storage_path text,
    storage_rev text,
    storage_content_hash text,
    original_filename text NOT NULL,
    mime_type text,
    size_bytes bigint,
    access_scope text DEFAULT 'staff_only'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    upload_state text DEFAULT 'ready'::text NOT NULL,
    upload_version integer DEFAULT 1 NOT NULL,
    upload_context jsonb DEFAULT '{}'::jsonb NOT NULL,
    CONSTRAINT aet_documents_access_scope_check CHECK ((access_scope = ANY (ARRAY['customer_input'::text, 'staff_only'::text]))),
    CONSTRAINT aet_documents_size_bytes_check CHECK ((size_bytes >= 0)),
    CONSTRAINT aet_documents_storage_file_id_check CHECK ((storage_file_id ~ '^id:.+'::text)),
    CONSTRAINT aet_documents_storage_location_check CHECK ((length(storage_location) > 0)),
    CONSTRAINT aet_documents_upload_state_check CHECK ((upload_state = ANY (ARRAY['uploading'::text, 'ready'::text, 'failed'::text]))),
    CONSTRAINT aet_documents_upload_version_check CHECK ((upload_version > 0)),
    CONSTRAINT ready_file_identity CHECK (((upload_state <> 'ready'::text) OR ((storage_location IS NOT NULL) AND (storage_file_id IS NOT NULL) AND (storage_rev IS NOT NULL))))
);


--
-- Name: aet_education; Type: TABLE; Schema: aet; Owner: -
--

CREATE TABLE aet_preview_shared.aet_education (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    application_id uuid NOT NULL,
    school_name text NOT NULL,
    country_of_study text NOT NULL,
    degree_obtained text NOT NULL,
    study_start_date jsonb NOT NULL,
    study_end_date jsonb NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    ai_output jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT aet_education_sort_order_check CHECK ((sort_order >= 0)),
    CONSTRAINT aet_education_study_end_date_check CHECK ((jsonb_typeof(study_end_date) = 'object'::text)),
    CONSTRAINT aet_education_study_start_date_check CHECK ((jsonb_typeof(study_start_date) = 'object'::text))
);


--
-- Name: aet_payments; Type: TABLE; Schema: aet; Owner: -
--

CREATE TABLE aet_preview_shared.aet_payments (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    application_id uuid,
    amount_cents integer NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    refunded_cents integer DEFAULT 0 NOT NULL,
    due_amount numeric GENERATED ALWAYS AS (((amount_cents)::numeric / (100)::numeric)) STORED,
    payment_status text NOT NULL,
    provider text,
    provider_account text,
    provider_mode text,
    checkout_session_id text,
    payment_intent_id text,
    payment_id text,
    source text,
    notes text,
    payer_snapshot jsonb,
    paid_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT aet_payments_amount_cents_check CHECK ((amount_cents >= 0)),
    CONSTRAINT aet_payments_check CHECK (((refunded_cents >= 0) AND (refunded_cents <= amount_cents))),
    CONSTRAINT aet_payments_check1 CHECK ((((checkout_session_id IS NULL) AND (payment_intent_id IS NULL)) OR ((provider IS NOT NULL) AND (provider_account IS NOT NULL) AND (provider_mode IS NOT NULL)))),
    CONSTRAINT aet_payments_currency_check CHECK ((currency ~ '^[A-Z]{3}$'::text)),
    CONSTRAINT aet_payments_payer_snapshot_check CHECK ((jsonb_typeof(payer_snapshot) = 'object'::text)),
    CONSTRAINT aet_payments_payment_status_check CHECK ((payment_status = ANY (ARRAY['creating'::text, 'open'::text, 'pending'::text, 'paid'::text, 'failed'::text, 'expired'::text, 'partially_refunded'::text, 'refunded'::text, 'legacy_reported'::text]))),
    CONSTRAINT aet_payments_provider_mode_check CHECK ((provider_mode = ANY (ARRAY['test'::text, 'live'::text])))
);


--
-- Name: aet_service_detail; Type: TABLE; Schema: aet; Owner: -
--

CREATE TABLE aet_preview_shared.aet_service_detail (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    application_id uuid NOT NULL,
    service_type text NOT NULL,
    details jsonb NOT NULL,
    details_version integer DEFAULT 1 NOT NULL,
    status text DEFAULT 'submitted'::text NOT NULL,
    input_version integer DEFAULT 1 NOT NULL,
    notes text,
    staff_notes text,
    customer_message text,
    amount_cents integer,
    currency text DEFAULT 'USD'::text NOT NULL,
    pricing_source text,
    result jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    result_version integer DEFAULT 0 NOT NULL,
    notification_state jsonb DEFAULT '{}'::jsonb NOT NULL,
    CONSTRAINT aet_service_detail_amount_cents_check CHECK ((amount_cents >= 0)),
    CONSTRAINT aet_service_detail_check CHECK (((amount_cents IS NOT NULL) OR (pricing_source IS NULL))),
    CONSTRAINT aet_service_detail_currency_check CHECK ((currency ~ '^[A-Z]{3}$'::text)),
    CONSTRAINT aet_service_detail_details_check CHECK ((jsonb_typeof(details) = 'object'::text)),
    CONSTRAINT aet_service_detail_details_version_check CHECK ((details_version > 0)),
    CONSTRAINT aet_service_detail_input_version_check CHECK ((input_version > 0)),
    CONSTRAINT aet_service_detail_notes_check CHECK ((char_length(notes) <= 3000)),
    CONSTRAINT aet_service_detail_notification_state_check CHECK ((jsonb_typeof(notification_state) = 'object'::text)),
    CONSTRAINT aet_service_detail_pricing_source_check CHECK ((pricing_source = ANY (ARRAY['automatic'::text, 'manual'::text]))),
    CONSTRAINT aet_service_detail_result_check CHECK (((result IS NULL) OR COALESCE(((jsonb_typeof(result) = 'object'::text) AND (result ?& ARRAY['content'::text, 'documents'::text, 'status'::text, 'released_at'::text, 'input_version'::text, 'version'::text]) AND ((result ->> 'status'::text) = ANY (ARRAY['draft'::text, 'released'::text])) AND (jsonb_typeof((result -> 'documents'::text)) = 'array'::text) AND (jsonb_typeof((result -> 'input_version'::text)) = 'number'::text) AND (jsonb_typeof((result -> 'version'::text)) = 'number'::text)), false))),
    CONSTRAINT aet_service_detail_result_version_check CHECK ((result_version >= 0)),
    CONSTRAINT aet_service_detail_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'submitted'::text, 'processing'::text, 'needs_information'::text, 'completed'::text, 'cancelled'::text])))
);


--
-- Name: aet_core_applications aet_core_applications_pkey; Type: CONSTRAINT; Schema: aet; Owner: -
--

ALTER TABLE ONLY aet_preview_shared.aet_core_applications
    ADD CONSTRAINT aet_core_applications_pkey PRIMARY KEY (id);


--
-- Name: aet_core_applications aet_core_applications_request_id_key; Type: CONSTRAINT; Schema: aet; Owner: -
--

ALTER TABLE ONLY aet_preview_shared.aet_core_applications
    ADD CONSTRAINT aet_core_applications_request_id_key UNIQUE (request_id);


--
-- Name: aet_documents aet_documents_pkey; Type: CONSTRAINT; Schema: aet; Owner: -
--

ALTER TABLE ONLY aet_preview_shared.aet_documents
    ADD CONSTRAINT aet_documents_pkey PRIMARY KEY (id);


--
-- Name: aet_documents aet_documents_storage_location_storage_file_id_key; Type: CONSTRAINT; Schema: aet; Owner: -
--

ALTER TABLE ONLY aet_preview_shared.aet_documents
    ADD CONSTRAINT aet_documents_storage_location_storage_file_id_key UNIQUE (storage_location, storage_file_id);


--
-- Name: aet_education aet_education_pkey; Type: CONSTRAINT; Schema: aet; Owner: -
--

ALTER TABLE ONLY aet_preview_shared.aet_education
    ADD CONSTRAINT aet_education_pkey PRIMARY KEY (id);


--
-- Name: aet_payments aet_payments_pkey; Type: CONSTRAINT; Schema: aet; Owner: -
--

ALTER TABLE ONLY aet_preview_shared.aet_payments
    ADD CONSTRAINT aet_payments_pkey PRIMARY KEY (id);


--
-- Name: aet_payments aet_payments_provider_provider_account_provider_mode_checko_key; Type: CONSTRAINT; Schema: aet; Owner: -
--

ALTER TABLE ONLY aet_preview_shared.aet_payments
    ADD CONSTRAINT aet_payments_provider_provider_account_provider_mode_checko_key UNIQUE (provider, provider_account, provider_mode, checkout_session_id);


--
-- Name: aet_payments aet_payments_provider_provider_account_provider_mode_paymen_key; Type: CONSTRAINT; Schema: aet; Owner: -
--

ALTER TABLE ONLY aet_preview_shared.aet_payments
    ADD CONSTRAINT aet_payments_provider_provider_account_provider_mode_paymen_key UNIQUE (provider, provider_account, provider_mode, payment_intent_id);


--
-- Name: aet_service_detail aet_service_detail_application_id_service_type_key; Type: CONSTRAINT; Schema: aet; Owner: -
--

ALTER TABLE ONLY aet_preview_shared.aet_service_detail
    ADD CONSTRAINT aet_service_detail_application_id_service_type_key UNIQUE (application_id, service_type);


--
-- Name: aet_service_detail aet_service_detail_pkey; Type: CONSTRAINT; Schema: aet; Owner: -
--

ALTER TABLE ONLY aet_preview_shared.aet_service_detail
    ADD CONSTRAINT aet_service_detail_pkey PRIMARY KEY (id);


--
-- Name: aet_ai_runs ai_runs_pkey; Type: CONSTRAINT; Schema: aet; Owner: -
--

ALTER TABLE ONLY aet_preview_shared.aet_ai_runs
    ADD CONSTRAINT ai_runs_pkey PRIMARY KEY (id);


--
-- Name: aet_ai_current; Type: INDEX; Schema: aet; Owner: -
--

CREATE UNIQUE INDEX aet_ai_current ON aet_preview_shared.aet_ai_runs USING btree (application_id) WHERE current;


--
-- Name: aet_ai_due; Type: INDEX; Schema: aet; Owner: -
--

CREATE INDEX aet_ai_due ON aet_preview_shared.aet_ai_runs USING btree (available_at) WHERE (current AND (state = ANY (ARRAY['queued'::text, 'running'::text])));


--
-- Name: aet_document_upload_key; Type: INDEX; Schema: aet; Owner: -
--

CREATE UNIQUE INDEX aet_document_upload_key ON aet_preview_shared.aet_documents USING btree (application_id, ((upload_context ->> 'key'::text)));


--
-- Name: aet_documents_application; Type: INDEX; Schema: aet; Owner: -
--

CREATE INDEX aet_documents_application ON aet_preview_shared.aet_documents USING btree (application_id);


--
-- Name: aet_education_application; Type: INDEX; Schema: aet; Owner: -
--

CREATE INDEX aet_education_application ON aet_preview_shared.aet_education USING btree (application_id, sort_order, id);


--
-- Name: aet_payments_application; Type: INDEX; Schema: aet; Owner: -
--

CREATE INDEX aet_payments_application ON aet_preview_shared.aet_payments USING btree (application_id);


--
-- Name: aet_payments_one_open; Type: INDEX; Schema: aet; Owner: -
--

CREATE UNIQUE INDEX aet_payments_one_open ON aet_preview_shared.aet_payments USING btree (application_id) WHERE ((application_id IS NOT NULL) AND (payment_status = ANY (ARRAY['creating'::text, 'open'::text])));


--
-- Name: aet_service_detail check_service_references; Type: TRIGGER; Schema: aet; Owner: -
--

CREATE TRIGGER check_service_references BEFORE INSERT OR UPDATE ON aet_preview_shared.aet_service_detail FOR EACH ROW EXECUTE FUNCTION aet_preview_shared.check_service_references();


--
-- Name: aet_documents protect_document_identity; Type: TRIGGER; Schema: aet; Owner: -
--

CREATE TRIGGER protect_document_identity BEFORE DELETE OR UPDATE ON aet_preview_shared.aet_documents FOR EACH ROW EXECUTE FUNCTION aet_preview_shared.protect_reference_identity();


--
-- Name: aet_education protect_education_identity; Type: TRIGGER; Schema: aet; Owner: -
--

CREATE TRIGGER protect_education_identity BEFORE DELETE OR UPDATE ON aet_preview_shared.aet_education FOR EACH ROW EXECUTE FUNCTION aet_preview_shared.protect_reference_identity();


--
-- Name: aet_service_detail protect_service_identity; Type: TRIGGER; Schema: aet; Owner: -
--

CREATE TRIGGER protect_service_identity BEFORE UPDATE ON aet_preview_shared.aet_service_detail FOR EACH ROW EXECUTE FUNCTION aet_preview_shared.protect_reference_identity();


--
-- Name: aet_core_applications protect_submission; Type: TRIGGER; Schema: aet; Owner: -
--

CREATE TRIGGER protect_submission BEFORE UPDATE ON aet_preview_shared.aet_core_applications FOR EACH ROW EXECUTE FUNCTION aet_preview_shared.protect_submission();


--
-- Name: aet_documents aet_documents_application_id_fkey; Type: FK CONSTRAINT; Schema: aet; Owner: -
--

ALTER TABLE ONLY aet_preview_shared.aet_documents
    ADD CONSTRAINT aet_documents_application_id_fkey FOREIGN KEY (application_id) REFERENCES aet_preview_shared.aet_core_applications(id);


--
-- Name: aet_education aet_education_application_id_fkey; Type: FK CONSTRAINT; Schema: aet; Owner: -
--

ALTER TABLE ONLY aet_preview_shared.aet_education
    ADD CONSTRAINT aet_education_application_id_fkey FOREIGN KEY (application_id) REFERENCES aet_preview_shared.aet_core_applications(id);


--
-- Name: aet_payments aet_payments_application_id_fkey; Type: FK CONSTRAINT; Schema: aet; Owner: -
--

ALTER TABLE ONLY aet_preview_shared.aet_payments
    ADD CONSTRAINT aet_payments_application_id_fkey FOREIGN KEY (application_id) REFERENCES aet_preview_shared.aet_core_applications(id);


--
-- Name: aet_service_detail aet_service_detail_application_id_fkey; Type: FK CONSTRAINT; Schema: aet; Owner: -
--

ALTER TABLE ONLY aet_preview_shared.aet_service_detail
    ADD CONSTRAINT aet_service_detail_application_id_fkey FOREIGN KEY (application_id) REFERENCES aet_preview_shared.aet_core_applications(id);


--
-- Name: aet_ai_runs ai_runs_application_id_fkey; Type: FK CONSTRAINT; Schema: aet; Owner: -
--

ALTER TABLE ONLY aet_preview_shared.aet_ai_runs
    ADD CONSTRAINT ai_runs_application_id_fkey FOREIGN KEY (application_id) REFERENCES aet_preview_shared.aet_core_applications(id);


--
-- Name: aet_ai_runs; Type: ROW SECURITY; Schema: aet; Owner: -
--

ALTER TABLE aet_preview_shared.aet_ai_runs ENABLE ROW LEVEL SECURITY;

--
-- Name: aet_core_applications; Type: ROW SECURITY; Schema: aet; Owner: -
--

ALTER TABLE aet_preview_shared.aet_core_applications ENABLE ROW LEVEL SECURITY;

--
-- Name: aet_documents; Type: ROW SECURITY; Schema: aet; Owner: -
--

ALTER TABLE aet_preview_shared.aet_documents ENABLE ROW LEVEL SECURITY;

--
-- Name: aet_education; Type: ROW SECURITY; Schema: aet; Owner: -
--

ALTER TABLE aet_preview_shared.aet_education ENABLE ROW LEVEL SECURITY;

--
-- Name: aet_payments; Type: ROW SECURITY; Schema: aet; Owner: -
--

ALTER TABLE aet_preview_shared.aet_payments ENABLE ROW LEVEL SECURITY;

--
-- Name: aet_service_detail; Type: ROW SECURITY; Schema: aet; Owner: -
--

ALTER TABLE aet_preview_shared.aet_service_detail ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


REVOKE ALL ON SCHEMA aet_preview_shared FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA aet_preview_shared TO aet_preview_runtime;
REVOKE ALL ON ALL TABLES IN SCHEMA aet_preview_shared FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA aet_preview_shared FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA aet_preview_shared TO aet_preview_runtime;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA aet_preview_shared TO aet_preview_runtime;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA aet_preview_shared TO aet_preview_runtime;
DO $$ DECLARE t record; BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='aet_preview_shared' LOOP
    EXECUTE format('ALTER TABLE aet_preview_shared.%I ENABLE ROW LEVEL SECURITY',t.tablename);
    EXECUTE format('CREATE POLICY preview_server ON aet_preview_shared.%I TO aet_preview_runtime USING (true) WITH CHECK (true)',t.tablename);
  END LOOP;
END $$;
ALTER DEFAULT PRIVILEGES IN SCHEMA aet_preview_shared REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA aet_preview_shared REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;
