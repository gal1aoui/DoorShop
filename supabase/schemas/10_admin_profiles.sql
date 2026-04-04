begin;

create table if not exists public.admin_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default timezone('utc', now())
);

commit;
