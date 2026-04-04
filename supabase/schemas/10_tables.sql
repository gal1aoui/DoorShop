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

create table if not exists public.admin_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.door_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug citext not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint door_categories_slug_format check (slug ~ '^[a-z0-9-]+$')
);

create table if not exists public.door_products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.door_categories (id) on delete restrict,
  name text not null,
  slug citext not null unique,
  description text,
  base_price numeric(12, 2) not null check (base_price >= 0),
  base_height_cm integer not null default 180 check (base_height_cm > 0),
  base_width_cm integer not null default 100 check (base_width_cm > 0),
  price_per_extra_cm_height numeric(12, 2) not null default 0 check (price_per_extra_cm_height >= 0),
  price_per_extra_cm_width numeric(12, 2) not null default 0 check (price_per_extra_cm_width >= 0),
  thumbnail_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint door_products_slug_format check (slug ~ '^[a-z0-9-]+$')
);

create index if not exists idx_door_products_category_id on public.door_products (category_id);
create index if not exists idx_door_products_price on public.door_products (base_price);

create table if not exists public.door_product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.door_products (id) on delete cascade,
  storage_path text not null unique,
  public_url text not null,
  alt_text text,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_door_product_images_product_id on public.door_product_images (product_id);
create index if not exists idx_door_product_images_sort_order on public.door_product_images (product_id, sort_order);

create table if not exists public.door_delivery_tiers (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.door_products (id) on delete cascade,
  min_quantity integer not null check (min_quantity > 0),
  max_quantity integer check (max_quantity is null or max_quantity >= min_quantity),
  delivery_days integer not null check (delivery_days > 0),
  created_at timestamptz not null default timezone('utc', now()),
  unique (product_id, min_quantity, max_quantity)
);

create index if not exists idx_door_delivery_tiers_product_id on public.door_delivery_tiers (product_id);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  tracking_token text unique,
  full_name text not null check (char_length(trim(full_name)) >= 2),
  phone_number text not null check (char_length(trim(phone_number)) >= 6),
  phone_number_normalized text not null,
  delivery_location text not null,
  customer_note text,
  wanted_date date not null,
  status public.order_status not null default 'received',
  status_updated_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_orders_tracking_token on public.orders (tracking_token);
create index if not exists idx_orders_phone_normalized on public.orders (phone_number_normalized);
create index if not exists idx_orders_status on public.orders (status);
create index if not exists idx_orders_created_at on public.orders (created_at desc);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.door_products (id) on delete restrict,
  quantity integer not null check (quantity > 0),
  height_cm integer not null check (height_cm > 0),
  width_cm integer not null check (width_cm > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  subtotal numeric(14, 2) generated always as (quantity::numeric * unit_price) stored,
  created_at timestamptz not null default timezone('utc', now()),
  unique (order_id, product_id, height_cm, width_cm)
);

create index if not exists idx_order_items_order_id on public.order_items (order_id);
create index if not exists idx_order_items_product_id on public.order_items (product_id);

create table if not exists public.order_status_events (
  id bigserial primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  status public.order_status not null,
  changed_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_order_status_events_order_id on public.order_status_events (order_id, created_at desc);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'door-product-images',
  'door-product-images',
  true,
  8388608,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

commit;
