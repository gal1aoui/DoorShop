begin;

create table if not exists public.door_categories (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null unique,
  slug citext not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint door_categories_slug_format check (slug ~ '^[a-z0-9-]+$')
);

create table if not exists public.door_products (
  id uuid primary key default extensions.gen_random_uuid(),
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
  id uuid primary key default extensions.gen_random_uuid(),
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
  id uuid primary key default extensions.gen_random_uuid(),
  product_id uuid not null references public.door_products (id) on delete cascade,
  min_quantity integer not null check (min_quantity > 0),
  max_quantity integer check (max_quantity is null or max_quantity >= min_quantity),
  delivery_days integer not null check (delivery_days > 0),
  created_at timestamptz not null default timezone('utc', now()),
  unique (product_id, min_quantity, max_quantity)
);

create index if not exists idx_door_delivery_tiers_product_id on public.door_delivery_tiers (product_id);

commit;
