# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DeportivoStore is an e-commerce application for sports team jerseys built with Next.js 15 (App Router), TypeScript, Tailwind CSS v4, and shadcn/ui. The project adheres to an edgy, high-contrast visual editorial pattern inspired by modern sport/fashion interfaces.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Run production build locally
npm run lint     # ESLint check
npx prisma migrate dev   # Run DB migrations
npx prisma db seed       # Seed database (ts-node prisma/seed.ts)
npx prisma studio        # Visual DB browser
```

No test suite exists yet.

## Architecture

### Data Flow

1. **Browse** → Products from `src/lib/data.ts` (mock) or Prisma `Product` model (DB-backed)
2. **Cart** → Client-side React Context (`CartProvider`) persisted to localStorage; synced to `Cart`/`CartItem` tables on login
3. **Checkout** → POST `/api/checkout/stripe` → SERIALIZABLE transaction (stock check + decrement + Order creation) → Stripe session redirect
4. **Payment confirmation** → Stripe webhook (`/api/webhooks/stripe`) → Order status PENDING→PAID + Resend email
5. **Auth** → Supabase Auth → webhook (`/api/webhooks/supabase`) syncs user to Prisma `User` table + welcome email

### Route Handlers vs Server Actions

- **Route Handlers** (`/api/*`): Used for Stripe checkout, Stripe webhooks, and Supabase webhooks — these must be REST endpoints because they are called by external services or require raw `Request` access.
- **Server Actions**: Used for all other data mutations (auth actions, profile updates, admin CRUD).

### Stock Management

Stock is reserved **at checkout** (not at payment) inside a `SERIALIZABLE` Prisma transaction that atomically checks and decrements variant stock. If Stripe payment expires (30 min) or fails, the webhook restores stock. This prevents overselling.

### Authentication

Supabase Auth with `@supabase/ssr` adapters for SSR compatibility. `src/middleware.ts` refreshes sessions on every request and enforces route protection:
- `/profile`, `/orders`, `/checkout` → require auth
- `/admin/*` → require auth + `ADMIN` role (checked via Supabase REST API at edge)
- `/login`, `/register` → redirect authenticated users to `/profile`

Rate limiting is applied per-route in middleware (auth: 5 req/min, checkout: 5 req/min, API: 30 req/min).

### Webhook Idempotency

`WebhookEvent` table tracks processed Stripe event IDs to prevent duplicate order/email processing.

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/data.ts` | Mock product catalog (UI phase; replace with Prisma queries) |
| `src/middleware.ts` | Session refresh, auth guards, role checks, rate limiting |
| `prisma/schema.prisma` | Full data model: User, Product, Variant, Order, Cart, Address |
| `src/app/api/checkout/stripe/route.ts` | Stripe checkout session creation + stock reservation |
| `src/app/api/webhooks/stripe/route.ts` | Payment status updates + stock restoration |

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
DATABASE_URL          # Pooled (port 6543, pgbouncer) for runtime
DIRECT_URL            # Direct (port 5432) for Prisma migrations
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
SUPABASE_WEBHOOK_SECRET
RESEND_API_KEY
```

## Styling System

- Tailwind CSS v4 (no `tailwind.config.js`; configured via CSS `@theme`).
- High-contrast, sharp "edgy" aesthetic: `rounded-none`, heavy bold/uppercase fonts, `bg-[#18181b]` for dark surfaces.
- Use `cn()` from `src/lib/utils.ts` for class merging.
- Image remote patterns: `images.unsplash.com`, `plus.unsplash.com`, Supabase CDN.

## Component Organization

```
src/components/
├── layout/      # Navbar (with top announcement bar), Footer
├── home/        # HeroBanner (edge-to-edge), ProductGrid
├── products/    # Product specs, Size/Color selectors
├── cart/        # CartDrawer (shadcn Sheet)
├── ui/          # shadcn/ui primitives (all set to sharp/rounded-none)
```

## Rules

- En el backend usa **Server Actions** donde sea posible; Route Handlers solo para webhooks externos y endpoints que requieran acceso raw a `Request`.
- Mantén el look edgy y deportivo: sin bordes redondeados excesivos, alto contraste, tipografía bold/uppercase.
- `page.tsx` files are Server Components that fetch data directly; avoid adding `"use client"` to page files.
