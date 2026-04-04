begin;

grant execute on function public.create_order_with_items(text, text, text, text, date, jsonb) to anon, authenticated;
grant execute on function public.get_order_tracking(text) to anon, authenticated;
grant execute on function public.normalize_phone_number(text) to anon, authenticated;
grant execute on function public.calculate_product_unit_price(uuid, integer, integer) to anon, authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'order_items'
  ) then
    alter publication supabase_realtime add table public.order_items;
  end if;
end;
$$;

alter table public.orders replica identity full;

commit;
