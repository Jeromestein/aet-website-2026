-- Retire only the verified dev Preview pre-evaluation sources. Never use CASCADE.
-- Backup restored successfully; hosted acceptance: 3128a83, November 11, 2026.
-- The twelve formal Preview tables and all Production schemas remain intact.
SET LOCAL TIME ZONE 'UTC';
SET LOCAL lock_timeout = '5s';
DO $guard$
DECLARE item jsonb; actual_hash text;
BEGIN
  IF (SELECT count(*) FROM pg_tables WHERE schemaname='aet_preview_shared') <> 6 THEN
    RAISE EXCEPTION 'Expected six activated shared Preview tables';
  END IF;
  FOR item IN SELECT value FROM jsonb_array_elements('[{"name":"aet_preview_core.aet_core_applications","hash":"70cd05aaf596ce51f82950be21bb736e"},{"name":"aet_preview_core.aet_documents","hash":"51f8f4eeb9c7039e9997922403fa0be0"},{"name":"aet_preview_core.aet_education","hash":"acdd6016b87bc22dcd4c783f4afa7150"},{"name":"aet_preview_core.aet_payments","hash":"10fad51edfe460ce55ffc0ea36d8476c"},{"name":"aet_preview_core.aet_service_detail","hash":"4b9135d25edea95937231ff9d0ba4503"},{"name":"aet_preview_legacy.aet_core_applications","hash":"464821eaf6eb0e1170c4d93f3dfb56e5"},{"name":"aet_preview_legacy.aet_core_educations","hash":"06d94f276284e07ffbf1b963a20d142d"},{"name":"aet_preview_legacy.aet_core_payments","hash":"538f06038a17936b56ff73fac7970996"},{"name":"aet_preview_preeval.ai_runs","hash":"b12b0fa136aebfde17e1d01d5cf4f846"},{"name":"aet_preview_preeval.applications","hash":"54905a94009c105cea1d68514a077ee8"},{"name":"aet_preview_preeval.audit","hash":"3f3b54e3221a1019bbdc1f690453307a"},{"name":"aet_preview_preeval.document_uploads","hash":"d751713988987e9331980363e24189ce"},{"name":"aet_preview_preeval.educations","hash":"c459d8e53787a20358b8cfcba7b533e6"},{"name":"aet_preview_preeval.emails","hash":"4082ece0a5a5ad98be69889d9f3a3311"},{"name":"aet_preview_preeval.files","hash":"b3c2db70a96c7da22d5f01c7eae539ba"},{"name":"aet_preview_preeval.payment_events","hash":"5a22aa196ad8433f69a2fc9904c2d927"},{"name":"aet_preview_preeval.payments","hash":"bca974394728bacc3239783bebc278bc"},{"name":"aet_preview_preeval.rate_limits","hash":"7a6f5d01e30e07290826e4a30530999b"},{"name":"aet_preview_preeval.sessions","hash":"47e9f852d58b23e5ec521f455a7302c4"},{"name":"aet_preview_preeval.tokens","hash":"d751713988987e9331980363e24189ce"}]'::jsonb) LOOP
    EXECUTE format('LOCK TABLE %s IN ACCESS EXCLUSIVE MODE',item->>'name');
    IF has_table_privilege('aet_preview_runtime',item->>'name','INSERT,UPDATE,DELETE,TRUNCATE') THEN
      RAISE EXCEPTION 'Old Preview writers must remain frozen';
    END IF;
    EXECUTE format('SELECT md5(coalesce(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text COLLATE "C"),''[]''::jsonb)::text) FROM %s t',item->>'name') INTO actual_hash;
    IF actual_hash IS DISTINCT FROM item->>'hash' THEN RAISE EXCEPTION 'Source changed: %',item->>'name'; END IF;
  END LOOP;
  IF EXISTS (SELECT id FROM aet_preview_preeval.applications EXCEPT SELECT id FROM aet_preview_shared.aet_core_applications) THEN RAISE EXCEPTION 'Missing migrated application'; END IF;
  IF EXISTS (SELECT id FROM aet_preview_preeval.files WHERE state='ready' EXCEPT SELECT id FROM aet_preview_shared.aet_documents WHERE upload_state='ready' AND storage_file_id IS NOT NULL) THEN RAISE EXCEPTION 'Missing migrated file'; END IF;
  IF EXISTS (SELECT id::text FROM aet_preview_preeval.payments EXCEPT SELECT id FROM aet_preview_shared.aet_payments) THEN RAISE EXCEPTION 'Missing migrated payment'; END IF;
END $guard$;
DROP TABLE aet_preview_core.aet_core_applications,
  aet_preview_core.aet_documents,
  aet_preview_core.aet_education,
  aet_preview_core.aet_payments,
  aet_preview_core.aet_service_detail,
  aet_preview_legacy.aet_core_applications,
  aet_preview_legacy.aet_core_educations,
  aet_preview_legacy.aet_core_payments,
  aet_preview_preeval.ai_runs,
  aet_preview_preeval.applications,
  aet_preview_preeval.audit,
  aet_preview_preeval.document_uploads,
  aet_preview_preeval.educations,
  aet_preview_preeval.emails,
  aet_preview_preeval.files,
  aet_preview_preeval.payment_events,
  aet_preview_preeval.payments,
  aet_preview_preeval.rate_limits,
  aet_preview_preeval.sessions,
  aet_preview_preeval.tokens;
DO $final$
BEGIN
 IF (SELECT count(*) FROM pg_tables WHERE schemaname LIKE 'aet_preview_%') <> 18 THEN RAISE EXCEPTION 'Expected eighteen retained Preview tables'; END IF;
END $final$;
