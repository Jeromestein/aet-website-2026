-- Local pilot only. Existing public table definitions remain unchanged.
-- Auxiliary workflow transitions update legacy business fields atomically.
create or replace function evaluation.sync_legacy_workflow() returns trigger language plpgsql as $$
begin
  update public.fce_applications set
    status=case when new.status='reviewing' then 'submitted' when new.status='needs_information' then 'processing' else new.status end,
    payment_status=case when new.payment_status='unpaid' then 'pending' when new.payment_status='partially_refunded' then 'paid' else new.payment_status end,
    due_amount=case when new.confirmed_quote is not null then (new.confirmed_quote->>'total')::numeric / 100
      when not (new.quote->>'needsQuote')::boolean then (new.quote->>'min')::numeric / 100 else null end,
    updated_at=new.updated_at
  where id=new.id;
  return new;
end $$;
drop trigger if exists sync_legacy_workflow on evaluation.applications;
create trigger sync_legacy_workflow after update of status,payment_status,confirmed_quote on evaluation.applications for each row execute function evaluation.sync_legacy_workflow();

create or replace function evaluation.sync_legacy_payment() returns trigger language plpgsql as $$
begin
  if new.status in ('paid','partially_refunded','refunded') then
    update public.fce_applications set payment_id=new.payment_intent,
      paid_at=coalesce(paid_at,new.updated_at), updated_at=new.updated_at where id=new.application_id;
  end if;
  return new;
end $$;
drop trigger if exists sync_legacy_payment on evaluation.payments;
create trigger sync_legacy_payment after insert or update on evaluation.payments for each row execute function evaluation.sync_legacy_payment();

create or replace function preeval.sync_legacy_workflow() returns trigger language plpgsql as $$
begin
  update public.aet_core_applications set status=case when new.status='needs_information' then 'processing' else new.status end,
    updated_at=new.updated_at where id=new.id;
  if new.result is distinct from old.result then
    update public.aet_core_educations e set ai_output=case when new.result is null then null else to_jsonb(new.result->>'result') end
    from preeval.educations p where p.application_id=new.id and e.id=p.id;
  end if;
  return new;
end $$;
drop trigger if exists sync_legacy_workflow on preeval.applications;
create trigger sync_legacy_workflow after update of status,result on preeval.applications for each row execute function preeval.sync_legacy_workflow();

create or replace function preeval.sync_legacy_payment() returns trigger language plpgsql as $$
begin
  if exists(select 1 from public.aet_core_applications where id=new.application_id) then
    insert into public.aet_core_payments(id,application_id,due_amount,payment_status,paid_at,payment_id,source,notes)
    values(new.id::text,new.application_id,new.amount_cents::numeric/100,
      case when new.status in ('creating','open') then 'pending' when new.status='partially_refunded' then 'paid' else new.status end,
      case when new.status in ('paid','partially_refunded','refunded') then new.updated_at else null end,
      new.payment_intent,'website-local',case when new.refunded_cents>0 then 'Refunded USD '||(new.refunded_cents::numeric/100)::text else null end)
    on conflict(id) do update set payment_status=excluded.payment_status,paid_at=coalesce(aet_core_payments.paid_at,excluded.paid_at),
      payment_id=excluded.payment_id,notes=excluded.notes;
  end if;
  return new;
end $$;
drop trigger if exists sync_legacy_payment on preeval.payments;
create trigger sync_legacy_payment after insert or update on preeval.payments for each row execute function preeval.sync_legacy_payment();
