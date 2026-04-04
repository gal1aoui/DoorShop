begin;

do $$
declare
  v_admin_email constant text := 'admin@admin.com';
  v_admin_password constant text := 'a123456A';
  v_admin_user_id uuid;
begin
  select id
  into v_admin_user_id
  from auth.users
  where email = v_admin_email
  limit 1;

  if v_admin_user_id is null then
    v_admin_user_id := gen_random_uuid();

    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    )
    values (
      '00000000-0000-0000-0000-000000000000',
      v_admin_user_id,
      'authenticated',
      'authenticated',
      v_admin_email,
      crypt(v_admin_password, gen_salt('bf')),
      timezone('utc', now()),
      jsonb_build_object('provider', 'email', 'providers', array['email']),
      jsonb_build_object('display_name', 'Main Admin'),
      timezone('utc', now()),
      timezone('utc', now())
    );
  else
    update auth.users
    set
      encrypted_password = crypt(v_admin_password, gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, timezone('utc', now())),
      updated_at = timezone('utc', now())
    where id = v_admin_user_id;
  end if;

  if not exists (
    select 1
    from auth.identities
    where user_id = v_admin_user_id
      and provider = 'email'
  ) then
    insert into auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    )
    values (
      gen_random_uuid(),
      v_admin_user_id,
      jsonb_build_object(
        'sub',
        v_admin_user_id::text,
        'email',
        v_admin_email
      ),
      'email',
      v_admin_email,
      timezone('utc', now()),
      timezone('utc', now()),
      timezone('utc', now())
    );
  end if;

  insert into public.admin_profiles (id, display_name)
  values (v_admin_user_id, 'Main Admin')
  on conflict (id) do update
  set display_name = excluded.display_name;
end;
$$;

commit;
