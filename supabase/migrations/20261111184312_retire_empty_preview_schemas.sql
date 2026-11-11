-- Remove only obsolete dev Preview namespaces after six-table convergence.
-- Explicit RESTRICT prevents deletion of any newly introduced dependency.
SET LOCAL lock_timeout = '5s';
DO $guard$
DECLARE schemas text[] := ARRAY['aet_preview_core','aet_preview_evaluation','aet_preview_legacy','aet_preview_preeval'];
BEGIN
 IF (SELECT count(*) FROM pg_namespace WHERE nspname=ANY(schemas)) <> 4 THEN
   RAISE EXCEPTION 'Expected four retired Preview schemas';
 END IF;
 IF EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=ANY(schemas)) THEN
   RAISE EXCEPTION 'Retired schema contains a relation';
 END IF;
 IF (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname=ANY(schemas)) <> 7 THEN
   RAISE EXCEPTION 'Expected exactly seven obsolete functions';
 END IF;
 IF EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname<>ALL(schemas) AND p.prosrc ~ 'aet_preview_(core|evaluation|legacy|preeval)') THEN
   RAISE EXCEPTION 'External function still references retired Preview schemas';
 END IF;
 IF (SELECT count(*) FROM pg_tables WHERE schemaname='aet_preview_shared') <> 6 THEN
   RAISE EXCEPTION 'Expected six active shared Preview tables';
 END IF;
END $guard$;
DROP FUNCTION aet_preview_core.check_service_references() RESTRICT;
DROP FUNCTION aet_preview_core.protect_reference_identity() RESTRICT;
DROP FUNCTION aet_preview_core.protect_submission() RESTRICT;
DROP FUNCTION aet_preview_evaluation.sync_legacy_payment() RESTRICT;
DROP FUNCTION aet_preview_evaluation.sync_legacy_workflow() RESTRICT;
DROP FUNCTION aet_preview_preeval.sync_legacy_payment() RESTRICT;
DROP FUNCTION aet_preview_preeval.sync_legacy_workflow() RESTRICT;
DROP SCHEMA aet_preview_core RESTRICT;
DROP SCHEMA aet_preview_evaluation RESTRICT;
DROP SCHEMA aet_preview_legacy RESTRICT;
DROP SCHEMA aet_preview_preeval RESTRICT;
DO $verify$
BEGIN
 IF EXISTS(SELECT 1 FROM pg_namespace WHERE nspname IN('aet_preview_core','aet_preview_evaluation','aet_preview_legacy','aet_preview_preeval')) THEN
   RAISE EXCEPTION 'Retired Preview schema remains';
 END IF;
 IF (SELECT count(*) FROM pg_tables WHERE schemaname LIKE 'aet_preview_%') <> 6 OR
    (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='aet_preview_shared') <> 3 THEN
   RAISE EXCEPTION 'Active Preview inventory changed';
 END IF;
END $verify$;
