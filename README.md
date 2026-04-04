# Boudokhane Doors

Door selling app with:

- Public catalog (no login)
- Custom-size ordering (height/width in cm)
- Multi-image products with animated swipeable carousel
- Secure tracking link per order
- Admin console (login required) for products, order management, and analytics
- Supabase realtime updates for new/updated orders

## Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- MUI + Emotion
- Supabase (Postgres, Auth, Realtime, RPC)
- Biome (lint/format)

## Code structure

- `services/`: all Supabase and API calls
- `types/`: shared domain/database/service typings
- `utils/`: pure helpers (formatters, pricing, status helpers)
- `proxy.ts`: route protection for `/admin/*` (non-admin users are redirected)

## Environment

Create a `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Database setup (Supabase SQL editor)

Run files in this exact order:

1. `supabase/schemas/00_extensions.sql`
2. `supabase/schemas/10_tables.sql`
3. `supabase/policies/10_rls_policies.sql`
4. `supabase/triggers/10_functions_and_triggers.sql`
5. `supabase/seeds/00_seed_admin.sql`
6. `supabase/seeds/10_seed_catalog.sql`
7. `supabase/seeds/20_seed_orders.sql`

Default seeded admin:

- Email: `admin@admin.com`
- Password: `a123456A`

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Key routes

- `/` catalog with category + price filters
- `/products/[productId]` product details and order placement
- `/track` track-token lookup
- `/track/[token]` order status/details page
- `/admin/login` admin sign in
- `/admin/orders` admin realtime order management + status updates
- `/admin/products` admin product/category/delivery-tier creation
- `/admin/analytics` sales and order stats
