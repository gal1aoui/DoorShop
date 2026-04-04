begin;

create or replace function public.create_order_with_items(
  p_full_name text,
  p_phone_number text,
  p_delivery_location text,
  p_customer_note text,
  p_wanted_date date,
  p_items jsonb
)
returns table (
  order_id uuid,
  tracking_token text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_order_id uuid;
  v_tracking_token text;
  v_product_id uuid;
  v_quantity integer;
  v_height_cm integer;
  v_width_cm integer;
begin
  if p_items is null then
    raise exception 'At least one order item is required.';
  end if;

  if jsonb_typeof(p_items) <> 'array' then
    raise exception 'Order items payload must be a JSON array.';
  end if;

  if jsonb_array_length(p_items) = 0 then
    raise exception 'At least one order item is required.';
  end if;

  if p_wanted_date is null then
    raise exception 'Wanted delivery date is required.';
  end if;

  insert into public.orders (
    full_name,
    phone_number,
    delivery_location,
    customer_note,
    wanted_date
  )
  values (
    trim(p_full_name),
    trim(p_phone_number),
    trim(p_delivery_location),
    nullif(trim(coalesce(p_customer_note, '')), ''),
    p_wanted_date
  )
  returning id, orders.tracking_token into v_order_id, v_tracking_token;

  for v_item in
    select value
    from jsonb_array_elements(p_items) as payload(value)
  loop
    v_product_id := (v_item ->> 'product_id')::uuid;
    v_quantity := coalesce((v_item ->> 'quantity')::integer, 0);
    v_height_cm := coalesce((v_item ->> 'height_cm')::integer, 0);
    v_width_cm := coalesce((v_item ->> 'width_cm')::integer, 0);

    if v_product_id is null then
      raise exception 'Each item needs a valid product_id.';
    end if;

    if v_quantity <= 0 or v_height_cm <= 0 or v_width_cm <= 0 then
      raise exception 'Quantity, height, and width must be positive values.';
    end if;

    insert into public.order_items (
      order_id,
      product_id,
      quantity,
      height_cm,
      width_cm,
      unit_price
    )
    values (
      v_order_id,
      v_product_id,
      v_quantity,
      v_height_cm,
      v_width_cm,
      0
    );
  end loop;

  order_id := v_order_id;
  tracking_token := v_tracking_token;
  return next;
end;
$$;

create or replace function public.get_order_tracking(p_tracking_token text)
returns table (
  order_id uuid,
  tracking_token text,
  full_name text,
  delivery_location text,
  customer_note text,
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

commit;
