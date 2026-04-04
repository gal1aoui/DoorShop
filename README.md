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

Run this single file in Supabase SQL editor:

1. `supabase/setup_all_in_one.sql`

If you still prefer modular SQL files, use the order documented in `supabase/README.md`.

Admin account:

- Email: `admin@admin.com`
- Password: `a123456A`

Important: create this user first in Supabase Dashboard (`Authentication > Users`), then run SQL seeds. The seed now only grants admin role in `public.admin_profiles` for an existing auth user.

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
