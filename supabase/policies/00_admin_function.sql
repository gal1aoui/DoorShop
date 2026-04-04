begin;

create or replace function public.is_admin(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_profiles ap
    where ap.id = p_user_id
  );
$$;

grant execute on function public.is_admin(uuid) to anon, authenticated;

commit;
