alter table public.aet_fce_aice_report add column archived_at timestamptz;

-- Keep report writes and their revision record atomic. Callers use the server
-- service role; these functions do not elevate privileges.
create function public.aet_eval_save_report(
  p_id uuid, p_name text, p_content jsonb, p_expected_updated_at timestamptz
) returns public.aet_fce_aice_report
language plpgsql security invoker set search_path = '' as $$
declare current_report public.aet_fce_aice_report;
begin
  select * into current_report from public.aet_fce_aice_report where id=p_id for update;
  if found then
    if p_expected_updated_at is null or current_report.updated_at <> p_expected_updated_at then
      raise exception 'EVAL_CONFLICT';
    end if;
    update public.aet_fce_aice_report set name=p_name, content=p_content where id=p_id returning * into current_report;
  else
    if p_expected_updated_at is not null then raise exception 'EVAL_NOT_FOUND'; end if;
    begin
      insert into public.aet_fce_aice_report(id,name,content) values(p_id,p_name,p_content) returning * into current_report;
    exception when unique_violation then raise exception 'EVAL_CONFLICT'; end;
  end if;
  insert into public.report_history(report_id,content,created_by) values(p_id,p_content,'AET Eval');
  return current_report;
end;
$$;

-- Archiving is reversible and retains all reports, versions, chats and files.
create function public.aet_eval_set_archived(p_id uuid, p_expected_updated_at timestamptz, p_archived boolean)
returns public.aet_fce_aice_report language plpgsql security invoker set search_path = '' as $$
declare current_report public.aet_fce_aice_report;
begin
  select * into current_report from public.aet_fce_aice_report where id=p_id for update;
  if not found then raise exception 'EVAL_NOT_FOUND'; end if;
  if p_expected_updated_at is null or current_report.updated_at <> p_expected_updated_at then raise exception 'EVAL_CONFLICT'; end if;
  update public.aet_fce_aice_report set archived_at=case when p_archived then now() else null end
    where id=p_id returning * into current_report;
  return current_report;
end;
$$;

revoke all on function public.aet_eval_save_report(uuid,text,jsonb,timestamptz),
  public.aet_eval_set_archived(uuid,timestamptz,boolean) from public, anon, authenticated;
grant execute on function public.aet_eval_save_report(uuid,text,jsonb,timestamptz),
  public.aet_eval_set_archived(uuid,timestamptz,boolean) to service_role;
