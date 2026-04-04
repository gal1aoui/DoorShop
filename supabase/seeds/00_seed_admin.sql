begin;

do $$
declare
  v_admin_email constant text := 'admin@admin.com';
  v_admin_user_id uuid;
begin
  select id
  into v_admin_user_id
  from auth.users
  where email = v_admin_email
  limit 1;

  if v_admin_user_id is null then
    raise exception
      'Admin auth user not found for %. Create this user first in Supabase Dashboard > Authentication > Users, then re-run this seed.',
      v_admin_email;
  end if;

  insert into public.admin_profiles (id, display_name)
  values (v_admin_user_id, 'Main Admin')
  on conflict (id) do update
  set display_name = excluded.display_name;
end;
$$;

commit;
