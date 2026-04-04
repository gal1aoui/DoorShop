# Supabase SQL Layout

Recommended: run a single unified file:

1. `setup_all_in_one.sql`

Step-by-step modular order:

1. `schemas/00_extensions.sql`
2. `schemas/05_types.sql`
3. `schemas/10_admin_profiles.sql`
4. `schemas/20_catalog_tables.sql`
5. `schemas/30_order_tables.sql`
6. `schemas/40_storage_bucket.sql`
7. `policies/00_admin_function.sql`
8. `policies/10_table_rls_policies.sql`
9. `policies/20_storage_policies.sql`
10. `triggers/00_functions_core.sql`
11. `triggers/10_table_triggers.sql`
12. `triggers/20_rpc_functions.sql`
13. `triggers/30_grants_and_realtime.sql`
14. `seeds/00_seed_admin.sql`
15. `seeds/10_seed_catalog.sql`
16. `seeds/20_seed_orders.sql`

## Admin bootstrap

Create this auth user first in Supabase Dashboard (`Authentication > Users`):

- Email: `admin@admin.com`
- Password: `a123456A`

Then run the seed to grant admin access in `public.admin_profiles`.

## Public order flow

- Users place orders via RPC: `create_order_with_items`.
- Users track orders via RPC: `get_order_tracking`.
- `tracking_token` is generated from normalized phone + order id hash in DB trigger.

## Product images

- Products can store multiple images in `public.door_product_images`.
- Storage bucket `door-product-images` is created by schema SQL.
- Public users can read image objects, while only admins can upload/update/delete.

## Realtime

`triggers/30_grants_and_realtime.sql` adds `orders` and `order_items`
to `supabase_realtime` publication so admins can receive live updates.
