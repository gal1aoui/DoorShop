begin;

do $$
declare
  v_category_modern uuid;
  v_category_security uuid;
  v_category_classic uuid;

  v_product_modern_oak uuid;
  v_product_security_steel uuid;
  v_product_classic_panel uuid;

  v_modern_img_1 text := 'https://placehold.co/1200x800/png?text=Modern+Oak+Slim+1';
  v_modern_img_2 text := 'https://placehold.co/1200x800/png?text=Modern+Oak+Slim+2';
  v_modern_img_3 text := 'https://placehold.co/1200x800/png?text=Modern+Oak+Slim+3';

  v_security_img_1 text := 'https://placehold.co/1200x800/png?text=Steel+Guard+Pro+1';
  v_security_img_2 text := 'https://placehold.co/1200x800/png?text=Steel+Guard+Pro+2';
  v_security_img_3 text := 'https://placehold.co/1200x800/png?text=Steel+Guard+Pro+3';

  v_classic_img_1 text := 'https://placehold.co/1200x800/png?text=Classic+Walnut+Panel+1';
  v_classic_img_2 text := 'https://placehold.co/1200x800/png?text=Classic+Walnut+Panel+2';
  v_classic_img_3 text := 'https://placehold.co/1200x800/png?text=Classic+Walnut+Panel+3';
