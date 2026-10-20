-- Delivery metadata only. Keep existing IDs and provider receipts; never resend sent rows.
alter table preeval.emails
 add column if not exists result_version integer,
 add column if not exists information_request_id bigint references preeval.audit(id),
 add column if not exists access_token text,
 add column if not exists payload_hash text,
 add column if not exists first_attempt_at timestamptz,
 add column if not exists lease uuid;

-- Old pending messages lack reproducible business references/digests. Retain their
-- delivery records for reconciliation instead of silently resending different content.
do $$
begin
 if exists(select 1 from information_schema.columns where table_schema='preeval' and table_name='emails' and column_name='html') then
  update preeval.emails set state='failed',error='legacy_template_review',available_at='infinity',locked_at=null,lease=null
    where state<>'sent';
 end if;
end $$;
alter table preeval.emails drop column if exists subject, drop column if exists html;

-- Formal intake exists only in the isolated preview today.
do $$
begin
 if to_regclass('evaluation.intake_emails') is not null then
  alter table evaluation.intake_emails add column if not exists payload_hash text;
  if exists(select 1 from information_schema.columns where table_schema='evaluation' and table_name='intake_emails' and column_name='html') then
   update evaluation.intake_emails set state='failed',error='legacy_template_review',available_at='infinity',locked_at=null,lease=null
     where state<>'sent' and attempts>0;
  end if;
  alter table evaluation.intake_emails drop column if exists subject, drop column if exists html;
 end if;
end $$;
