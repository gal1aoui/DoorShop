# Supabase SQL Layout

Run SQL files in this order:

1. `schemas/00_extensions.sql`
2. `schemas/10_tables.sql`
3. `policies/10_rls_policies.sql`
4. `triggers/10_functions_and_triggers.sql`
5. `seeds/00_seed_admin.sql`
6. `seeds/10_seed_catalog.sql`
7. `seeds/20_seed_orders.sql`

## Admin bootstrap

Seeder creates or updates this admin account automatically:

- Email: `admin@admin.com`
- Password: `a123456A`

It also ensures the user is added to `public.admin_profiles`.

## Public order flow

- Users place orders via RPC: `create_order_with_items`.
- Users track orders via RPC: `get_order_tracking`.
- `tracking_token` is generated from normalized phone + order id hash in DB trigger.

## Product images

- Products can store multiple images in `public.door_product_images`.
- Storage bucket `door-product-images` is created by schema SQL.
- Public users can read image objects, while only admins can upload/update/delete.

## Realtime

`triggers/10_functions_and_triggers.sql` also adds `orders` and `order_items`
to `supabase_realtime` publication so admins can receive live updates.
