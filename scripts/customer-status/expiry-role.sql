-- Run as the database administrator at the separately approved production cutover.
-- Provision a password for this NOLOGIN role separately, then enable LOGIN.
-- No general payment-write permission is added to the CRM runtime.
do $$ begin
  if not exists (select 1 from pg_roles where rolname='aet_payment_expiry') then
    create role aet_payment_expiry nologin nosuperuser nocreatedb nocreaterole noinherit nobypassrls;
  end if;
  if exists (select 1 from pg_roles where rolname='aet_payment_expiry'
    and (rolsuper or rolbypassrls or rolcreatedb or rolcreaterole)) then
    raise exception 'Unexpected privileged expiry role';
  end if;
  if not (select relrowsecurity from pg_class where oid='public.fce_applications'::regclass) then
    raise exception 'Existing formal application RLS must be enabled';
  end if;
end $$;
grant usage on schema public to aet_payment_expiry;
grant select (id,status,payment_status,submitted_at), update (payment_status)
  on public.fce_applications to aet_payment_expiry;
-- Restrictive policy fences any permissive PUBLIC policy inherited by this role.
drop policy if exists aet_payment_expiry_read on public.fce_applications;
create policy aet_payment_expiry_read on public.fce_applications for select to aet_payment_expiry using (true);
drop policy if exists aet_payment_expiry_update on public.fce_applications;
create policy aet_payment_expiry_update on public.fce_applications for update to aet_payment_expiry
  using (payment_status='pending' and status in ('submitted','cancelled') and submitted_at < now()-interval '48 hours')
  with check (payment_status='expired' and status in ('submitted','cancelled') and submitted_at < now()-interval '48 hours');
drop policy if exists aet_payment_expiry_fence on public.fce_applications;
create policy aet_payment_expiry_fence on public.fce_applications as restrictive for update to aet_payment_expiry
  using (payment_status='pending' and status in ('submitted','cancelled') and submitted_at < now()-interval '48 hours')
  with check (payment_status='expired' and status in ('submitted','cancelled') and submitted_at < now()-interval '48 hours');
