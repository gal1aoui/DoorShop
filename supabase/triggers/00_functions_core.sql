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
    new.id := extensions.gen_random_uuid();
  end if;

  new.phone_number_normalized := public.normalize_phone_number(new.phone_number);

  if new.phone_number_normalized = '' then
    raise exception 'Phone number is required.';
  end if;

  if tg_op = 'INSERT' and new.tracking_token is null then
    new.tracking_token := encode(
      extensions.digest(new.phone_number_normalized || ':' || new.id::text, 'sha256'),
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

commit;
