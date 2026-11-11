-- Only the private dev Preview schema. No Production tables or grants change.
-- Formal evaluation has a reviewing stage; reuse the existing six tables.
alter table aet_preview_shared.aet_core_applications drop constraint aet_core_applications_status_check;
alter table aet_preview_shared.aet_core_applications add constraint aet_core_applications_status_check
  check(status in ('draft','submitted','reviewing','processing','needs_information','completed','cancelled'));
alter table aet_preview_shared.aet_service_detail drop constraint aet_service_detail_status_check;
alter table aet_preview_shared.aet_service_detail add constraint aet_service_detail_status_check
  check(status in ('draft','submitted','reviewing','processing','needs_information','completed','cancelled'));
