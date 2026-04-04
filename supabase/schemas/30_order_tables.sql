begin;

create table if not exists public.orders (
  id uuid primary key default extensions.gen_random_uuid(),
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
  id uuid primary key default extensions.gen_random_uuid(),
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

commit;
