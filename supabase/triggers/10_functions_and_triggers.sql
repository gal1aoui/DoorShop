begin;

create or replace function public.normalize_phone_number(p_phone text)
returns text
language sql
immutable
as $$
  select regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
$$;

create or replace function public.calculate_product_unit_price(
  p_product_id uuid,
  p_height_cm integer,
  p_width_cm integer
)
returns numeric
language plpgsql
stable
set search_path = public
as $$
declare
  v_product public.door_products%rowtype;
  v_height_delta integer;
  v_width_delta integer;
  v_price numeric(12, 2);
begin
  select *
  into v_product
  from public.door_products
  where id = p_product_id
    and is_active = true;

  if not found then
    raise exception 'Invalid product id or inactive product: %', p_product_id;
  end if;

  if p_height_cm <= 0 or p_width_cm <= 0 then
    raise exception 'Dimensions must be positive numbers.';
  end if;

  v_height_delta := greatest(p_height_cm - v_product.base_height_cm, 0);
  v_width_delta := greatest(p_width_cm - v_product.base_width_cm, 0);

  v_price := v_product.base_price
    + (v_height_delta * v_product.price_per_extra_cm_height)
    + (v_width_delta * v_product.price_per_extra_cm_width);

  return round(v_price, 2);
end;
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

create or replace function public.prepare_order_before_write()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.id is null then
    new.id := gen_random_uuid();
  end if;

  new.phone_number_normalized := public.normalize_phone_number(new.phone_number);

  if new.phone_number_normalized = '' then
    raise exception 'Phone number is required.';
  end if;

  if tg_op = 'INSERT' and new.tracking_token is null then
    new.tracking_token := encode(
      digest(new.phone_number_normalized || ':' || new.id::text, 'sha256'),
      'hex'
    );
  end if;

  if tg_op = 'INSERT' then
    new.status_updated_at := coalesce(new.status_updated_at, timezone('utc', now()));
  elsif new.status is distinct from old.status then
    new.status_updated_at := timezone('utc', now());
  end if;

  new.updated_at := timezone('utc', now());

  return new;
end;
$$;

create or replace function public.merge_duplicate_order_items()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_existing_id uuid;
begin
  select id
  into v_existing_id
  from public.order_items
  where order_id = new.order_id
    and product_id = new.product_id
    and height_cm = new.height_cm
    and width_cm = new.width_cm
  limit 1;

  if v_existing_id is not null then
    update public.order_items
    set quantity = quantity + new.quantity
    where id = v_existing_id;

    return null;
  end if;

  return new;
end;
$$;

create or replace function public.apply_order_item_defaults()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.unit_price := public.calculate_product_unit_price(
    new.product_id,
    new.height_cm,
    new.width_cm
  );

  return new;
end;
$$;

create or replace function public.log_order_status_event()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.order_status_events (order_id, status, changed_by)
    values (new.id, new.status, auth.uid());
    return new;
  end if;

  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    insert into public.order_status_events (order_id, status, changed_by)
    values (new.id, new.status, auth.uid());
  end if;

  return new;
end;
$$;

drop trigger if exists trg_set_categories_updated_at on public.door_categories;
create trigger trg_set_categories_updated_at
before update on public.door_categories
for each row
execute function public.set_updated_at();

drop trigger if exists trg_set_products_updated_at on public.door_products;
create trigger trg_set_products_updated_at
before update on public.door_products
for each row
execute function public.set_updated_at();

drop trigger if exists trg_set_product_images_updated_at on public.door_product_images;
create trigger trg_set_product_images_updated_at
before update on public.door_product_images
for each row
execute function public.set_updated_at();

drop trigger if exists trg_prepare_order_before_write on public.orders;
create trigger trg_prepare_order_before_write
before insert or update on public.orders
for each row
execute function public.prepare_order_before_write();

drop trigger if exists trg_05_merge_duplicate_order_items on public.order_items;
create trigger trg_05_merge_duplicate_order_items
before insert on public.order_items
for each row
execute function public.merge_duplicate_order_items();

drop trigger if exists trg_10_apply_order_item_defaults on public.order_items;
create trigger trg_10_apply_order_item_defaults
before insert or update on public.order_items
for each row
execute function public.apply_order_item_defaults();

drop trigger if exists trg_log_order_status_event on public.orders;
create trigger trg_log_order_status_event
after insert or update on public.orders
for each row
execute function public.log_order_status_event();

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
