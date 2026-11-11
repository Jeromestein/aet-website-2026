-- Retire only the twelve migrated dev Preview formal tables. Never use CASCADE.
-- Runtime acceptance: 1e186b6. Backup restored and exact retirement rehearsed.
SET LOCAL TIME ZONE 'UTC';
SET LOCAL lock_timeout = '5s';
DO $guard$
DECLARE item jsonb; actual_hash text;
BEGIN
 IF (SELECT count(*) FROM pg_tables WHERE schemaname LIKE 'aet_preview_%') <> 18 OR
    (SELECT count(*) FROM pg_tables WHERE schemaname='aet_preview_shared') <> 6 THEN
   RAISE EXCEPTION 'Expected eighteen Preview tables including six shared tables';
 END IF;
 FOR item IN SELECT value FROM jsonb_array_elements('[{"name":"aet_preview_evaluation.access_tokens","hash":"d751713988987e9331980363e24189ce"},{"name":"aet_preview_evaluation.applications","hash":"911d5c26735155ffe6dffb055103eaa4"},{"name":"aet_preview_evaluation.audit","hash":"f8bb16c17033bb2c53a0bd1436194dd8"},{"name":"aet_preview_evaluation.document_locations","hash":"58417d13471f2d0fd4f167016083f870"},{"name":"aet_preview_evaluation.emails","hash":"d751713988987e9331980363e24189ce"},{"name":"aet_preview_evaluation.files","hash":"d751713988987e9331980363e24189ce"},{"name":"aet_preview_evaluation.intake_emails","hash":"dc89a0df270f660b8e45dd0c006f5485"},{"name":"aet_preview_evaluation.payment_events","hash":"d751713988987e9331980363e24189ce"},{"name":"aet_preview_evaluation.payments","hash":"d751713988987e9331980363e24189ce"},{"name":"aet_preview_evaluation.sessions","hash":"d751713988987e9331980363e24189ce"},{"name":"aet_preview_legacy.fce_applications","hash":"39d4d7f2bca2a1ccd74f134f16b94cac"},{"name":"aet_preview_legacy.fce_educations","hash":"3a6489957c757fc88c26140684420437"}]'::jsonb) LOOP
   EXECUTE format('LOCK TABLE %s IN ACCESS EXCLUSIVE MODE',item->>'name');
   IF has_table_privilege('aet_preview_runtime',item->>'name','INSERT,UPDATE,DELETE,TRUNCATE') THEN RAISE EXCEPTION 'Old Preview writers must be frozen'; END IF;
   EXECUTE format('SELECT md5(coalesce(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text COLLATE "C"),''[]''::jsonb)::text) FROM %s t',item->>'name') INTO actual_hash;
   IF actual_hash IS DISTINCT FROM item->>'hash' THEN RAISE EXCEPTION 'Source changed: %',item->>'name'; END IF;
 END LOOP;
 IF EXISTS (SELECT id FROM aet_preview_evaluation.applications EXCEPT SELECT id FROM aet_preview_shared.aet_core_applications WHERE primary_service='evaluation') THEN RAISE EXCEPTION 'Missing formal application'; END IF;
 IF EXISTS (SELECT id FROM aet_preview_legacy.fce_applications EXCEPT SELECT id FROM aet_preview_shared.aet_core_applications WHERE primary_service='evaluation') THEN RAISE EXCEPTION 'Missing legacy application'; END IF;
 IF EXISTS (SELECT id FROM aet_preview_legacy.fce_educations EXCEPT SELECT id FROM aet_preview_shared.aet_education) THEN RAISE EXCEPTION 'Missing education'; END IF;
 IF EXISTS (SELECT id FROM aet_preview_evaluation.applications EXCEPT SELECT application_id FROM aet_preview_shared.aet_service_detail WHERE service_type='evaluation') THEN RAISE EXCEPTION 'Missing service detail'; END IF;
 IF EXISTS (SELECT id::text FROM aet_preview_evaluation.payments EXCEPT SELECT id FROM aet_preview_shared.aet_payments) THEN RAISE EXCEPTION 'Missing payment'; END IF;
 IF EXISTS (SELECT 1 FROM aet_preview_shared.aet_documents WHERE application_id IN(SELECT id FROM aet_preview_evaluation.applications) AND (storage_file_id IS NULL OR upload_state<>'ready')) THEN RAISE EXCEPTION 'Unresolved migrated file'; END IF;
 IF (SELECT count(*) FROM aet_preview_shared.aet_documents WHERE application_id IN(SELECT id FROM aet_preview_evaluation.applications)) < 4 THEN RAISE EXCEPTION 'Expected four verified historical Dropbox files'; END IF;
END $guard$;
DROP TABLE aet_preview_evaluation.access_tokens,
  aet_preview_evaluation.applications,
  aet_preview_evaluation.audit,
  aet_preview_evaluation.document_locations,
  aet_preview_evaluation.emails,
  aet_preview_evaluation.files,
  aet_preview_evaluation.intake_emails,
  aet_preview_evaluation.payment_events,
  aet_preview_evaluation.payments,
  aet_preview_evaluation.sessions,
  aet_preview_legacy.fce_applications,
  aet_preview_legacy.fce_educations;
DO $final$
BEGIN
 IF (SELECT count(*) FROM pg_tables WHERE schemaname LIKE 'aet_preview_%') <> 6 THEN RAISE EXCEPTION 'Expected exactly six Preview tables'; END IF;
END $final$;
