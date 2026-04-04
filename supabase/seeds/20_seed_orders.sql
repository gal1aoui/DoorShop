begin;

do $$
declare
  v_modern_product_id uuid;
  v_security_product_id uuid;
  v_classic_product_id uuid;

  v_order_1 uuid;
  v_order_2 uuid;
  v_order_3 uuid;
begin
  select id
  into v_modern_product_id
  from public.door_products
  where slug = 'modern-oak-slim';

  select id
  into v_security_product_id
  from public.door_products
  where slug = 'steel-guard-pro';

  select id
  into v_classic_product_id
  from public.door_products
  where slug = 'classic-walnut-panel';

  if v_modern_product_id is null
    or v_security_product_id is null
    or v_classic_product_id is null then
    raise exception 'Seed products are missing. Run 10_seed_catalog.sql first.';
  end if;

  select id
  into v_order_1
  from public.orders
  where full_name = 'Mohamed Trabelsi'
    and phone_number = '+216 22 111 222'
    and wanted_date = date '2026-04-20'
  limit 1;

  if v_order_1 is null then
    insert into public.orders (
      full_name,
      phone_number,
      delivery_location,
      customer_note,
      wanted_date,
      status
    )
    values (
      'Mohamed Trabelsi',
      '+216 22 111 222',
      'Tunis, El Menzah',
      'Front entrance for new apartment project.',
      date '2026-04-20',
      'confirmed'
    )
    returning id into v_order_1;
  end if;

  if not exists (select 1 from public.order_items where order_id = v_order_1) then
    insert into public.order_items (
      order_id,
      product_id,
      quantity,
      height_cm,
      width_cm,
      unit_price
    )
    values
      (v_order_1, v_modern_product_id, 10, 180, 100, 0),
      (v_order_1, v_modern_product_id, 2, 200, 110, 0);
  end if;

  select id
  into v_order_2
  from public.orders
  where full_name = 'Sami Ben Amor'
    and phone_number = '+216 55 333 444'
    and wanted_date = date '2026-04-24'
  limit 1;

  if v_order_2 is null then
    insert into public.orders (
      full_name,
      phone_number,
      delivery_location,
      customer_note,
      wanted_date,
      status
    )
    values (
      'Sami Ben Amor',
      '+216 55 333 444',
      'Sfax, Sakiet Ezzit',
      'Need better lock support for office.',
      date '2026-04-24',
      'constructing'
    )
    returning id into v_order_2;
  end if;

  if not exists (select 1 from public.order_items where order_id = v_order_2) then
    insert into public.order_items (
      order_id,
      product_id,
      quantity,
      height_cm,
      width_cm,
      unit_price
    )
    values
      (v_order_2, v_security_product_id, 6, 180, 100, 0),
      (v_order_2, v_security_product_id, 1, 190, 105, 0);
  end if;

  select id
  into v_order_3
  from public.orders
  where full_name = 'Olfa Gharbi'
    and phone_number = '+216 98 777 888'
    and wanted_date = date '2026-04-30'
  limit 1;

  if v_order_3 is null then
    insert into public.orders (
      full_name,
      phone_number,
      delivery_location,
      customer_note,
      wanted_date,
      status
    )
    values (
      'Olfa Gharbi',
      '+216 98 777 888',
      'Nabeul, Hammamet',
      'Villa renovation batch 2.',
      date '2026-04-30',
      'received'
    )
    returning id into v_order_3;
  end if;

  if not exists (select 1 from public.order_items where order_id = v_order_3) then
    insert into public.order_items (
      order_id,
      product_id,
      quantity,
      height_cm,
      width_cm,
      unit_price
    )
    values
      (v_order_3, v_classic_product_id, 8, 180, 100, 0),
      (v_order_3, v_classic_product_id, 3, 210, 120, 0);
  end if;
end;
$$;

commit;
