begin;

do $$
begin
  if exists (
    select 1
    from pg_type
    where typname = 'order_status'
  ) and not exists (
    select 1
    from pg_type t
    join pg_enum e on e.enumtypid = t.oid
    where t.typname = 'order_status'
      and e.enumlabel = 'rejected'
  ) then
    alter type public.order_status add value 'rejected';
  end if;
end;
$$;

alter table public.orders
add column if not exists rejection_reason text;

update public.orders
set rejection_reason = nullif(trim(coalesce(rejection_reason, '')), '');

update public.orders
set rejection_reason = null
where status::text <> 'rejected';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_rejection_reason_when_rejected_check'
  ) then
    alter table public.orders
    add constraint orders_rejection_reason_when_rejected_check
    check (
      case
        when status::text = 'rejected' then nullif(trim(coalesce(rejection_reason, '')), '') is not null
        else rejection_reason is null
      end
    );
  end if;
end;
$$;

create or replace function public.enforce_order_rejection_reason()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.rejection_reason := nullif(trim(coalesce(new.rejection_reason, '')), '');

  if new.status::text = 'rejected' and new.rejection_reason is null then
    raise exception 'Rejection reason is required when status is rejected.';
  end if;

  if new.status::text <> 'rejected' then
    new.rejection_reason := null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_01_enforce_order_rejection_reason on public.orders;
create trigger trg_01_enforce_order_rejection_reason
before insert or update on public.orders
for each row
execute function public.enforce_order_rejection_reason();

drop function if exists public.get_order_tracking(text);

create function public.get_order_tracking(p_tracking_token text)
returns table (
  order_id uuid,
  tracking_token text,
  full_name text,
  delivery_location text,
  customer_note text,
  rejection_reason text,
  wanted_date date,
  status public.order_status,
  status_updated_at timestamptz,
  created_at timestamptz,
  items jsonb,
  history jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select
    o.id as order_id,
    o.tracking_token,
    o.full_name,
    o.delivery_location,
    o.customer_note,
    o.rejection_reason,
    o.wanted_date,
    o.status,
    o.status_updated_at,
    o.created_at,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', oi.id,
            'product_id', p.id,
            'product_name', p.name,
            'quantity', oi.quantity,
            'height_cm', oi.height_cm,
            'width_cm', oi.width_cm,
            'unit_price', oi.unit_price,
            'subtotal', oi.subtotal
          )
          order by p.name asc
        )
        from public.order_items oi
        join public.door_products p on p.id = oi.product_id
        where oi.order_id = o.id
      ),
      '[]'::jsonb
    ) as items,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'status', e.status,
            'created_at', e.created_at
          )
          order by e.created_at asc
        )
        from public.order_status_events e
        where e.order_id = o.id
      ),
      '[]'::jsonb
    ) as history
  from public.orders o
  where o.tracking_token = p_tracking_token;
$$;

grant execute on function public.get_order_tracking(text) to anon, authenticated;

drop policy if exists "Admins can delete orders" on public.orders;
create policy "Admins can delete orders"
on public.orders
for delete
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists "Admins can delete order items" on public.order_items;
create policy "Admins can delete order items"
on public.order_items
for delete
to authenticated
using (public.is_admin(auth.uid()));

commit;
