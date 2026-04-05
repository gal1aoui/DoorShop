begin;

create or replace function public.get_public_product_highlights(
  p_limit integer default 4
)
returns table (
  product_id uuid,
  order_count bigint,
  total_units bigint,
  total_revenue numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with ranked as (
    select
      p.id as product_id,
      count(distinct oi.order_id)
        filter (where o.status <> 'rejected')::bigint as order_count,
      coalesce(
        sum(oi.quantity) filter (where o.status <> 'rejected'),
        0
      )::bigint as total_units,
      coalesce(
        sum(oi.subtotal) filter (where o.status <> 'rejected'),
        0
      )::numeric as total_revenue,
      max(o.created_at) filter (where o.status <> 'rejected') as last_ordered_at,
      p.created_at as product_created_at
    from public.door_products p
    join public.door_categories c on c.id = p.category_id
    left join public.order_items oi on oi.product_id = p.id
    left join public.orders o on o.id = oi.order_id
    where p.is_active = true
      and c.is_active = true
    group by p.id, p.created_at
  )
  select
    product_id,
    order_count,
    total_units,
    total_revenue
  from ranked
  order by
    total_units desc,
    order_count desc,
    coalesce(last_ordered_at, to_timestamp(0)) desc,
    product_created_at desc
  limit greatest(1, least(coalesce(p_limit, 4), 24));
$$;

grant execute on function public.get_public_product_highlights(integer)
to anon, authenticated;

commit;
