begin;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'order_status'
  ) then
    create type public.order_status as enum (
      'received',
      'confirmed',
      'constructing',
      'delivering',
      'delivered'
    );
  end if;
end;
$$;

commit;
