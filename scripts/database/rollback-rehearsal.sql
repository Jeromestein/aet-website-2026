-- Disposable rehearsal only. Source workflows/public compatibility stay intact.
begin;
do $$ begin
  if current_database() <> 'aet_core_rehearsal' or session_user <> 'core_rehearsal'
    or inet_server_addr() is not null then
    raise exception 'Rollback is restricted to the disposable rehearsal database';
  end if;
end $$;
drop schema aet cascade;
commit;
