begin;

alter table public.admin_profiles enable row level security;
alter table public.door_categories enable row level security;
alter table public.door_products enable row level security;
alter table public.door_product_images enable row level security;
alter table public.door_delivery_tiers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_events enable row level security;

drop policy if exists "Admins can read admin profiles" on public.admin_profiles;
create policy "Admins can read admin profiles"
on public.admin_profiles
for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists "Admins can manage admin profiles" on public.admin_profiles;
create policy "Admins can manage admin profiles"
on public.admin_profiles
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Public can read active categories" on public.door_categories;
create policy "Public can read active categories"
on public.door_categories
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Admins can manage categories" on public.door_categories;
create policy "Admins can manage categories"
on public.door_categories
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Public can read active products" on public.door_products;
create policy "Public can read active products"
on public.door_products
for select
to anon, authenticated
using (
  is_active = true
  and exists (
    select 1
    from public.door_categories c
    where c.id = category_id
      and c.is_active = true
  )
);

drop policy if exists "Admins can manage products" on public.door_products;
create policy "Admins can manage products"
on public.door_products
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Public can read active product images" on public.door_product_images;
create policy "Public can read active product images"
on public.door_product_images
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.door_products p
    join public.door_categories c on c.id = p.category_id
    where p.id = product_id
      and p.is_active = true
      and c.is_active = true
  )
);

drop policy if exists "Admins can manage product images" on public.door_product_images;
create policy "Admins can manage product images"
on public.door_product_images
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Public can read active delivery tiers" on public.door_delivery_tiers;
create policy "Public can read active delivery tiers"
on public.door_delivery_tiers
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.door_products p
    join public.door_categories c on c.id = p.category_id
    where p.id = product_id
      and p.is_active = true
      and c.is_active = true
  )
);

drop policy if exists "Admins can manage delivery tiers" on public.door_delivery_tiers;
create policy "Admins can manage delivery tiers"
on public.door_delivery_tiers
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can read and manage orders" on public.orders;
create policy "Admins can read and manage orders"
on public.orders
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can read and manage order items" on public.order_items;
create policy "Admins can read and manage order items"
on public.order_items
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can read order status events" on public.order_status_events;
create policy "Admins can read order status events"
on public.order_status_events
for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists "Admins can manage order status events" on public.order_status_events;
create policy "Admins can manage order status events"
on public.order_status_events
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

commit;