begin
  insert into public.door_categories (name, slug, description, is_active)
  values (
    'Modern Doors',
    'modern-doors',
    'Minimal modern designs for apartments and offices.',
    true
  )
  on conflict (slug) do update
  set
    name = excluded.name,
    description = excluded.description,
    is_active = true,
    updated_at = timezone('utc', now())
  returning id into v_category_modern;

  insert into public.door_categories (name, slug, description, is_active)
  values (
    'Security Doors',
    'security-doors',
    'Reinforced doors with better protection for entrances.',
    true
  )
  on conflict (slug) do update
  set
    name = excluded.name,
    description = excluded.description,
    is_active = true,
    updated_at = timezone('utc', now())
  returning id into v_category_security;

  insert into public.door_categories (name, slug, description, is_active)
  values (
    'Classic Wood',
    'classic-wood',
    'Traditional wood doors for villas and family homes.',
    true
  )
  on conflict (slug) do update
  set
    name = excluded.name,
    description = excluded.description,
    is_active = true,
    updated_at = timezone('utc', now())
  returning id into v_category_classic;

  insert into public.door_products (
    category_id,
    name,
    slug,
    description,
    base_price,
    base_height_cm,
    base_width_cm,
    price_per_extra_cm_height,
    price_per_extra_cm_width,
    thumbnail_url,
    is_active
  )
  values (
    v_category_modern,
    'Modern Oak Slim',
    'modern-oak-slim',
    'Clean oak finish, ideal for interior modern spaces.',
    620.00,
    180,
    100,
    2.50,
    2.20,
    v_modern_img_1,
    true
  )
  on conflict (slug) do update
  set
    category_id = excluded.category_id,
    name = excluded.name,
    description = excluded.description,
    base_price = excluded.base_price,
    base_height_cm = excluded.base_height_cm,
    base_width_cm = excluded.base_width_cm,
    price_per_extra_cm_height = excluded.price_per_extra_cm_height,
    price_per_extra_cm_width = excluded.price_per_extra_cm_width,
    thumbnail_url = excluded.thumbnail_url,
    is_active = true,
    updated_at = timezone('utc', now())
  returning id into v_product_modern_oak;

  insert into public.door_products (
    category_id,
    name,
    slug,
    description,
    base_price,
    base_height_cm,
    base_width_cm,
    price_per_extra_cm_height,
    price_per_extra_cm_width,
    thumbnail_url,
    is_active
  )
  values (
    v_category_security,
    'Steel Guard Pro',
    'steel-guard-pro',
    'Security steel door with anti-break lock support.',
    980.00,
    180,
    100,
    3.20,
    3.10,
    v_security_img_1,
    true
  )
  on conflict (slug) do update
  set
    category_id = excluded.category_id,
    name = excluded.name,
    description = excluded.description,
    base_price = excluded.base_price,
    base_height_cm = excluded.base_height_cm,
    base_width_cm = excluded.base_width_cm,
    price_per_extra_cm_height = excluded.price_per_extra_cm_height,
    price_per_extra_cm_width = excluded.price_per_extra_cm_width,
    thumbnail_url = excluded.thumbnail_url,
    is_active = true,
    updated_at = timezone('utc', now())
  returning id into v_product_security_steel;

  insert into public.door_products (
    category_id,
    name,
    slug,
    description,
    base_price,
    base_height_cm,
    base_width_cm,
    price_per_extra_cm_height,
    price_per_extra_cm_width,
    thumbnail_url,
    is_active
  )
  values (
    v_category_classic,
    'Classic Walnut Panel',
    'classic-walnut-panel',
    'Premium walnut panel style with rich texture.',
    760.00,
    180,
    100,
    2.70,
    2.40,
    v_classic_img_1,
    true
  )
  on conflict (slug) do update
  set
    category_id = excluded.category_id,
    name = excluded.name,
    description = excluded.description,
    base_price = excluded.base_price,
    base_height_cm = excluded.base_height_cm,
    base_width_cm = excluded.base_width_cm,
    price_per_extra_cm_height = excluded.price_per_extra_cm_height,
    price_per_extra_cm_width = excluded.price_per_extra_cm_width,
    thumbnail_url = excluded.thumbnail_url,
    is_active = true,
    updated_at = timezone('utc', now())
  returning id into v_product_classic_panel;

  delete from public.door_delivery_tiers
  where product_id in (
    v_product_modern_oak,
    v_product_security_steel,
    v_product_classic_panel
  );

  delete from public.door_product_images
  where product_id in (
    v_product_modern_oak,
    v_product_security_steel,
    v_product_classic_panel
  );

  insert into public.door_delivery_tiers (product_id, min_quantity, max_quantity, delivery_days)
  values
    (v_product_modern_oak, 1, 5, 4),
    (v_product_modern_oak, 6, 15, 7),
    (v_product_modern_oak, 16, null, 10),
    (v_product_security_steel, 1, 5, 5),
    (v_product_security_steel, 6, 15, 9),
    (v_product_security_steel, 16, null, 13),
    (v_product_classic_panel, 1, 5, 4),
    (v_product_classic_panel, 6, 15, 8),
    (v_product_classic_panel, 16, null, 12);

  insert into public.door_product_images (
    product_id,
    storage_path,
    public_url,
    alt_text,
    sort_order
  )
  values
    (v_product_modern_oak, 'seed/modern-oak-slim-1.png', v_modern_img_1, 'Modern Oak Slim view 1', 0),
    (v_product_modern_oak, 'seed/modern-oak-slim-2.png', v_modern_img_2, 'Modern Oak Slim view 2', 1),
    (v_product_modern_oak, 'seed/modern-oak-slim-3.png', v_modern_img_3, 'Modern Oak Slim view 3', 2),
    (v_product_security_steel, 'seed/steel-guard-pro-1.png', v_security_img_1, 'Steel Guard Pro view 1', 0),
    (v_product_security_steel, 'seed/steel-guard-pro-2.png', v_security_img_2, 'Steel Guard Pro view 2', 1),
    (v_product_security_steel, 'seed/steel-guard-pro-3.png', v_security_img_3, 'Steel Guard Pro view 3', 2),
    (v_product_classic_panel, 'seed/classic-walnut-panel-1.png', v_classic_img_1, 'Classic Walnut Panel view 1', 0),
    (v_product_classic_panel, 'seed/classic-walnut-panel-2.png', v_classic_img_2, 'Classic Walnut Panel view 2', 1),
    (v_product_classic_panel, 'seed/classic-walnut-panel-3.png', v_classic_img_3, 'Classic Walnut Panel view 3', 2);
end;
$$;

commit;
